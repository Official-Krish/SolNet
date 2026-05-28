#!/bin/bash

set -e

echo "🔧 Axion Host Registration & Environment Setup Script (Cross-Platform)"

# === CONFIG ===
BACKEND_API="https://api.depin-worker.Axion.krishlabs.tech/v2/depinVerification"
CONFIG_DIR="$HOME/.Axion"
CONFIG_FILE="$CONFIG_DIR/config.json"

# === HELPER FUNCTIONS ===

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Print colored output
print_step() {
    echo "🔄 $1"
}

print_success() {
    echo "✅ $1"
}

print_error() {
    echo "❌ $1"
}

print_warning() {
    echo "⚠️  $1"
}

# Check if running as root
is_root() {
    [ "$(id -u)" -eq 0 ]
}

# Get CPU cores count
get_cpu_cores() {
    if command_exists nproc; then
        nproc
    elif [ -f /proc/cpuinfo ]; then
        grep -c ^processor /proc/cpuinfo
    elif command_exists sysctl; then
        sysctl -n hw.ncpu 2>/dev/null || sysctl -n hw.logicalcpu 2>/dev/null || echo "1"
    elif [ "$OS_TYPE" = "Windows" ]; then
        echo "${NUMBER_OF_PROCESSORS:-1}"
    else
        echo "1"
    fi
}

# Get RAM in GB
get_ram_gb() {
    if command_exists free; then
        # Linux
        free -g | awk '/^Mem/ {print $2}'
    elif command_exists vm_stat && command_exists sysctl; then
        # macOS
        local pages=$(vm_stat | grep "Pages free" | awk '{print $3}' | tr -d '.')
        local page_size=$(vm_stat | grep "page size" | awk '{print $8}')
        local total_mem=$(sysctl -n hw.memsize)
        echo $((total_mem / 1024 / 1024 / 1024))
    elif [ -f /proc/meminfo ]; then
        # Alternative Linux method
        awk '/MemTotal/ {print int($2/1024/1024)}' /proc/meminfo
    elif [ "$OS_TYPE" = "Windows" ]; then
        # Windows (requires PowerShell)
        if command_exists powershell.exe; then
            powershell.exe -Command "(Get-WmiObject -Class Win32_ComputerSystem).TotalPhysicalMemory / 1GB" 2>/dev/null | head -1 | cut -d. -f1 || echo "4"
        else
            echo "4"
        fi
    else
        echo "4"
    fi
}

# Get disk size in GB
get_disk_gb() {
    if command_exists df; then
        # Try different df options for compatibility
        if df -BG --output=size / >/dev/null 2>&1; then
            # GNU df (Linux)
            df -BG --output=size / 2>/dev/null | tail -1 | tr -dc '0-9'
        elif df -k / >/dev/null 2>&1; then
            # POSIX df (macOS, BSD)
            df -k / | tail -1 | awk '{print int($2/1024/1024)}'
        else
            echo "100"
        fi
    elif [ "$OS_TYPE" = "Windows" ]; then
        # Windows
        if command_exists powershell.exe; then
            powershell.exe -Command "(Get-WmiObject -Class Win32_LogicalDisk -Filter \"DeviceID='C:'\").Size / 1GB" 2>/dev/null | head -1 | cut -d. -f1 || echo "100"
        else
            echo "100"
        fi
    else
        echo "100"
    fi
}

# Get public IP address
get_public_ip() {
    local ip=""
    
    # Try multiple services for reliability
    if command_exists curl; then
        ip=$(curl -s --connect-timeout 5 ifconfig.me 2>/dev/null) || \
        ip=$(curl -s --connect-timeout 5 ipinfo.io/ip 2>/dev/null) || \
        ip=$(curl -s --connect-timeout 5 icanhazip.com 2>/dev/null)
    elif command_exists wget; then
        ip=$(wget -qO- --timeout=5 ifconfig.me 2>/dev/null) || \
        ip=$(wget -qO- --timeout=5 ipinfo.io/ip 2>/dev/null) || \
        ip=$(wget -qO- --timeout=5 icanhazip.com 2>/dev/null)
    fi
    
    # Validate IP format (basic check)
    if [[ $ip =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
        echo "$ip"
    else
        echo "127.0.0.1"
    fi
}

# Install basic dependencies
install_basic_dependencies() {
    print_step "Installing basic dependencies..."
    
    case "$OS_TYPE" in
        "Linux")
            # Detect Linux distribution
            if [ -f /etc/debian_version ]; then
                DISTRO="debian"
            elif [ -f /etc/redhat-release ]; then
                DISTRO="redhat"
            elif [ -f /etc/arch-release ]; then
                DISTRO="arch"
            else
                DISTRO="unknown"
            fi
            
            case "$DISTRO" in
                "debian")
                    sudo apt-get update
                    sudo apt-get install -y curl wget jq ca-certificates gnupg lsb-release
                    ;;
                "redhat")
                    if command_exists dnf; then
                        sudo dnf install -y curl wget jq ca-certificates gnupg
                    else
                        sudo yum install -y curl wget jq ca-certificates gnupg
                    fi
                    ;;
                "arch")
                    sudo pacman -Sy --noconfirm curl wget jq ca-certificates gnupg
                    ;;
                *)
                    print_warning "Unknown Linux distribution. Please install curl, wget, and jq manually."
                    ;;
            esac
            ;;
        "macOS")
            if ! command_exists brew; then
                print_step "Installing Homebrew..."
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            fi
            brew install curl wget jq
            ;;
        "Windows")
            print_warning "Running on Windows. Please ensure you have curl, wget, and jq installed in your environment."
            ;;
    esac
}

# Install Rust and Cargo (required for websocat)
install_rust() {
    if command_exists cargo; then
        print_success "Rust/Cargo is already installed."
        return
    fi
    
    print_step "Installing Rust and Cargo (required for websocat)..."
    
    case "$OS_TYPE" in
        "Linux"|"macOS")
            curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
            # Source the cargo environment
            if [ -f "$HOME/.cargo/env" ]; then
                source "$HOME/.cargo/env"
            fi
            export PATH="$HOME/.cargo/bin:$PATH"
            ;;
        "Windows")
            print_warning "Please install Rust from https://rustup.rs/ and restart your terminal."
            print_warning "Then run this script again to install websocat."
            ;;
    esac
}

# Install websocat
install_websocat() {
    if command_exists websocat; then
        print_success "websocat is already installed."
        return
    fi
    
    print_step "Installing websocat..."
    
    # Ensure Rust/Cargo is available
    if ! command_exists cargo; then
        install_rust
    fi
    
    # Make sure cargo is in PATH
    export PATH="$HOME/.cargo/bin:$PATH"
    
    case "$OS_TYPE" in
        "Linux"|"macOS")
            if command_exists cargo; then
                cargo install websocat
                print_success "websocat installed successfully!"
            else
                print_error "Failed to install Rust/Cargo. Please install manually from https://rustup.rs/"
                return 1
            fi
            ;;
        "Windows")
            if command_exists cargo; then
                cargo install websocat
                print_success "websocat installed successfully!"
            else
                print_warning "Please install Rust from https://rustup.rs/ first, then run: cargo install websocat"
            fi
            ;;
    esac
}

# Install Docker
install_docker() {
    if command_exists docker; then
        print_success "Docker is already installed."
        return
    fi
    
    print_step "Installing Docker..."
    
    case "$OS_TYPE" in
        "Linux")
            # Use Docker's official installation script
            curl -fsSL https://get.docker.com | bash
            
            # Add current user to docker group
            if ! is_root; then
                sudo usermod -aG docker "$USER"
                print_warning "You need to log out and back in for Docker group changes to take effect."
            fi
            
            # Start and enable Docker service
            if command_exists systemctl; then
                sudo systemctl start docker
                sudo systemctl enable docker
            fi
            ;;
        "macOS")
            print_warning "Please install Docker Desktop for Mac from https://www.docker.com/products/docker-desktop"
            print_warning "Script will continue, but Docker functionality may not work until installed."
            ;;
        "Windows")
            print_warning "Please install Docker Desktop for Windows from https://www.docker.com/products/docker-desktop"
            print_warning "Script will continue, but Docker functionality may not work until installed."
            ;;
    esac
}

# Install Caddy
install_caddy() {
    if command_exists caddy; then
        print_success "Caddy is already installed."
        return
    fi
    
    print_step "Installing Caddy..."
    
    case "$OS_TYPE" in
        "Linux")
            # Detect Linux distribution for Caddy installation
            if [ -f /etc/debian_version ]; then
                # Debian/Ubuntu
                sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
                curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
                curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
                sudo apt update
                sudo apt install -y caddy
            elif [ -f /etc/redhat-release ]; then
                # RHEL/CentOS/Fedora
                if command_exists dnf; then
                    sudo dnf copr enable @caddy/caddy
                    sudo dnf install -y caddy
                else
                    sudo yum install -y yum-utils
                    sudo yum-config-manager --add-repo https://dl.cloudsmith.io/public/caddy/stable/rpm/el/caddy.repo
                    sudo yum install -y caddy
                fi
            elif [ -f /etc/arch-release ]; then
                # Arch Linux
                sudo pacman -S --noconfirm caddy
            else
                # Generic Linux - try to install from GitHub releases
                print_step "Installing Caddy from GitHub releases..."
                CADDY_VERSION=$(curl -s https://api.github.com/repos/caddyserver/caddy/releases/latest | jq -r .tag_name)
                ARCH=$(uname -m)
                case "$ARCH" in
                    x86_64) CADDY_ARCH="amd64" ;;
                    aarch64|arm64) CADDY_ARCH="arm64" ;;
                    armv7l) CADDY_ARCH="armv7" ;;
                    *) CADDY_ARCH="amd64" ;;
                esac
                
                curl -L "https://github.com/caddyserver/caddy/releases/download/${CADDY_VERSION}/caddy_${CADDY_VERSION#v}_linux_${CADDY_ARCH}.tar.gz" -o /tmp/caddy.tar.gz
                tar xzf /tmp/caddy.tar.gz -C /tmp
                sudo mv /tmp/caddy /usr/local/bin/
                sudo chmod +x /usr/local/bin/caddy
                
                # Create systemd service
                sudo tee /etc/systemd/system/caddy.service > /dev/null <<EOF
[Unit]
Description=Caddy
Documentation=https://caddyserver.com/docs/
After=network.target network-online.target
Requires=network-online.target

[Service]
Type=notify
User=caddy
Group=caddy
ExecStart=/usr/local/bin/caddy run --environ --config /etc/caddy/Caddyfile
ExecReload=/usr/local/bin/caddy reload --config /etc/caddy/Caddyfile --force
TimeoutStopSec=5s
LimitNOFILE=1048576
LimitNPROC=1048576
PrivateTmp=true
ProtectSystem=full
AmbientCapabilities=CAP_NET_BIND_SERVICE

[Install]
WantedBy=multi-user.target
EOF
                
                # Create caddy user and directories
                sudo useradd --system --home /var/lib/caddy --create-home --shell /usr/sbin/nologin caddy
                sudo mkdir -p /etc/caddy
                sudo chown -R root:caddy /etc/caddy
                sudo mkdir -p /var/lib/caddy
                sudo chown caddy:caddy /var/lib/caddy
                
                sudo systemctl daemon-reload
                sudo systemctl enable caddy
            fi
            ;;
        "macOS")
            if command_exists brew; then
                brew install caddy
            else
                print_warning "Homebrew not found. Please install Caddy manually from https://caddyserver.com/download"
            fi
            ;;
        "Windows")
            print_warning "Please install Caddy manually from https://caddyserver.com/download"
            ;;
    esac
}

# Configure Caddy
configure_caddy() {
    if [ "$OS_TYPE" != "Linux" ]; then
        print_warning "Caddy configuration is only supported on Linux systems."
        return
    fi
    
    print_step "Configuring Caddy with wildcard reverse proxy..."
    
    CADDYFILE_PATH="/etc/caddy/Caddyfile"
    
    # Create Caddyfile with wildcard configuration
    sudo tee "$CADDYFILE_PATH" > /dev/null <<EOF
*.krishlabs.tech {
  reverse_proxy localhost:{http.reverse_proxy.port}
}
EOF
    
    # Set proper permissions
    sudo chown root:caddy "$CADDYFILE_PATH"
    sudo chmod 644 "$CADDYFILE_PATH"
    
    # Restart caddy to apply changes
    if command_exists systemctl; then
        print_step "Starting and enabling Caddy service..."
        sudo systemctl start caddy
        sudo systemctl enable caddy
        sudo systemctl reload caddy
        print_success "Caddy configured and started successfully!"
    else
        print_warning "systemctl not found. Please start Caddy manually."
    fi
}

# Check dependencies
check_dependencies() {
    local missing_tools=()
    
    if ! command_exists jq; then
        missing_tools+=("jq")
    fi
    
    if ! command_exists curl && ! command_exists wget; then
        missing_tools+=("curl or wget")
    fi
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        echo ""
        read -p "🤔 Would you like to install missing dependencies automatically? (y/N): " install_deps
        if [[ "$install_deps" =~ ^[Yy]$ ]]; then
            install_basic_dependencies
        else
            echo ""
            echo "Please install the missing tools manually:"
            echo "  • On Ubuntu/Debian: sudo apt-get install jq curl"
            echo "  • On CentOS/RHEL: sudo yum install jq curl"
            echo "  • On macOS: brew install jq curl"
            echo "  • On Windows: Install Git Bash or WSL with the above packages"
            exit 1
        fi
    fi
}

# === SYSTEM DETECTION ===
OS_RAW=$(uname -s 2>/dev/null || echo "Unknown")
case "$OS_RAW" in
    Linux*)     OS_TYPE="Linux";;
    Darwin*)    OS_TYPE="macOS";;
    CYGWIN*|MINGW*|MSYS*) OS_TYPE="Windows";;
    *)          OS_TYPE="Unknown";;
esac

echo "🖥️  Detected OS: $OS_TYPE ($OS_RAW)"

# === ENVIRONMENT SETUP ===
echo ""
echo "=== ENVIRONMENT SETUP ==="

# Check and install dependencies
check_dependencies

# Ask user if they want to install components
echo ""
read -p "🐳 Would you like to install Docker? (y/N): " install_docker_choice
read -p "🌐 Would you like to install and configure Caddy? (y/N): " install_caddy_choice
read -p "🔌 Would you like to install websocat (required for job runner)? (y/N): " install_websocat_choice

if [[ "$install_docker_choice" =~ ^[Yy]$ ]]; then
    install_docker
fi

if [[ "$install_caddy_choice" =~ ^[Yy]$ ]]; then
    install_caddy
    configure_caddy
fi

if [[ "$install_websocat_choice" =~ ^[Yy]$ ]]; then
    install_websocat
fi

# === SYSTEM INFO COLLECTION ===
echo ""
echo "=== SYSTEM REGISTRATION ==="
print_step "Collecting system information..."

OS="$OS_RAW"
CPU_CORES=$(get_cpu_cores)
RAM_GB=$(get_ram_gb)
DISK_GB=$(get_disk_gb)
IP_ADDRESS=$(get_public_ip)

# === PROMPT FOR USER INPUT ===
echo ""
read -p "📨 Enter your wallet address (public key): " WALLET
read -p "📨 Enter your key (you provided at the time of registration): " KEY

# Validate inputs
if [ -z "$WALLET" ] || [ -z "$KEY" ]; then
    print_error "Wallet address and key cannot be empty!"
    exit 1
fi

# === DISPLAY SPECS ===
echo ""
echo "🖥️  Collected Specs:"
echo "  • OS Type      : $OS_TYPE"
echo "  • OS           : $OS"
echo "  • CPU Cores    : $CPU_CORES"
echo "  • RAM (GB)     : $RAM_GB"
echo "  • Disk Size    : ${DISK_GB}GB"
echo "  • IP Address   : $IP_ADDRESS"
echo "  • Wallet       : $WALLET"
echo "  • Key          : $KEY"

# === CONFIRMATION ===
echo ""
read -p "🤔 Do the specs look correct? (y/N): " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    print_error "Registration cancelled by user."
    exit 1
fi

# === REGISTER HOST ===
echo ""
print_step "Sending registration request to Axion..."

# Use curl if available, otherwise wget
if command_exists curl; then
    RESPONSE=$(curl -s -X POST "$BACKEND_API" \
      -H "Content-Type: application/json" \
      -d '{
        "os": "'"$OS"'",
        "cpu_cores": "'"$CPU_CORES"'",
        "ram_gb": "'"$RAM_GB"'",
        "disk_gb": "'"$DISK_GB"'",
        "ip_address": "'"$IP_ADDRESS"'",
        "wallet": "'"$WALLET"'",
        "key": "'"$KEY"'"
      }')
else
    # Fallback to wget
    RESPONSE=$(wget -qO- --post-data='{
        "os": "'"$OS"'",
        "cpu_cores": "'"$CPU_CORES"'",
        "ram_gb": "'"$RAM_GB"'",
        "disk_gb": "'"$DISK_GB"'",
        "ip_address": "'"$IP_ADDRESS"'",
        "wallet": "'"$WALLET"'",
        "key": "'"$KEY"'"
      }' \
      --header="Content-Type: application/json" \
      "$BACKEND_API")
fi

# Check if we got a response
if [ -z "$RESPONSE" ]; then
    print_error "No response from server. Please check your internet connection."
    exit 1
fi

# Parse values from response
HOST_ID=$(echo "$RESPONSE" | jq -r '.host_id' 2>/dev/null || echo "null")
TOKEN=$(echo "$RESPONSE" | jq -r '.token' 2>/dev/null || echo "null")

# Validate response
if [ "$HOST_ID" == "null" ] || [ -z "$HOST_ID" ] || [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
    print_error "Registration failed or missing token:"
    echo "$RESPONSE"
    exit 1
fi

# === STORE CONFIG ===
print_step "Storing configuration..."

# Create config directory (cross-platform)
mkdir -p "$CONFIG_DIR"

# Store configuration with cross-platform date
if command_exists date; then
    if date -u +"%Y-%m-%dT%H:%M:%SZ" >/dev/null 2>&1; then
        TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    else
        # macOS date command
        TIMESTAMP=$(date -u "+%Y-%m-%dT%H:%M:%SZ")
    fi
else
    TIMESTAMP="$(date)"
fi

echo "{
  \"host_id\": \"$HOST_ID\",
  \"token\": \"$TOKEN\",
  \"wallet\": \"$WALLET\",
  \"os_type\": \"$OS_TYPE\",
  \"docker_installed\": $(command_exists docker && echo "true" || echo "false"),
  \"caddy_installed\": $(command_exists caddy && echo "true" || echo "false"),
  \"websocat_installed\": $(command_exists websocat && echo "true" || echo "false"),
  \"registered_at\": \"$TIMESTAMP\"
}" > "$CONFIG_FILE"

# Set appropriate permissions (Unix-like systems only)
if [ "$OS_TYPE" != "Windows" ]; then
    chmod 600 "$CONFIG_FILE"
fi

# === COMPLETION ===
echo ""
print_success "Axion Host setup completed successfully!"
echo ""
echo "📁 Configuration saved to: $CONFIG_FILE"
echo "🆔 Host ID: $HOST_ID"
echo "🐳 Docker installed: $(command_exists docker && echo "✅ Yes" || echo "❌ No")"
echo "🌐 Caddy installed: $(command_exists caddy && echo "✅ Yes" || echo "❌ No")"
echo "🔌 websocat installed: $(command_exists websocat && echo "✅ Yes" || echo "❌ No")"
echo ""

if [[ "$install_caddy_choice" =~ ^[Yy]$ ]] && [ "$OS_TYPE" = "Linux" ]; then
    print_warning "DNS Configuration Required:"
    echo "   Ensure DNS wildcard for *.Axion.krishlabs.tech points to: $IP_ADDRESS"
fi

if command_exists docker && ! docker info >/dev/null 2>&1; then
    print_warning "Docker is installed but not accessible. You may need to:"
    echo "   1. Log out and back in (for group changes)"
    echo "   2. Start Docker service: sudo systemctl start docker"
fi

if [[ "$install_websocat_choice" =~ ^[Yy]$ ]] && [ "$OS_TYPE" != "Windows" ] && ! command_exists websocat; then
    print_warning "websocat installation may have failed. Try manually:"
    echo "   1. Ensure Rust is installed: curl https://sh.rustup.rs -sSf | sh"
    echo "   2. Source cargo environment: source ~/.cargo/env"
    echo "   3. Install websocat: cargo install websocat"
fi

echo ""
print_success "Your Axion host is now registered and ready to use!"
echo "You can now run your job listener script to serve Docker apps."