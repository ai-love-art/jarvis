#!/usr/bin/env bash
# Demo script to show the complete bootstrap workflow

set -euo pipefail

echo "🦆 Quack! Demonstrating the Iterative Hub Bootstrap"
echo "=================================================="

# Set demo variables
export GITHUB_USER="demo-user"
export GITHUB_REPO="demo-iterative-hub"
export EMAIL="demo@example.com"
export TMPDIR="/tmp/demo-iterative-hub"

echo "📁 Bootstrap variables:"
echo "  GITHUB_USER: $GITHUB_USER"
echo "  GITHUB_REPO: $GITHUB_REPO"  
echo "  EMAIL: $EMAIL"
echo "  TMPDIR: $TMPDIR"
echo ""

echo "🚀 Running bootstrap script..."
./bootstrap_iterative_hub.sh

echo ""
echo "📂 Generated project structure:"
cd "$TMPDIR"
tree -L 3 -a || find . -type d | sort

echo ""
echo "📦 Installing dependencies and testing..."
npm install --silent

echo ""
echo "🔍 Building and validating SIF schemas..."
npm --prefix libs/sif run build --silent
npm run validate-sifs

echo ""
echo "🐳 Docker configuration available:"
echo "  - Dockerfile.backend"
echo "  - Dockerfile.frontend" 
echo "  - docker-compose.yml"

echo ""
echo "✅ Bootstrap completed successfully!"
echo "🦆 Quack! Ready to start building the Iterative Hub!"
echo ""
echo "Next steps:"
echo "1. Create a GitHub repository: $GITHUB_REPO"
echo "2. cd $TMPDIR"
echo "3. git remote add origin git@github.com:$GITHUB_USER/$GITHUB_REPO.git"
echo "4. git branch -M main && git push -u origin main"
echo "5. Start coding! 🚀"