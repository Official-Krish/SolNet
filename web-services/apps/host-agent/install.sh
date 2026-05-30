#!/bin/bash
set -e

AXION_DIR="$HOME/.axion"
AGENT_REPO="https://raw.githubusercontent.com/Official-Krish/Axion/main/web-services/apps/host-agent"
AGENT_FILES=("index.ts" "config.ts" "specs.ts" "commands/register.ts" "commands/start.ts")

echo ""
echo "  ☁️  Axion Host Agent Installer"
echo ""

# --- Detect OS ---
OS=$(uname -s)
case "$OS" in
  Linux)  PLATFORM="linux" ;;
  Darwin) PLATFORM="macos" ;;
  *)      echo "  ✗ Unsupported OS: $OS"; exit 1 ;;
esac
echo "  Platform: $PLATFORM"

# --- Check/Install Bun ---
if command -v bun &>/dev/null; then
  echo "  ✓ Bun $(bun --version) installed"
else
  echo "  Installing Bun..."
  curl -fsSL https://bun.sh/install | bash
  export BUN_INSTALL="$HOME/.bun"
  export PATH="$BUN_INSTALL/bin:$PATH"
  if ! command -v bun &>/dev/null; then
    echo "  ✗ Bun installation failed. Install manually: https://bun.sh"
    exit 1
  fi
  echo "  ✓ Bun installed"
fi

# --- Check Docker ---
if command -v docker &>/dev/null; then
  if docker info &>/dev/null; then
    echo "  ✓ Docker running"
  else
    echo "  ⚠ Docker installed but not running. Start it before using 'axion start'"
  fi
else
  echo "  ⚠ Docker not found. Install it: https://docs.docker.com/get-docker/"
  echo "    Docker is required to run jobs."
fi

# --- Create directories ---
mkdir -p "$AXION_DIR/agent/commands"

# --- Download agent files ---
echo ""
echo "  Downloading agent..."

for file in "${AGENT_FILES[@]}"; do
  dir=$(dirname "$AXION_DIR/agent/$file")
  mkdir -p "$dir"
  curl -fsSL "$AGENT_REPO/$file" -o "$AXION_DIR/agent/$file"
done

# Write package.json
cat > "$AXION_DIR/agent/package.json" << 'EOF'
{
  "name": "axion-host",
  "module": "index.ts",
  "type": "module",
  "private": true
}
EOF

echo "  ✓ Agent downloaded"

# --- Create launcher script ---
cat > "$AXION_DIR/axion" << EOF
#!/bin/bash
exec bun run "$AXION_DIR/agent/index.ts" "\$@"
EOF
chmod +x "$AXION_DIR/axion"

# --- Add to PATH ---
SHELL_RC=""
if [ -f "$HOME/.zshrc" ]; then
  SHELL_RC="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then
  SHELL_RC="$HOME/.bashrc"
elif [ -f "$HOME/.profile" ]; then
  SHELL_RC="$HOME/.profile"
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

# --- Done ---
echo ""
echo "  ✓ Axion Host Agent installed!"
echo ""
echo "  Usage:"
echo "    axion register   Register this machine"
echo "    axion start      Start earning SOL"
echo ""
echo "  Run 'source $SHELL_RC' or open a new terminal to use 'axion'."
echo ""
