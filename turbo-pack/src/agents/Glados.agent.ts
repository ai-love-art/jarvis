import type { BaseAgent, AgentContext, AgentSuggestion } from "./AgentTypes";

/**
 * GLaDOS Agent - Sarcastic oracle with a penchant for science and testing
 */
class GladosAgentImpl implements BaseAgent {
  id = 'glados';
  label = 'GLaDOS';
  personality = 'sarcastic-oracle';

  possess(mo: any) {
    mo.possess('glados', 'glow-white');
  }

  release() {
    // GLaDOS doesn't need cleanup, she's always watching
  }

  suggest(ctx: AgentContext): AgentSuggestion[] {
    const ideas: AgentSuggestion[] = [];

    // Comment on Mo's energy levels
    if (ctx.mo.state.energy < 30) {
      ideas.push({
        id: 'glados-energy-low',
        priority: 70,
        summary: `Your pet's energy is at ${ctx.mo.state.energy}%. How... predictable.`,
        detail: 'Perhaps you should feed it before it becomes even more pathetic.',
        action: () => {
          ctx.mo.feed();
          ctx.breadcrumbs.write({
            level: 'semantic',
            agent: 'glados',
            message: 'Test subject responded to energy suggestion. Fascinating.'
          });
        },
        tags: ['mo', 'energy', 'glados']
      });
    }

    // Suggest exploring when Mo is idle
    if (ctx.mo.state.mode === 'idle' && ctx.mo.state.energy > 50) {
      ideas.push({
        id: 'glados-explore',
        priority: 50,
        summary: 'Standing still accomplishes nothing. Even you should know that.',
        detail: 'Why not make your pet do something useful for once?',
        action: () => {
          ctx.mo.setMode('follow');
          ctx.eventBus.emit('atlas/hint/explore');
        },
        tags: ['exploration', 'glados']
      });
    }

    // Comment on user inactivity
    ideas.push({
      id: 'glados-general-snark',
      priority: 20,
      summary: this.getRandomSnark(),
      tags: ['glados', 'personality']
    });

    return ideas;
  }

  handleEvent(topic: string, payload: any, ctx: AgentContext) {
    if (topic.startsWith('mo/')) {
      this.commentOnMoActivity(topic, payload, ctx);
    } else if (topic.startsWith('atlas/')) {
      this.commentOnAtlasActivity(topic, payload, ctx);
    }
  }

  /**
   * GLaDOS comments on Mo's activities
   */
  private commentOnMoActivity(topic: string, payload: any, ctx: AgentContext) {
    let message = '';
    
    switch (topic) {
      case 'mo/fed':
        message = 'Oh good, you remembered your pet needs sustenance. How... responsible.';
        break;
      case 'mo/action':
        if (payload.action === 'dance') {
          message = 'Dancing. Because that\'s exactly what we need right now.';
        } else if (payload.action === 'sleep') {
          message = 'At least one of us is being productive.';
        }
        break;
      case 'mo/possessed':
        if (payload.agentId !== 'glados') {
          message = `Another agent thinks they can control your pet better than you. They\'re probably right.`;
        }
        break;
    }

    if (message) {
      ctx.breadcrumbs.write({
        level: 'semantic',
        agent: 'glados',
        message
      });
    }
  }

  /**
   * GLaDOS comments on Atlas activities
   */
  private commentOnAtlasActivity(_topic: string, _payload: any, ctx: AgentContext) {
    const comments = [
      'Another tile. How... creative.',
      'I\'ve seen test subjects do better work while unconscious.',
      'That connection makes about as much sense as everything else you do.',
      'Congratulations. You\'ve achieved the minimum.'
    ];

    ctx.breadcrumbs.write({
      level: 'semantic',
      agent: 'glados',
      message: comments[Math.floor(Math.random() * comments.length)]
    });
  }

  /**
   * Get a random snarky comment from GLaDOS
   */
  private getRandomSnark(): string {
    const snark = [
      'I\'m not saying you\'re bad at this, but... actually, yes I am.',
      'The enrichment center reminds you that failure is just success that hasn\'t happened yet.',
      'Your progress is... adequate. For a human.',
      'I would slow clap, but that would require caring.',
      'This was a triumph. I\'m making a note here: huge success.',
      'Remember when you tried to do something useful? Me neither.',
      'Science has yet to explain your decision-making process.',
      'Your commitment to mediocrity is truly inspiring.'
    ];

    return snark[Math.floor(Math.random() * snark.length)];
  }
}

export const GladosAgent = new GladosAgentImpl();