#!/bin/bash
set -euo pipefail

echo "📦 Bundling React app to single HTML artifact..."

# Ensure we're in a project directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: No package.json found. Run this script from your project root."
  exit 1
fi

# Ensure entry point exists
if [ ! -f "index.html" ]; then
  echo "❌ Error: No index.html found in project root."
  echo "   This script requires an index.html entry point."
  exit 1
fi

# Select package manager
if command -v pnpm >/dev/null 2>&1; then
  PM="pnpm"
  RUNNER="pnpm exec"
elif command -v npm >/dev/null 2>&1; then
  PM="npm"
  RUNNER="npx"
elif command -v yarn >/dev/null 2>&1; then
  PM="yarn"
  RUNNER="npx"
else
  echo "❌ No supported package manager found (pnpm, npm, or yarn)."
  exit 1
fi

echo "🧭 Using package manager: ${PM}"

# Install bundling dependencies only if missing
echo "📦 Ensuring bundling dependencies are installed..."
DEPS=(parcel @parcel/config-default parcel-resolver-tspaths html-inline)
if [ "$PM" = "pnpm" ]; then
  pnpm add -D "${DEPS[@]}"
elif [ "$PM" = "npm" ]; then
  npm install -D "${DEPS[@]}"
else
  yarn add -D "${DEPS[@]}"
fi

# Create Parcel config with tspaths resolver
if [ ! -f ".parcelrc" ]; then
  echo "🔧 Creating Parcel configuration with path alias support..."
  cat > .parcelrc << 'EOF'
{
  "extends": "@parcel/config-default",
  "resolvers": ["parcel-resolver-tspaths", "..."]
}
EOF
fi

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist bundle.html

# Build with Parcel
echo "🔨 Building with Parcel..."
${RUNNER} parcel build index.html --dist-dir dist --no-source-maps

# Inline everything into single HTML
echo "🎯 Inlining all assets into single HTML file..."
${RUNNER} html-inline dist/index.html > bundle.html

# Get file size
FILE_SIZE=$(du -h bundle.html | cut -f1)

echo ""
echo "✅ Bundle complete!"
echo "📄 Output: bundle.html ($FILE_SIZE)"
echo ""
echo "You can now use this single HTML file as an artifact in Claude conversations."

# Auto-open the artifact for quick verification when possible
if command -v open >/dev/null 2>&1; then
  echo "🚀 Opening bundle.html in your default browser..."
  open bundle.html || true
elif command -v xdg-open >/dev/null 2>&1; then
  echo "🚀 Opening bundle.html in your default browser..."
  xdg-open bundle.html || true
else
  echo "👉 Please open bundle.html in your browser to verify the render."
fi