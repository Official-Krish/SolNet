#!/bin/bash

set -e

echo "Starting Axion Job Runner..."

# === CONFIG ===
WEBSOCKET_ENDPOINT="wss.depin-worker.krishlabs.tech"
CONFIG_DIR="$HOME/.Axion"
CONFIG_FILE="$CONFIG_DIR/config.json"

# === HELPER FUNCTIONS ===

print_step() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

print_success() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

print_error() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

print_info() {
    echo "ℹ$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Load configuration
load_config() {
    if [ ! -f "$CONFIG_FILE" ]; then
        print_error "Configuration not found at $CONFIG_FILE"
        exit 1
    fi
    
    if ! command -v jq >/dev/null 2>&1; then
        print_error "jq is required but not installed."
        exit 1
    fi
    
    MACHINE_ID=$(jq -r '.host_id' "$CONFIG_FILE")
    TOKEN=$(jq -r '.token' "$CONFIG_FILE")
    
    if [ "$MACHINE_ID" == "null" ] || [ "$TOKEN" == "null" ] || [ -z "$MACHINE_ID" ] || [ -z "$TOKEN" ]; then
        print_error "Invalid configuration. Please re-run registration script."
        exit 1
    fi
    
    print_success "Loaded configuration for Machine ID: $MACHINE_ID"
}

# Cleanup unused Docker images
cleanup_unused_images() {
    print_step "Cleaning up unused Docker images..."
    
    # Remove dangling images
    local dangling=$(docker images -f "dangling=true" -q 2>/dev/null || true)
    if [ -n "$dangling" ]; then
        echo "$dangling" | xargs -r docker rmi >/dev/null 2>&1 || true
        print_info "Removed dangling images"
    fi
    
    # Remove unused images (not used by any container)
    docker image prune -f >/dev/null 2>&1 || true
    print_info "Docker image cleanup completed"
}

# Cleanup function
cleanup() {
    print_info "Shutting down gracefully..."
    
    # Send UNSUBSCRIBE message before closing
    if [ -n "$ws_pid" ]; then
        echo "{\"type\":\"UNSUBSCRIBE\",\"jobId\":\"$MACHINE_ID\",\"token\":\"$TOKEN\"}" > "$ws_input" 2>/dev/null || true
        sleep 1
    fi
    
    local containers=$(docker ps -q --filter "label=Axion.job=true" 2>/dev/null || true)
    if [ -n "$containers" ]; then
        print_step "Stopping running job containers..."
        echo "$containers" | xargs -r docker stop --time=30
        echo "$containers" | xargs -r docker rm -f
    fi
    
    # Cleanup unused images
    cleanup_unused_images
    
    jobs -p | xargs -r kill 2>/dev/null || true
    print_success "Cleanup completed."
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# Validate environment
validate_environment() {
    print_step "Validating environment..."
    
    if ! command -v docker >/dev/null 2>&1; then
        print_error "Docker is not installed or not in PATH."
        exit 1
    fi
    
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running or accessible."
        exit 1
    fi
    
    if ! command -v websocat >/dev/null 2>&1; then
        print_error "websocat is required but not installed."
        print_error "Install with: cargo install websocat"
        exit 1
    fi
    
    print_success "Environment validation completed"
}

# Send status update to server
send_status_update() {
    local job_id="$1"
    local status="$2"
    
    local status_msg="{\"type\":\"status\",\"jobId\":\"$job_id\",\"token\":\"$TOKEN\",\"status\":\"$status\"}"
    echo "$status_msg" > "$ws_input" 2>/dev/null || true
    print_info "Sent status update: $job_id -> $status"
}

# Process start-job message
process_start_job() {
    local job_data="$1"
    
    local job_id=$(echo "$job_data" | jq -r '.jobId // empty')
    local image=$(echo "$job_data" | jq -r '.dockerImage // empty')
    local ports=$(echo "$job_data" | jq -r '.ports[]? // empty' 2>/dev/null | tr '\n' ' ')
    local env_vars=$(echo "$job_data" | jq -r '.env // {} | to_entries[] | "-e \(.key)=\(.value)"' 2>/dev/null | tr '\n' ' ')
    
    if [ -z "$job_id" ] || [ "$job_id" == "null" ]; then
        print_error "Invalid job data received"
        return 1
    fi
    
    print_success "Processing start-job: $job_id"
    print_info "Image: $image"
    
    # Send CREATING status
    send_status_update "$job_id" "CREATING"
    
    # Generate container name
    local container_name="${job_id}-Axion"
    
    # Stop existing container with same name
    docker stop "$container_name" >/dev/null 2>&1 || true
    docker rm "$container_name" >/dev/null 2>&1 || true
    
    # Construct port mappings
    local port_flags=""
    for port in $ports; do
        if [ -n "$port" ] && [ "$port" != "null" ]; then
            port_flags="$port_flags -p $port:$port"
        fi
    done
    
    # Pull image
    print_step "Pulling Docker image: $image"
    send_status_update "$job_id" "BOOTING"
    
    if ! docker pull "$image" >/dev/null 2>&1; then
        print_error "Failed to pull Docker image: $image"
        send_status_update "$job_id" "DELETED"
        return 1
    fi
    
    # Run container
    print_step "Starting Docker container: $container_name"
    
    local container_id
    if ! container_id=$(docker run -d \
        --name "$container_name" \
        --label "Axion.job=true" \
        --label "Axion.job_id=$job_id" \
        --label "Axion.machine_id=$MACHINE_ID" \
        --restart=unless-stopped \
        $port_flags \
        $env_vars \
        "$image" 2>&1); then
        print_error "Failed to start container: $container_id"
        send_status_update "$job_id" "DELETED"
        return 1
    fi
    
    # Wait for container to be ready
    sleep 5
    
    if ! docker ps -q --filter "id=$container_id" | grep -q .; then
        local logs=$(docker logs "$container_id" 2>&1 | tail -10)
        print_error "Container exited immediately. Logs: $logs"
        send_status_update "$job_id" "DELETED"
        docker rm "$container_id" >/dev/null 2>&1 || true
        return 1
    fi
    
    # Generate deployment URL
    local deployment_url="https://${job_id}-Axion.krishlabs.tech"
    
    print_success "Container started successfully!"
    print_success "Deployed at: $deployment_url"
    print_info "Container ID: $container_id"
    
    # Send RUNNING status
    send_status_update "$job_id" "RUNNING"
    
    # Store job info for monitoring (job_id:container_id:image_name)
    echo "$job_id:$container_id:$image" >> "/tmp/Axion_jobs_$MACHINE_ID.txt"
    
    return 0
}

# Process end-job message
process_end_job() {
    local job_data="$1"
    
    local job_id=$(echo "$job_data" | jq -r '.jobId // empty')
    
    if [ -z "$job_id" ] || [ "$job_id" == "null" ]; then
        print_error "Invalid end-job data received"
        return 1
    fi
    
    print_step "Processing end-job: $job_id"
    
    # Send TERMINATING status
    send_status_update "$job_id" "TERMINATING"
    
    # Find and stop container
    local container_name="${job_id}-Axion"
    local container_id=$(docker ps -q --filter "name=$container_name" 2>/dev/null || true)
    local image_name=""
    
    if [ -n "$container_id" ]; then
        # Get the image name before stopping container
        image_name=$(docker inspect --format='{{.Config.Image}}' "$container_id" 2>/dev/null || true)
        
        print_step "Stopping container: $container_name"
        docker stop "$container_id" --time=10 >/dev/null 2>&1 || true
        docker rm "$container_id" >/dev/null 2>&1 || true
        print_success "Container stopped and removed"
        
        # Remove the Docker image
        if [ -n "$image_name" ]; then
            print_step "Removing Docker image: $image_name"
            if docker rmi "$image_name" >/dev/null 2>&1; then
                print_success "Docker image removed: $image_name"
            else
                print_warning "Failed to remove Docker image (may be in use): $image_name"
            fi
        fi
    else
        print_warning "Container not found: $container_name"
    fi
    
    # Remove from job tracking
    if [ -f "/tmp/Axion_jobs_$MACHINE_ID.txt" ]; then
        grep -v "^$job_id:" "/tmp/Axion_jobs_$MACHINE_ID.txt" > "/tmp/Axion_jobs_$MACHINE_ID.txt.tmp" 2>/dev/null || true
        mv "/tmp/Axion_jobs_$MACHINE_ID.txt.tmp" "/tmp/Axion_jobs_$MACHINE_ID.txt" 2>/dev/null || true
    fi
    
    # Send DELETED status
    send_status_update "$job_id" "DELETED"
    
    return 0
}

# Process job-status message
process_job_status() {
    local job_data="$1"
    
    local job_id=$(echo "$job_data" | jq -r '.jobId // empty')
    
    if [ -z "$job_id" ] || [ "$job_id" == "null" ]; then
        print_error "Invalid job-status data received"
        return 1
    fi
    
    print_info "Processing job-status request: $job_id"
    
    # Check if container is running
    local container_name="${job_id}-Axion"
    local container_id=$(docker ps -q --filter "name=$container_name" 2>/dev/null || true)
    
    if [ -n "$container_id" ]; then
        print_info "Job $job_id is RUNNING (container: $container_id)"
        send_status_update "$job_id" "RUNNING"
    else
        print_info "Job $job_id is not running"
        send_status_update "$job_id" "DELETED"
    fi
    
    return 0
}

# WebSocket message handler
handle_websocket_message() {
    local message="$1"
    
    if [ -z "$message" ]; then
        return
    fi
    
    # Parse message type
    local msg_type=$(echo "$message" | jq -r '.type // empty' 2>/dev/null)
    
    case "$msg_type" in
        "start-job")
            process_start_job "$message"
            ;;
        "end-job")
            process_end_job "$message"
            ;;
        "job-status")
            process_job_status "$message"
            ;;
        "status")
            print_info "Received status message: $(echo "$message" | jq -r '.message // "No message"')"
            ;;
        *)
            if [ "$msg_type" != "empty" ] && [ -n "$msg_type" ]; then
                print_info "Unknown message type: $msg_type"
            fi
            ;;
    esac
}

# WebSocket connection manager
start_websocket_connection() {
    print_info "Starting WebSocket connection..."
    
    # Create named pipes for WebSocket communication
    ws_input="/tmp/Axion_ws_input_$$"
    ws_output="/tmp/Axion_ws_output_$$"
    
    mkfifo "$ws_input" "$ws_output"
    
    # Start websocat in background
    websocat "$WEBSOCKET_ENDPOINT" < "$ws_input" > "$ws_output" &
    ws_pid=$!
    
    # Send SUBSCRIBE message
    sleep 1
    echo "{\"type\":\"SUBSCRIBE\",\"jobId\":\"$MACHINE_ID\",\"token\":\"$TOKEN\"}" > "$ws_input"
    print_success "Sent SUBSCRIBE message"
    
    # Read messages from WebSocket
    while IFS= read -r line; do
        if [ -n "$line" ]; then
            print_info "Received: $line"
            handle_websocket_message "$line"
        fi
    done < "$ws_output"
    
    # Cleanup pipes
    rm -f "$ws_input" "$ws_output" 2>/dev/null || true
}

# === MAIN EXECUTION ===

load_config
validate_environment

print_success "Axion Job Runner initialized"
print_info "Machine ID: $MACHINE_ID"

# Initialize job tracking file
touch "/tmp/Axion_jobs_$MACHINE_ID.txt"

# Start WebSocket connection with automatic restart
while true; do
    print_step "Connecting to WebSocket..."
    start_websocket_connection || {
        print_error "WebSocket connection failed, reconnecting in 5s..."
        sleep 5
    }
    
    print_warning "WebSocket disconnected, reconnecting in 5s..."
    sleep 5
done