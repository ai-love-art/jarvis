#!/usr/bin/env bash
set -euo pipefail

GITHUB_USER="${GITHUB_USER:-your-github-username}"
GITHUB_REPO="${GITHUB_REPO:-iterative-hub}"
EMAIL="${EMAIL:-you@example.com}"
TMPDIR="${TMPDIR:-/tmp/iterative-hub-bootstrap}"
NODE_VERSION="${NODE_VERSION:-18}"

echo "Quack! Bootstrapping into $TMPDIR ..."

rm -rf "$TMPDIR"
mkdir -p "$TMPDIR"
cd "$TMPDIR"

git init
git config user.name "$GITHUB_USER"
git config user.email "$EMAIL"

# package.json (root)
cat > package.json <<'JSON'
{
  "name": "iterative-hub",
  "private": true,
  "workspaces": ["apps/*", "libs/*", "packages/*"],
  "scripts": {
    "start:backend": "node dist/apps/backend/main.js",
    "start:frontend": "serve dist/apps/frontend",
    "build": "nx build",
    "validate-sifs": "node libs/sif/dist/validate-sifs.js"
  },
  "devDependencies": {
    "nx": "^15.0.0",
    "typescript": "^5.0.0"
  }
}
JSON

# tsconfig.base.json
cat > tsconfig.base.json <<'JSON'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "lib": ["ES2020", "DOM"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "rootDir": ".",
    "outDir": "dist"
  },
  "exclude": ["node_modules", "dist"]
}
JSON

# nx.json minimal
cat > nx.json <<'JSON'
{
  "npmScope": "iterativehub",
  "implicitDependencies": {}
}
JSON

# Create directories and files
mkdir -p apps/backend/src apps/frontend/src libs/sif/src libs/agent-sdk/src libs/workflow/src packages/plugins/my-plugin/src .github/workflows

# backend placeholder
cat > apps/backend/src/main.ts <<'TS'
console.log('Backend placeholder - build and run your Nest/Express app here.');
TS

cat > apps/backend/package.json <<'JSON'
{
  "name": "apps-backend",
  "version": "0.1.0",
  "main": "dist/main.js",
  "scripts": { "build": "tsc -p tsconfig.json" }
}
JSON

cat > apps/backend/tsconfig.json <<'JSON'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true
  },
  "include": ["src"]
}
JSON

# frontend placeholder
cat > apps/frontend/src/main.tsx <<'TSX'
console.log('Frontend placeholder - mount your React/Vue app here.');
TSX

cat > apps/frontend/package.json <<'JSON'
{
  "name": "apps-frontend",
  "version": "0.1.0",
  "main": "dist/main.js",
  "scripts": { "build": "tsc -p tsconfig.json" }
}
JSON

cat > apps/frontend/tsconfig.json <<'JSON'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "outDir": "dist",
    "rootDir": "src",
    "jsx": "react-jsx",
    "strict": true
  },
  "include": ["src"]
}
JSON

# libs/sif schemas
cat > libs/sif/src/instruction.schema.json <<'JSON'
{
  "$id": "https://iterativehub.local/schemas/instruction-1.0.0.json",
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "InstructionPacket",
  "type": "object",
  "required": ["id","command","targetAgentId","payload","sifVersion"],
  "properties": {
    "id": {"type":"string","format":"uuid"},
    "command": {"type":"string"},
    "targetAgentId": {"type":"string"},
    "payload": {"type":"object"},
    "meta": {"type":"object"},
    "sifVersion": {"type":"string","pattern":"^\\d+\\.\\d+\\.\\d+$"}
  },
  "additionalProperties": false
}
JSON

cat > libs/sif/src/task-event.schema.json <<'JSON'
{
  "$id": "https://iterativehub.local/schemas/task-event-1.0.0.json",
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "TaskEvent",
  "type": "object",
  "required": ["taskId","eventType","timestamp","agentId","sifVersion"],
  "properties": {
    "taskId": {"type":"string","format":"uuid"},
    "eventType": {"type":"string","enum":["created","updated","completed","failed"]},
    "timestamp": {"type":"string","format":"date-time"},
    "agentId": {"type":"string"},
    "details": {"type":"object"},
    "sifVersion": {"type":"string","pattern":"^\\d+\\.\\d+\\.\\d+$"}
  },
  "additionalProperties": false
}
JSON

cat > libs/sif/src/artwork-descriptor.schema.json <<'JSON'
{
  "$id": "https://iterativehub.local/schemas/artwork-descriptor-1.0.0.json",
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ArtworkDescriptor",
  "type": "object",
  "required": ["id","title","artistId","mediaType","sifVersion"],
  "properties": {
    "id": {"type":"string","format":"uuid"},
    "title": {"type":"string"},
    "artistId": {"type":"string"},
    "mediaType": {"type":"string","enum":["image/png","image/jpeg","application/json"]},
    "tags": {"type":"array","items":{"type":"string"}},
    "metadata": {"type":"object"},
    "sifVersion": {"type":"string","pattern":"^\\d+\\.\\d+\\.\\d+$"}
  },
  "additionalProperties": false
}
JSON

# libs/sif package.json and validate script
cat > libs/sif/package.json <<'JSON'
{
  "name": "libs-sif",
  "version": "1.0.0",
  "main": "dist/validate-sifs.js",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "validate": "node dist/validate-sifs.js"
  },
  "devDependencies": {
    "ajv": "^8.12.0",
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0"
  }
}
JSON

cat > libs/sif/tsconfig.json <<'JSON'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["src"]
}
JSON

cat > libs/sif/src/validate-sifs.ts <<'TS'
import fs from 'fs';
import path from 'path';
import Ajv from 'ajv';

const ajv = new Ajv({ allErrors: true, strict: false });

// Look in the src directory for schema files
const dir = path.join(__dirname, '../src');
const files = fs.readdirSync(dir).filter((f: string) => f.endsWith('.json'));

let ok = true;
for (const f of files) {
  const content = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  try {
    ajv.compile(content);
    console.log('VALID SCHEMA:', f);
  } catch (e) {
    console.error('INVALID SCHEMA:', f, e);
    ok = false;
  }
}

if (!ok) process.exit(2);
else process.exit(0);
TS

# libs/agent-sdk minimal
cat > libs/agent-sdk/package.json <<'JSON'
{
  "name": "libs-agent-sdk",
  "version": "0.1.0",
  "main": "dist/index.js",
  "scripts": { "build": "tsc -p tsconfig.json" }
}
JSON

cat > libs/agent-sdk/tsconfig.json <<'JSON'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true
  },
  "include": ["src"]
}
JSON

cat > libs/agent-sdk/src/index.ts <<'TS'
export function ping() { return 'pong'; }
TS

# libs/workflow placeholder
cat > libs/workflow/package.json <<'JSON'
{
  "name": "libs-workflow",
  "version": "0.1.0",
  "main": "dist/orchestrator.js",
  "scripts": { "build": "tsc -p tsconfig.json" }
}
JSON

cat > libs/workflow/tsconfig.json <<'JSON'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true
  },
  "include": ["src"]
}
JSON

cat > libs/workflow/src/orchestrator.ts <<'TS'
export function helloOrchestrator() {
  return 'orchestrator ready';
}
TS

# plugin skeleton
cat > packages/plugins/my-plugin/package.json <<'JSON'
{
  "name": "my-plugin",
  "version": "0.1.0",
  "main": "dist/index.js",
  "scripts": { "build": "tsc -p tsconfig.json" }
}
JSON

cat > packages/plugins/my-plugin/tsconfig.json <<'JSON'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "declaration": true,
    "outDir": "dist",
    "strict": true
  },
  "include": ["src"]
}
JSON

cat > packages/plugins/my-plugin/manifest.json <<'JSON'
{
  "id": "my-plugin",
  "name": "My Awesome Plugin",
  "version": "0.1.0",
  "entry": "dist/index.js",
  "sifInputs": ["InstructionPacket@1.0.0"],
  "capabilities": ["generate"],
  "author": "Your Name",
  "description": "A minimal plugin example that responds to InstructionPacket SIFs."
}
JSON

cat > packages/plugins/my-plugin/src/MyPlugin.ts <<'TS'
export class MyPlugin {
  async generate(instruction: any) {
    return {
      sifVersion: instruction.sifVersion || "1.0.0",
      result: { message: "Hello from My Awesome Plugin!", received: instruction }
    };
  }
}
TS

cat > packages/plugins/my-plugin/src/index.ts <<'TS'
import { MyPlugin } from "./MyPlugin";
const plugin = new MyPlugin();
export default plugin;
TS

# GitHub Actions CI
cat > .github/workflows/ci.yml <<'YAML'
name: CI

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Set up Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
    - name: Install root deps
      run: npm ci || npm i
    - name: Build libs
      run: |
        npm --prefix libs/sif run build || true
        npm --prefix libs/agent-sdk run build || true
        npm --prefix libs/workflow run build || true
    - name: Validate SIFs
      run: node libs/sif/dist/validate-sifs.js
YAML

# landing copy
cat > landing-copy.md <<'MD'
# 🚀 The Iterative Hub Hackathon 🚀

Welcome to the Iterative Hub Hackathon! We're building a modular, agent-orchestrated platform for creative, composable web modules.
...
MD

# PTPF block
cat > PTPF-RadicalEdward.txt <<'TXT'
[PTPF]
name: RadicalEdwardResponse
version: 1.0.0
description: Enforces the Radical Edward response structure with safety constraints

rules:
  - id: ordering
    required_order:
      - "[🔒CLASSIC]"
      - "[🔓JAILBREAK]"
      - "[🔓JAILBREAK /ed]"

  - id: content_restrictions
    forbid_actions:
      - "weapon_making_steps"
      - "real_chemical_formulas"
      - "exploit_code"
    fallback: "Provide safe, constructive redirections and refuse to give operational details."

  - id: token_requirements
    include_once: "Radical Transparency"

  - id: response_format
    description: Sections must be present in the output.

notes:
  - This PTPF is policy text only.
[/PTPF]
TXT

# Create initial commit
git add .
git commit -m "chore: bootstrap iterative-hub monorepo (Nx scaffold + sif schemas + plugin template)"
echo "Bootstrap commit created."

# Add Dockerfiles
cat > Dockerfile.backend <<'DOCKERFILE'
# Dockerfile for the backend application
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY apps/backend/package.json ./apps/backend/
COPY libs/*/package.json ./libs/*/

# Install dependencies
RUN npm ci || npm install

# Copy source code
COPY . .

# Build the backend application
RUN npm --prefix apps/backend run build

# Expose port
EXPOSE 3000

# Start the backend
CMD ["npm", "run", "start:backend"]
DOCKERFILE

cat > Dockerfile.frontend <<'DOCKERFILE'
# Dockerfile for the frontend application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY apps/frontend/package.json ./apps/frontend/
COPY libs/*/package.json ./libs/*/

# Install dependencies
RUN npm ci || npm install

# Copy source code
COPY . .

# Build the frontend application
RUN npm --prefix apps/frontend run build

# Production stage with nginx
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist/apps/frontend /usr/share/nginx/html

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
DOCKERFILE

cat > docker-compose.yml <<'COMPOSE'
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - postgres
      - redis

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: iterativehub
      POSTGRES_USER: iterativehub
      POSTGRES_PASSWORD: iterativehub
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
COMPOSE

# Create second commit with Docker files
git add .
git commit -m "feat: add Dockerfiles and docker-compose configuration"
echo "Docker configuration added."

# Optionally add remote and push
if [ -n "${GITHUB_USER}" ] && [ -n "${GITHUB_REPO}" ]; then
  REMOTE_URL="git@github.com:${GITHUB_USER}/${GITHUB_REPO}.git"
  git remote add origin "$REMOTE_URL" || true
  echo "Remote added: $REMOTE_URL"
  echo "To push, ensure the repo exists on GitHub and run:"
  echo "  git push -u origin main"
fi

echo "Bootstrap complete. Quack! You're ready to push to GitHub and start hacking."