import { v4 as uuidv4 } from 'uuid';

export interface Breadcrumb {
  id: string;
  timestamp: number;
  level: 'info' | 'semantic' | 'poetic' | 'debug' | 'moderation';
  agent?: string;
  message: string;
  data?: any;
}

/**
 * BreadcrumbWriter - Logs system activities and agent interactions
 */
export class BreadcrumbWriter {
  private store: Breadcrumb[] = [];
  private maxSize = 5000;

  /**
   * Write a new breadcrumb to the log
   */
  write(b: Omit<Breadcrumb, 'id' | 'timestamp'>): Breadcrumb {
    const crumb: Breadcrumb = {
      id: uuidv4(),
      timestamp: Date.now(),
      ...b
    };
    
    this.store.push(crumb);
    
    // Keep store size manageable
    if (this.store.length > this.maxSize) {
      this.store.shift();
    }
    
    return crumb;
  }

  /**
   * Query breadcrumbs with optional filters
   */
  query(filter?: Partial<Breadcrumb>): Breadcrumb[] {
    if (!filter) return [...this.store];
    
    return this.store.filter(crumb =>
      Object.entries(filter).every(([key, value]) => 
        (crumb as any)[key] === value
      )
    );
  }

  /**
   * Get recent breadcrumbs
   */
  getRecent(count: number = 50): Breadcrumb[] {
    return this.store.slice(-count);
  }

  /**
   * Get breadcrumbs by level
   */
  getByLevel(level: Breadcrumb['level']): Breadcrumb[] {
    return this.store.filter(crumb => crumb.level === level);
  }

  /**
   * Get breadcrumbs by agent
   */
  getByAgent(agent: string): Breadcrumb[] {
    return this.store.filter(crumb => crumb.agent === agent);
  }

  /**
   * Export breadcrumbs in different formats
   */
  export(mode: 'jsonl' | 'poetic' | 'csv'): string {
    switch (mode) {
      case 'jsonl':
        return this.store.map(crumb => JSON.stringify(crumb)).join('\n');
      
      case 'poetic':
        return this.store
          .filter(crumb => crumb.level === 'semantic' || crumb.level === 'poetic')
          .map(crumb => {
            const timestamp = new Date(crumb.timestamp).toISOString();
            const agent = crumb.agent ? ` (${crumb.agent})` : '';
            return `[${timestamp}]${agent}: ${crumb.message}`;
          })
          .join('\n');
      
      case 'csv':
        const headers = 'timestamp,level,agent,message';
        const rows = this.store.map(crumb => {
          const timestamp = new Date(crumb.timestamp).toISOString();
          const agent = crumb.agent || '';
          const message = crumb.message.replace(/"/g, '""'); // Escape quotes
          return `"${timestamp}","${crumb.level}","${agent}","${message}"`;
        });
        return [headers, ...rows].join('\n');
      
      default:
        return '';
    }
  }

  /**
   * Clear all breadcrumbs
   */
  clear(): void {
    this.store = [];
  }

  /**
   * Get statistics about the breadcrumbs
   */
  getStats() {
    const levelCounts = this.store.reduce((acc, crumb) => {
      acc[crumb.level] = (acc[crumb.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const agentCounts = this.store.reduce((acc, crumb) => {
      if (crumb.agent) {
        acc[crumb.agent] = (acc[crumb.agent] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      total: this.store.length,
      levelCounts,
      agentCounts,
      oldestTimestamp: this.store[0]?.timestamp,
      newestTimestamp: this.store[this.store.length - 1]?.timestamp
    };
  }
}

// Global breadcrumb instance
export const Breadcrumbs = new BreadcrumbWriter();