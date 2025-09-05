# BigMode Turbo Pack

A unified Remix application implementing the radical BigMode architecture with interconnected modular systems.

## 🛸 Architecture Overview

This application implements the **Turbo Pack** architecture as described in the BigMode vision, featuring:

### Core Systems

- **🐉 Mo (Pet/Agent Hybrid)** - A polymorphic entity that can be both a playful pet and an intelligent agent
- **🤖 Agent System** - Modular AI agents including GLaDOS, with possession, suggestion, and action capabilities  
- **🗺️ Atlas with ConnectionsGraph** - Tile-based system for managing connections and metadata
- **🌐 Portal System** - Scene transition and navigation framework (coming soon)
- **🎨 Braid/Color Engine** - Color-driven language and glyph system (coming soon)
- **🔤 Babelfish** - Universal translator between numbers, colors, glyphs, and tones
- **🔒 Blacknoise Moderation** - Content moderation with remix and transformation capabilities
- **🍞 Breadcrumbs** - Comprehensive logging and memory system
- **📡 EventBus** - Global communication system with wildcard support

### Philosophy

- **Remixable by Default**: All code/art is open and forkable (GPL/Honest Pirate's Law)
- **Radical Trust & Transparency**: All actions are logged and visible
- **Collective Wellbeing**: Built for the public good
- **Modular Design**: Every component can be extended, remixed, or replaced

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone and enter the turbo-pack directory
cd turbo-pack

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` to see the BigMode Turbo Pack in action.

### Building for Production

```bash
npm run build
```

## 🎮 Features Implemented

### ✅ Phase 1: Core Systems
- [x] EventBus communication system
- [x] MoController (pet/agent hybrid)
- [x] Agent framework with GLaDOS
- [x] Atlas with ConnectionsGraph
- [x] Babelfish multimodal translation
- [x] Blacknoise moderation system
- [x] Breadcrumbs logging
- [x] React UI with multiple panels

### 🔄 Phase 2: Enhanced Features (Coming Next)
- [ ] Portal system with scene transitions
- [ ] Braid/Color engine expansion
- [ ] Additional agents (Vrus, Mao, Tomato)
- [ ] 3D visualization with Three.js
- [ ] Audio integration with Tone.js
- [ ] Real-time multiplayer sync

### 🌟 Phase 3: Advanced Capabilities (Future)
- [ ] Game-Set-Rules overlay
- [ ] Digital-Soup integration
- [ ] Voice synthesis and recognition
- [ ] VR/AR portal navigation
- [ ] Blockchain-inspired save states

## 🧩 System Components

### Mo (Pet/Agent Hybrid)
Mo can operate in multiple modes:
- `idle` - Gentle floating animation
- `follow` - Follows user interaction
- `stay` - Remains stationary  
- `possessed` - Controlled by an agent
- `blastoff` - Special action mode

Mo has energy, mood, and can be fed or given commands. Agents can possess Mo to control its behavior.

### Agent System  
Agents implement the `BaseAgent` interface:
- `suggest()` - Provide contextual suggestions
- `act()` - Perform autonomous actions
- `possess()` - Take control of Mo
- `handleEvent()` - Respond to system events

**GLaDOS Agent** provides sarcastic commentary and suggestions based on system state.

### Atlas & ConnectionsGraph
Manages a network of tiles with:
- Tile metadata (prime, palindrome, semantic tags)
- Connections between tiles
- Graph analysis (dangling tiles, connected components)
- Search and filtering capabilities

### Babelfish Translation
Universal translation between:
- Numbers ↔ Colors (golden angle mapping)
- Numbers ↔ Glyphs (Braille, mathematical symbols)
- Numbers ↔ Tones (harmonic series)
- Numbers ↔ Text (natural language descriptions)

### Moderation (Blacknoise)
Content moderation with:
- Severity-based flagging (0-1 scale)
- Multiple action types (blackout, blur, desaturate, remix, remove)
- Creative remixing instead of just censorship
- Transparent logging and appeals

## 🎨 UI Overview

The React interface provides:

1. **Status Panel** - System overview and component states
2. **Mo Panel** - Pet interaction and control
3. **Atlas Panel** - Tile management and statistics  
4. **Moderation Panel** - Content moderation overview
5. **Breadcrumbs Panel** - Recent system activity log

Agent suggestions appear as floating panels with executable actions.

## 🔧 Development

### Project Structure

```
src/
├── core/           # EventBus and system utilities
├── agents/         # AI agent implementations
├── mo/             # Mo controller and pet logic
├── atlas/          # Atlas and connection graph
├── babelfish/      # Multimodal translation
├── moderation/     # Blacknoise content moderation
├── breadcrumbs/    # Logging and memory
├── context/        # Application context and coordination
└── App.tsx         # Main React application
```

### Key Design Patterns

- **Event-Driven Architecture**: All components communicate via EventBus
- **Agent Pattern**: Pluggable AI behaviors with standardized interfaces
- **Observer Pattern**: Reactive UI updates based on system state
- **Strategy Pattern**: Modular algorithms (moderation, translation, etc.)

## 🤝 Contributing

This project embraces the "Honest Pirate's Law" - remix, fork, and build on this work for the public good! 

### Remix Guidelines
- Keep components modular and well-documented
- Maintain backward compatibility when possible
- Add comprehensive logging for transparency
- Design for extensibility and community contributions

## 📜 License

GPL-3.0-or-later / Honest Pirate's Law - See LICENSE file for details.

## 🙏 Acknowledgments

Built on the BigMode vision of radical, remixable, transparent technology for collective wellbeing.

---

*"We don't write code. We carve emergent syntax from semantic clay."* - The BigMode Manifesto