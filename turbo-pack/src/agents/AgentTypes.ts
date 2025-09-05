import type { EventBus } from '../core/EventBus.service';
import type { BreadcrumbWriter } from '../breadcrumbs/Breadcrumbs.service';
import type { MoController } from '../mo/MoController';

/**
 * Context provided to all agents
 */
export type AgentContext = {
  atlas: any; // Will be defined when Atlas is implemented
  braid: any; // Will be defined when Braid engine is implemented
  babelfish: any; // Will be defined when Babelfish is implemented
  eventBus: EventBus;
  breadcrumbs: BreadcrumbWriter;
  mo: MoController;
};

/**
 * Suggestion from an agent
 */
export interface AgentSuggestion {
  id: string;
  priority: number; // Higher = more important
  summary: string;
  detail?: string;
  action?: () => void | Promise<void>;
  tags?: string[];
  timestamp?: number;
}

/**
 * Base interface for all agents in the system
 */
export interface BaseAgent {
  id: string;
  label: string;
  personality: string;
  
  /**
   * Take control of Mo (the pet/agent hybrid)
   */
  possess?(mo: MoController): void;
  
  /**
   * Release control of Mo
   */
  release?(): void;
  
  /**
   * Provide suggestions based on current context
   */
  suggest?(ctx: AgentContext): AgentSuggestion[] | Promise<AgentSuggestion[]>;
  
  /**
   * Perform autonomous actions
   */
  act?(ctx: AgentContext): Promise<void> | void;
  
  /**
   * Handle events from the EventBus
   */
  handleEvent?(topic: string, payload: any, ctx: AgentContext): void;
}

/**
 * Agent priority levels for execution order
 */
export const AgentPriority = {
  SYSTEM: 1000,
  MODERATION: 900,
  POSSESSION: 800,
  SUGGESTION: 100
} as const;