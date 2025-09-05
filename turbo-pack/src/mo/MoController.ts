import { EventBus, GlobalEventBus } from "../core/EventBus.service";

/**
 * State of Mo - the pet/agent hybrid
 */
export interface MoState {
  mode: 'idle' | 'follow' | 'stay' | 'blastoff' | 'possessed';
  x: number;
  y: number;
  vx: number; // velocity x
  vy: number; // velocity y
  possessedBy?: string; // agent ID
  aura?: string; // visual effect when possessed
  energy: number; // 0-100
  mood: 'happy' | 'curious' | 'sleepy' | 'excited' | 'focused';
}

/**
 * MoController - Manages the pet/agent hybrid Mo
 * Mo can be both a playful pet and an intelligent agent
 */
export class MoController {
  public state: MoState = {
    mode: 'idle',
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    energy: 100,
    mood: 'curious'
  };

  private listeners = new Set<() => void>();
  private animationFrame?: number;

  private bus: EventBus;

  constructor(bus: EventBus = GlobalEventBus) {
    this.bus = bus;
    this.startAnimationLoop();
  }

  /**
   * Subscribe to state changes
   */
  onChange(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /**
   * Notify all listeners of state changes
   */
  private notify() {
    this.listeners.forEach(fn => fn());
  }

  /**
   * Change Mo's mode and notify
   */
  setMode(mode: MoState['mode']) {
    this.state.mode = mode;
    this.bus.emit('mo/mode', { mode, state: this.state });
    this.notify();
  }

  /**
   * Set Mo's position
   */
  setPosition(x: number, y: number) {
    this.state.x = x;
    this.state.y = y;
    this.notify();
  }

  /**
   * Agent takes control of Mo
   */
  possess(agentId: string, aura?: string) {
    this.state.possessedBy = agentId;
    this.state.mode = 'possessed';
    this.state.aura = aura;
    this.state.mood = 'focused';
    this.bus.emit('mo/possessed', { agentId, aura, state: this.state });
    this.notify();
  }

  /**
   * Release Mo from agent control
   */
  releasePossession(agentId: string) {
    if (this.state.possessedBy === agentId) {
      this.state.possessedBy = undefined;
      this.state.aura = undefined;
      this.state.mood = 'happy';
      this.setMode('idle');
    }
  }

  /**
   * Update Mo's position based on mode and target
   */
  step(dt: number, target?: { x: number; y: number }) {
    if (this.state.mode === 'follow' && target) {
      const dx = target.x - this.state.x;
      const dy = target.y - this.state.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 5) { // Only move if not too close
        this.state.vx = dx * 0.08;
        this.state.vy = dy * 0.08;
        this.state.x += this.state.vx * dt;
        this.state.y += this.state.vy * dt;
        this.notify();
      }
    } else if (this.state.mode === 'idle') {
      // Gentle floating animation
      const time = Date.now() * 0.001;
      this.state.x += Math.sin(time * 0.5) * 0.1;
      this.state.y += Math.cos(time * 0.3) * 0.1;
      this.notify();
    }

    // Update energy and mood over time
    this.updateEnergyAndMood(dt);
  }

  /**
   * Update energy and mood based on activities
   */
  private updateEnergyAndMood(dt: number) {
    // Energy slowly decreases, faster when active
    const energyDrain = this.state.mode === 'follow' ? 0.1 : 0.02;
    this.state.energy = Math.max(0, this.state.energy - energyDrain * dt);

    // Mood changes based on energy and activity
    if (this.state.energy < 20) {
      this.state.mood = 'sleepy';
    } else if (this.state.mode === 'follow') {
      this.state.mood = 'excited';
    } else if (this.state.mode === 'possessed') {
      this.state.mood = 'focused';
    } else {
      this.state.mood = 'curious';
    }
  }

  /**
   * Feed Mo to restore energy
   */
  feed() {
    this.state.energy = Math.min(100, this.state.energy + 20);
    this.state.mood = 'happy';
    this.bus.emit('mo/fed', { energy: this.state.energy });
    this.notify();
  }

  /**
   * Make Mo perform an action
   */
  performAction(action: string, payload?: any) {
    this.bus.emit('mo/action', { action, payload, state: this.state });
    
    // Different actions affect Mo differently
    switch (action) {
      case 'dance':
        this.state.mood = 'excited';
        this.state.energy -= 5;
        break;
      case 'sleep':
        this.state.mood = 'sleepy';
        this.state.energy += 10;
        break;
      case 'explore':
        this.state.mood = 'curious';
        this.setMode('follow');
        break;
    }
    
    this.notify();
  }

  /**
   * Start the animation loop
   */
  private startAnimationLoop() {
    const loop = (_timestamp: number) => {
      this.step(16); // Assuming ~60fps
      this.animationFrame = requestAnimationFrame(loop);
    };
    this.animationFrame = requestAnimationFrame(loop);
  }

  /**
   * Stop the animation loop
   */
  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }
}