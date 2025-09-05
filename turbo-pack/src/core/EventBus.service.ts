/**
 * EventBus - Global communication system for BigMode components
 * Supports wildcard subscriptions and async handlers
 */

type Handler = (payload: any) => void | Promise<void>;

export class EventBus {
  private topics = new Map<string, Set<Handler>>();

  /**
   * Subscribe to a topic with a handler
   * @param topic - Topic name (supports wildcards with *)
   * @param handler - Function to handle events
   * @returns Unsubscribe function
   */
  on(topic: string, handler: Handler) {
    if (!this.topics.has(topic)) {
      this.topics.set(topic, new Set());
    }
    this.topics.get(topic)!.add(handler);
    return () => this.topics.get(topic)!.delete(handler);
  }

  /**
   * Subscribe to a topic for one event only
   * @param topic - Topic name
   * @param handler - Function to handle the event
   */
  once(topic: string, handler: Handler) {
    const off = this.on(topic, async (payload) => {
      off();
      await handler(payload);
    });
  }

  /**
   * Emit an event to all subscribers (including wildcard matches)
   * @param topic - Topic name
   * @param payload - Event payload
   */
  async emit(topic: string, payload?: any) {
    const parts = topic.split('/');
    const candidates = new Set<Handler>();
    
    // Match exact topic and wildcard patterns
    for (let i = parts.length; i >= 1; i--) {
      const path = parts.slice(0, i).join('/');
      
      // Exact match
      const exact = this.topics.get(path);
      if (exact) {
        exact.forEach(h => candidates.add(h));
      }
      
      // Wildcard match (e.g., atlas/* matches atlas/tiles/update)
      const star = this.topics.get(path + '/*');
      if (star) {
        star.forEach(h => candidates.add(h));
      }
    }

    // Execute all matching handlers
    for (const handler of candidates) {
      try {
        await handler(payload);
      } catch (error) {
        console.error(`EventBus handler error for topic ${topic}:`, error);
      }
    }
  }

  /**
   * Get all active topics (for debugging)
   */
  getTopics(): string[] {
    return Array.from(this.topics.keys());
  }

  /**
   * Clear all subscriptions
   */
  clear() {
    this.topics.clear();
  }
}

// Global EventBus instance
export const GlobalEventBus = new EventBus();