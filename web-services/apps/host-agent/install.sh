#!/bin/bash
set -e

AXION_DIR="$HOME/.axion"
AGENT_REPO="https://raw.githubusercontent.com/Official-Krish/Axion/main/web-services/apps/host-agent"

echo ""
echo "  ☁️  Axion Host Agent Installer"
echo ""

# --- Check Bun ---
if command -v bun &>/dev/null; then
  echo "  ✓ Bun $(bun --version) installed"
else
  echo "  Installing Bun..."
  curl -fsSL https://bun.sh/install | bash
  export BUN_INSTALL="$HOME/.bun"
  export PATH="$BUN_INSTALL/bin:$PATH"
  echo "  ✓ Bun installed"
fi

# --- Check Docker ---
if command -v docker &>/dev/null; then
  if docker info &>/dev/null; then
    echo "  ✓ Docker running"
  else
    echo "  ⚠ Docker installed but not running"
  fi
else
  echo "  ⚠ Docker not found"
fi

# --- Create directories ---
mkdir -p "$AXION_DIR/agent"

# --- Build agent (bundles to single JS file) ---
echo ""
echo "  Building agent..."
cd "$AGENT_REPO" && bun build ./index.ts --outdir ./dist --target bun --minify

# --- Copy built agent ---
cp "$AGENT_REPO/dist/index.js" "$AXION_DIR/agent/index.js"

echo "  ✓ Agent installed (built)"

# --- Create launcher ---
cat > "$AXION_DIR/axion" << EOF
#!/bin/bash
exec bun "$AXION_DIR/agent/index.js" "\$@"
EOF
chmod +x "$AXION_DIR/axion"

# --- Add to PATH ---
SHELL_RC=""
if [ -f "$HOME/.zshrc" ]; then
  SHELL_RC="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then
  SHELL_RC="$HOME/.bashrc"
fi

PATH_LINE='export PATH="$HOME/.axion:$PATH"'
if [ -n "$SHELL_RC" ]; then
  if ! grep -q '.axion' "$SHELL_RC" 2>/dev/null; then
    echo "" >> "$SHELL_RC"
    echo "# Axion Host Agent" >> "$SHELL_RC"
    echo "$PATH_LINE" >> "$SHELL_RC"
    echo "  ✓ Added to PATH in $SHELL_RC"
  else
    echo "  ✓ PATH already configured"
  fi
fi

export PATH="$HOME/.axion:$PATH"

echo ""
echo "  ✓ Axion Host Agent installed! (LOCAL DEV MODE)"
echo ""
echo "  Next steps:"
echo "    1. source ~/.zshrc        (or open a new terminal)"
echo "    2. axion register          Register this machine"
echo "    3. axion start             Start earning SOL"
echo ""
echo "  WS: ws://localhost:8080"
echo "  API: http://localhost:3000/api/v2"
echo ""
