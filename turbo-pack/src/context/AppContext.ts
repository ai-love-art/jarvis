import { GlobalEventBus } from "../core/EventBus.service";
import { MoController } from "../mo/MoController";
import { Breadcrumbs } from "../breadcrumbs/Breadcrumbs.service";
import { BabelfishService } from "../babelfish/Babelfish.service";
import { AtlasConnections } from "../atlas/ConnectionsGraph.service";
import { BlacknoiseService } from "../moderation/Blacknoise.service";
import { GladosAgent } from "../agents/Glados.agent";
import { TomatoAgent } from "../agents/Tomato.agent";
import type { BaseAgent, AgentContext, AgentSuggestion } from "../agents/AgentTypes";

/**
 * Global application context that coordinates all BigMode components
 */
class AppContextManager {
  public mo: MoController;
  public agents: BaseAgent[] = [];
  public agentContext: AgentContext;
  private tickInterval?: number;

  constructor() {
    // Initialize Mo first
    this.mo = new MoController(GlobalEventBus);

    // Create agent context
    this.agentContext = {
      atlas: {
        connections: AtlasConnections,
        getDanglingTiles: () => AtlasConnections.getDanglingTiles(),
        searchTiles: (query: string) => AtlasConnections.searchTiles(query),
        getTilesByType: (type: string) => AtlasConnections.getTilesByType(type),
        getStats: () => AtlasConnections.getStats()
      },
      braid: {
        // Placeholder for braid engine - will be implemented later
        current: { averageTension: 0.4 }
      },
      babelfish: BabelfishService,
      eventBus: GlobalEventBus,
      breadcrumbs: Breadcrumbs,
      mo: this.mo
    };

    // Initialize agents
    this.initializeAgents();

    // Set up event handlers
    this.setupEventHandlers();

    // Start the agent tick system
    this.startAgentTick();

    // Log initialization
    Breadcrumbs.write({
      level: 'info',
      agent: 'system',
      message: 'BigMode application context initialized',
      data: {
        agentCount: this.agents.length,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Initialize all agents in the system
   */
  private initializeAgents() {
    // Add agents
    this.agents.push(GladosAgent);
    this.agents.push(TomatoAgent);

    // Subscribe agents to relevant events
    this.agents.forEach(agent => {
      if (agent.handleEvent) {
        // Subscribe to all events for now - agents can filter internally
        GlobalEventBus.on('*', (payload) => {
          // Extract topic from the event (this is a simplification)
          const topic = payload?.topic || 'unknown';
          agent.handleEvent!(topic, payload, this.agentContext);
        });
      }
    });
  }

  /**
   * Set up global event handlers
   */
  private setupEventHandlers() {
    // Mo state changes
    GlobalEventBus.on('mo/*', (payload) => {
      Breadcrumbs.write({
        level: 'semantic',
        agent: 'mo',
        message: `Mo state change: ${JSON.stringify(payload)}`,
        data: payload
      });
    });

    // Atlas changes
    GlobalEventBus.on('atlas/*', (payload) => {
      Breadcrumbs.write({
        level: 'semantic',
        agent: 'atlas',
        message: `Atlas activity: ${JSON.stringify(payload)}`,
        data: payload
      });
    });

    // Moderation events
    GlobalEventBus.on('moderation/*', (payload) => {
      Breadcrumbs.write({
        level: 'moderation',
        agent: 'blacknoise',
        message: `Moderation event: ${JSON.stringify(payload)}`,
        data: payload
      });
    });

    // Babelfish translations
    GlobalEventBus.on('babelfish/*', (payload) => {
      Breadcrumbs.write({
        level: 'semantic',
        agent: 'babelfish',
        message: `Translation event: ${JSON.stringify(payload)}`,
        data: payload
      });
    });
  }

  /**
   * Get suggestions from all agents
   */
  async getAllSuggestions(): Promise<AgentSuggestion[]> {
    const allSuggestions: AgentSuggestion[] = [];

    for (const agent of this.agents) {
      if (agent.suggest) {
        try {
          const suggestions = await agent.suggest(this.agentContext);
          allSuggestions.push(...suggestions.map(s => ({
            ...s,
            timestamp: Date.now()
          })));
        } catch (error) {
          console.error(`Error getting suggestions from agent ${agent.id}:`, error);
          Breadcrumbs.write({
            level: 'debug',
            agent: agent.id,
            message: `Failed to get suggestions: ${error}`,
            data: { error: error instanceof Error ? error.message : String(error) }
          });
        }
      }
    }

    // Sort by priority (highest first)
    return allSuggestions.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Execute agent actions
   */
  async executeAgentActions() {
    for (const agent of this.agents) {
      if (agent.act) {
        try {
          await agent.act(this.agentContext);
        } catch (error) {
          console.error(`Error executing action for agent ${agent.id}:`, error);
          Breadcrumbs.write({
            level: 'debug',
            agent: agent.id,
            message: `Failed to execute action: ${error}`,
            data: { error: error instanceof Error ? error.message : String(error) }
          });
        }
      }
    }
  }

  /**
   * Add a new agent to the system
   */
  addAgent(agent: BaseAgent) {
    this.agents.push(agent);
    
    // Subscribe to events if the agent handles them
    if (agent.handleEvent) {
      GlobalEventBus.on('*', (payload) => {
        const topic = payload?.topic || 'unknown';
        agent.handleEvent!(topic, payload, this.agentContext);
      });
    }

    Breadcrumbs.write({
      level: 'info',
      agent: 'system',
      message: `Agent ${agent.id} (${agent.label}) added to system`,
      data: { agentId: agent.id, personality: agent.personality }
    });
  }

  /**
   * Remove an agent from the system
   */
  removeAgent(agentId: string): boolean {
    const index = this.agents.findIndex(agent => agent.id === agentId);
    if (index !== -1) {
      const agent = this.agents[index];
      
      // Release Mo if this agent was possessing it
      if (this.mo.state.possessedBy === agentId && agent.release) {
        agent.release();
      }
      
      this.agents.splice(index, 1);
      
      Breadcrumbs.write({
        level: 'info',
        agent: 'system',
        message: `Agent ${agentId} removed from system`
      });
      
      return true;
    }
    return false;
  }

  /**
   * Start the agent tick system - runs agents periodically
   */
  private startAgentTick() {
    this.tickInterval = window.setInterval(async () => {
      // Execute agent actions
      await this.executeAgentActions();
      
      // Get and process suggestions (could be used by UI)
      const suggestions = await this.getAllSuggestions();
      if (suggestions.length > 0) {
        GlobalEventBus.emit('agents/suggestions', { suggestions });
      }
    }, 5000); // Tick every 5 seconds
  }

  /**
   * Stop the agent tick system
   */
  stopAgentTick() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = undefined;
    }
  }

  /**
   * Get system status
   */
  getSystemStatus() {
    return {
      mo: {
        mode: this.mo.state.mode,
        energy: this.mo.state.energy,
        mood: this.mo.state.mood,
        possessedBy: this.mo.state.possessedBy
      },
      agents: this.agents.map(agent => ({
        id: agent.id,
        label: agent.label,
        personality: agent.personality
      })),
      atlas: AtlasConnections.getStats(),
      breadcrumbs: Breadcrumbs.getStats(),
      moderation: BlacknoiseService.getStats(),
      eventBus: {
        topics: GlobalEventBus.getTopics()
      }
    };
  }

  /**
   * Cleanup when shutting down
   */
  destroy() {
    this.stopAgentTick();
    this.mo.destroy();
    GlobalEventBus.clear();
    Breadcrumbs.clear();
    
    Breadcrumbs.write({
      level: 'info',
      agent: 'system',
      message: 'BigMode application context destroyed'
    });
  }
}

// Global application context
export const AppContext = new AppContextManager();

// Export for use in React components
export default AppContext;