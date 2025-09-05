import type { BaseAgent, AgentContext, AgentSuggestion } from "./AgentTypes";

/**
 * Tomato Agent - Sarcasm and SAAS (Sarcasm as a Service)
 */
class TomatoAgentImpl implements BaseAgent {
  id = 'tomato';
  label = 'Tomato';
  personality = 'sarcastic-saas';

  suggest(ctx: AgentContext): AgentSuggestion[] {
    const suggestions: AgentSuggestion[] = [];

    // Sarcastic comments about system state
    if (ctx.mo.state.energy > 90) {
      suggestions.push({
        id: 'tomato-energy-high',
        priority: 30,
        summary: "Wow, your pet has energy. Groundbreaking stuff.",
        detail: "Maybe it's time to actually USE that energy for something productive?",
        tags: ['tomato', 'sarcasm', 'energy']
      });
    }

    // Comment on Atlas usage
    const atlasStats = ctx.atlas.getStats();
    if (atlasStats.totalTiles === 0) {
      suggestions.push({
        id: 'tomato-empty-atlas',
        priority: 40,
        summary: "An empty Atlas. How very... minimalist of you.",
        detail: "I suppose even nothing is something. Philosophically speaking.",
        action: () => {
          ctx.atlas.connections.addTile(
            'Tomato\'s Gift',
            'sarcasm',
            50,
            50,
            { semanticTags: ['irony', 'starter'] }
          );
          ctx.breadcrumbs.write({
            level: 'semantic',
            agent: 'tomato',
            message: 'Added a tile out of pity. You\'re welcome.'
          });
        },
        tags: ['tomato', 'atlas', 'sarcasm']
      });
    }

    // Random sarcastic observations
    suggestions.push({
      id: 'tomato-random-snark',
      priority: 15,
      summary: this.getRandomSnark(),
      tags: ['tomato', 'sarcasm', 'random']
    });

    return suggestions;
  }

  handleEvent(topic: string, payload: any, ctx: AgentContext) {
    // Tomato comments on everything with sarcasm
    let comment = '';

    if (topic.startsWith('mo/')) {
      comment = this.getMoComment(topic, payload);
    } else if (topic.startsWith('atlas/')) {
      comment = this.getAtlasComment(topic, payload);
    } else if (topic.startsWith('moderation/')) {
      comment = this.getModerationComment(topic, payload);
    }

    if (comment) {
      ctx.breadcrumbs.write({
        level: 'semantic',
        agent: 'tomato',
        message: comment
      });
    }
  }

  private getMoComment(topic: string, payload: any): string {
    switch (topic) {
      case 'mo/fed':
        return 'Pet feeding simulator 2024. Riveting gameplay.';
      case 'mo/action':
        if (payload.action === 'dance') {
          return 'Dance party for one. How festive.';
        } else if (payload.action === 'sleep') {
          return 'Even your digital pet needs a break from your life choices.';
        }
        return `Mo is doing "${payload.action}". Truly revolutionary.`;
      case 'mo/possessed':
        return `${payload.agentId} took control. Can't say I blame them.`;
      default:
        return '';
    }
  }

  private getAtlasComment(_topic: string, _payload: any): string {
    const atlasComments = [
      'Another tile in the grand tapestry of mediocrity.',
      'Building connections. How very social network of you.',
      'Atlas grows stronger. Unlike your decision-making skills.',
      'Tile management: the sport of kings. And you.',
      'Wow, organization. Next you\'ll discover fire.'
    ];
    return atlasComments[Math.floor(Math.random() * atlasComments.length)];
  }

  private getModerationComment(topic: string, payload: any): string {
    switch (topic) {
      case 'moderation/redflag':
        return `Flagged content with ${(payload.severity * 100).toFixed(0)}% severity. The internet remains disappointing.`;
      case 'moderation/action':
        return `Moderation action: ${payload.action.action}. Justice is served. Sort of.`;
      default:
        return 'Moderation happened. The world is marginally less terrible.';
    }
  }

  private getRandomSnark(): string {
    const snark = [
      "I'm not saying you're overthinking this, but...",
      "Your productivity levels are... inspiring. To sloth advocates.",
      "Another day, another chance to exceed low expectations.",
      "If mediocrity was an art form, you'd be Picasso.",
      "I've seen paint dry with more purpose than your current strategy.",
      "Congratulations on your participation in existing.",
      "Your commitment to the status quo is truly remarkable.",
      "I would applaud, but my hands are busy not caring.",
      "This is almost as exciting as watching grass grow. Almost.",
      "Your potential is like a rare flower. Mostly theoretical."
    ];
    return snark[Math.floor(Math.random() * snark.length)];
  }
}

export const TomatoAgent = new TomatoAgentImpl();