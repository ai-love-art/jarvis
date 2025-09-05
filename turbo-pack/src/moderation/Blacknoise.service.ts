import { EventBus, GlobalEventBus } from "../core/EventBus.service";
import { v4 as uuidv4 } from 'uuid';

export interface Redflag {
  id: string;
  reason: string;
  severity: number; // 0-1, where 1 is most severe
  timestamp: number;
  originalContent: any;
  contentType: 'text' | 'image' | 'audio' | 'video' | 'link' | 'code';
  reporter?: string; // Who flagged this (user, agent, automated)
  status: 'pending' | 'confirmed' | 'dismissed' | 'remixed';
}

export interface ModerationAction {
  id: string;
  flagId: string;
  action: 'blackout' | 'blur' | 'desaturate' | 'remix' | 'remove';
  timestamp: number;
  performedBy?: string;
  remixedContent?: any;
}

/**
 * Blacknoise - Content moderation system that can black out, remix, or transform inappropriate content
 */
export class Blacknoise {
  private flags: Redflag[] = [];
  private actions: ModerationAction[] = [];
  private maxFlags = 1000;

  private bus: EventBus;

  constructor(bus: EventBus = GlobalEventBus) {
    this.bus = bus;
    // Listen for moderation events
    this.bus.on('moderation/*', this.handleModerationEvent.bind(this));
  }

  /**
   * Flag content for moderation
   */
  redflag(
    content: any, 
    reason: string, 
    severity: number = 0.5, 
    contentType: Redflag['contentType'] = 'text',
    reporter?: string
  ): Redflag {
    const flag: Redflag = {
      id: uuidv4(),
      reason,
      severity: Math.max(0, Math.min(1, severity)), // Clamp to 0-1
      originalContent: content,
      contentType,
      timestamp: Date.now(),
      reporter,
      status: 'pending'
    };

    this.flags.push(flag);
    
    // Keep flags array manageable
    if (this.flags.length > this.maxFlags) {
      this.flags.shift();
    }

    // Emit redflag event
    this.bus.emit('moderation/redflag', flag);

    // Automatically apply moderation based on severity
    if (severity > 0.8) {
      this.applyModeration(flag.id, 'blackout');
    } else if (severity > 0.5) {
      this.applyModeration(flag.id, 'blur');
    } else if (severity > 0.3) {
      this.applyModeration(flag.id, 'desaturate');
    }

    return flag;
  }

  /**
   * Apply a moderation action to flagged content
   */
  applyModeration(
    flagId: string, 
    actionType: ModerationAction['action'], 
    performedBy?: string,
    remixedContent?: any
  ): ModerationAction | null {
    const flag = this.flags.find(f => f.id === flagId);
    if (!flag) return null;

    const action: ModerationAction = {
      id: uuidv4(),
      flagId,
      action: actionType,
      timestamp: Date.now(),
      performedBy,
      remixedContent
    };

    this.actions.push(action);

    // Update flag status
    if (actionType === 'remix') {
      flag.status = 'remixed';
    } else {
      flag.status = 'confirmed';
    }

    // Emit moderation action
    this.bus.emit('moderation/action', {
      flag,
      action,
      strategy: this.getStrategy(flag.severity, actionType)
    });

    return action;
  }

  /**
   * Remix inappropriate content into something creative/educational
   */
  remixContent(flagId: string, remixFunction: (content: any) => any, performedBy?: string): any {
    const flag = this.flags.find(f => f.id === flagId);
    if (!flag) return null;

    try {
      const remixedContent = remixFunction(flag.originalContent);
      
      this.applyModeration(flagId, 'remix', performedBy, remixedContent);
      
      this.bus.emit('moderation/remix', {
        original: flag.originalContent,
        remixed: remixedContent,
        flag
      });

      return remixedContent;
    } catch (error) {
      console.error('Failed to remix content:', error);
      // Fallback to blackout if remix fails
      this.applyModeration(flagId, 'blackout', performedBy);
      return null;
    }
  }

  /**
   * Get the appropriate moderation strategy
   */
  private getStrategy(severity: number, action: ModerationAction['action']): string {
    switch (action) {
      case 'blackout':
        return 'total-blackout'; // Complete masking
      case 'blur':
        return severity > 0.7 ? 'heavy-blur' : 'light-blur';
      case 'desaturate':
        return 'color-drain'; // Remove colors, make grayscale
      case 'remix':
        return 'creative-transformation'; // Turn into art/education
      case 'remove':
        return 'complete-removal';
      default:
        return 'soft-warning';
    }
  }

  /**
   * Get all flags with optional filtering
   */
  getFlags(filter?: Partial<Redflag>): Redflag[] {
    if (!filter) return [...this.flags];
    
    return this.flags.filter(flag =>
      Object.entries(filter).every(([key, value]) =>
        (flag as any)[key] === value
      )
    );
  }

  /**
   * Get moderation actions for a flag
   */
  getActionsForFlag(flagId: string): ModerationAction[] {
    return this.actions.filter(action => action.flagId === flagId);
  }

  /**
   * Dismiss a flag (mark as false positive)
   */
  dismissFlag(flagId: string, performedBy?: string): boolean {
    const flag = this.flags.find(f => f.id === flagId);
    if (!flag) return false;

    flag.status = 'dismissed';
    
    this.bus.emit('moderation/dismissed', { flag, performedBy });
    return true;
  }

  /**
   * Get moderation statistics
   */
  getStats() {
    const statusCounts = this.flags.reduce((acc, flag) => {
      acc[flag.status] = (acc[flag.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const severityDistribution = this.flags.reduce((acc, flag) => {
      const bucket = Math.floor(flag.severity * 10) / 10;
      acc[bucket] = (acc[bucket] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const actionCounts = this.actions.reduce((acc, action) => {
      acc[action.action] = (acc[action.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalFlags: this.flags.length,
      totalActions: this.actions.length,
      statusDistribution: statusCounts,
      severityDistribution,
      actionDistribution: actionCounts,
      averageSeverity: this.flags.length > 0 
        ? this.flags.reduce((sum, flag) => sum + flag.severity, 0) / this.flags.length 
        : 0
    };
  }

  /**
   * Handle moderation events from the EventBus
   */
  private handleModerationEvent(_payload: any) {
    // This can be extended to handle automatic moderation triggers
    // from other parts of the system
  }

  /**
   * Export moderation log
   */
  exportLog(): string {
    return JSON.stringify({
      flags: this.flags,
      actions: this.actions,
      stats: this.getStats(),
      exportedAt: Date.now()
    }, null, 2);
  }

  /**
   * Clear all moderation data (use with caution)
   */
  clear(): void {
    this.flags = [];
    this.actions = [];
    this.bus.emit('moderation/cleared', { timestamp: Date.now() });
  }
}

// Global Blacknoise instance
export const BlacknoiseService = new Blacknoise();