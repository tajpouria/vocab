#! /bin/bash

server_user=$1
server_ip=$2

if [ -z "$server_user" ] || [ -z "$server_ip" ]; then
    echo "Usage: $0 <server_user> <server_ip>"
    exit 1
fi

echo "Building client..."

yarn run build

echo "Bundling server..."

rm -rf dist-server
mkdir -p dist-server
cp -rf server/ dist-server/
cp -rf types.ts dist-server/
rm -rf dist-server/server/node_modules
tar -czf dist-server.tar.gz dist-server > /dev/null 2>&1

echo "Copy server bundle to server..."

scp dist-server.tar.gz $server_user@$server_ip:/home/$server_user/

echo "Deploying and starting server with PM2..."

ssh $server_user@$server_ip << 'EOF'
    set -e  # Exit on any error

    export PATH=~/.npm-global/bin:$PATH
    
    cd ~
    
    # Debug: Show current directory and files
    echo "Current directory: $(pwd)"
    echo "Files in current directory:"
    ls -la
    
    # Clean up previous deployment
    rm -rf dist-server
    
    # Extract the new deployment
    if [ -f dist-server.tar.gz ]; then
        echo "Found dist-server.tar.gz, extracting..."
        tar -xzf dist-server.tar.gz
        echo "Successfully extracted dist-server.tar.gz"
    else
        echo "Error: dist-server.tar.gz not found!"
        echo "Available files:"
        ls -la
        exit 1
    fi
    
    # Navigate to server directory
    if [ -d "dist-server/server" ]; then
        cd dist-server/server
        echo "Successfully navigated to dist-server/server"
    else
        echo "Error: dist-server/server directory not found!"
        ls -la dist-server/
        exit 1
    fi
    
    # Install dependencies
    echo "Installing dependencies..."
    yarn
    
    # Stop existing PM2 process if running
    echo "Stopping existing PM2 processes..."
    yarn run pm2 stop all 2>/dev/null || echo "No existing process to stop"
    yarn run pm2 delete all 2>/dev/null || echo "No existing process to delete"
    
    # Create logs directory
    mkdir -p logs
    
    # Start the server with PM2
    echo "Starting server with PM2..."
    yarn run pm2 start --interpreter tsx index.ts
    
    # Save PM2 configuration
    yarn run pm2 save
    
    # Setup PM2 to start on boot (this will show instructions)
    echo "Setting up PM2 startup..."
    yarn run pm2 startup || echo "PM2 startup setup completed (may require manual action)"

    echo "Server deployed and started with PM2!"
    yarn run pm2 status
EOF
