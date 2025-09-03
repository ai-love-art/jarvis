# Jarvis - Iterative Hub Bootstrap

🚀 **Quack!** This repository contains a ready-to-run bootstrap script for creating an Nx monorepo structure for the Iterative Hub Hackathon project.

## Quick Start

1. **Fill in your details:**
   ```bash
   export GITHUB_USER="your-github-username"
   export GITHUB_REPO="iterative-hub"
   export EMAIL="you@example.com"
   ```

2. **Run the bootstrap script:**
   ```bash
   chmod +x bootstrap_iterative_hub.sh
   ./bootstrap_iterative_hub.sh
   ```

3. **Create GitHub repo and push:**
   ```bash
   # Navigate to the generated directory
   cd /tmp/iterative-hub-bootstrap
   
   # Create the repo on GitHub, then push
   git remote add origin git@github.com:your-github-username/iterative-hub.git
   git branch -M main
   git push -u origin main
   ```

## What's Generated

The bootstrap script creates a complete Nx monorepo with:

### 📁 Structure
- **apps/backend** - Node.js backend application placeholder
- **apps/frontend** - React/Vue frontend application placeholder  
- **libs/sif** - Standardized Interface Format schemas and validation
- **libs/agent-sdk** - Agent SDK library
- **libs/workflow** - Workflow orchestration library
- **packages/plugins** - Plugin system with example plugin

### 📄 Key Files
- **SIF Schemas** - JSON schemas for InstructionPacket, TaskEvent, and ArtworkDescriptor
- **validate-sifs.ts** - Schema validation script using AJV
- **GitHub Actions CI** - Automated validation workflow
- **Docker Configuration** - Multi-service setup with postgres and redis

### 🛠️ Available Commands

```bash
# Validate SIF schemas
npm run validate-sifs

# Build individual components
npm --prefix libs/sif run build
npm --prefix libs/agent-sdk run build
npm --prefix libs/workflow run build

# Start with Docker
docker-compose up --build
```

## Features Included

✅ **Bootstrap Script** - Complete project generation  
✅ **SIF Schema Validation** - Working validate-sifs script  
✅ **Dockerfiles** - Backend and frontend containerization  
✅ **Docker Compose** - Multi-service orchestration  
✅ **GitHub Actions** - CI/CD pipeline  
✅ **Plugin System** - Extensible plugin architecture  

## Next Steps

After bootstrapping, you can:
- Implement the backend API using Nest.js or Express
- Build the frontend using React or Vue
- Create additional plugins in `packages/plugins/`
- Add more SIF schemas as needed
- Customize the CI/CD pipeline

**Quack!** You're ready to start building the Iterative Hub! 🦆