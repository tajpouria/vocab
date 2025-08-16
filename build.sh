#!/bin/bash

# VocabBoost AI - Production Build Script
# This script builds both frontend and backend, then bundles them into a single deployable folder

set -e  # Exit on any error

echo "🚀 Starting VocabBoost AI production build..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BUILD_DIR="build"
FRONTEND_BUILD_DIR="dist"
SERVER_BUILD_DIR="server-dist"

# Function to print colored output
print_step() {
    echo -e "${BLUE}📦 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Clean previous builds
print_step "Cleaning previous builds..."
rm -rf $BUILD_DIR
rm -rf $FRONTEND_BUILD_DIR
rm -rf server/$SERVER_BUILD_DIR
print_success "Cleaned previous builds"

# Check if required files exist
if [ ! -f "package.json" ]; then
    print_error "package.json not found in root directory"
    exit 1
fi

if [ ! -f "server/package.json" ]; then
    print_error "server/package.json not found"
    exit 1
fi

# Install frontend dependencies
print_step "Installing frontend dependencies..."
if !  install; then
    print_error "Failed to install frontend dependencies"
    exit 1
fi
print_success "Frontend dependencies installed"

# Install server dependencies
print_step "Installing server dependencies..."
cd server
if ! yarn install; then
    print_error "Failed to install server dependencies"
    exit 1
fi
cd ..
print_success "Server dependencies installed"

# Build frontend
print_step "Building frontend..."
if ! yarn run build; then
    print_error "Frontend build failed"
    exit 1
fi
print_success "Frontend built successfully"

# Build server (TypeScript compilation)
print_step "Building server..."
cd server
if ! npx tsc --outDir $SERVER_BUILD_DIR --target es2022 --module es2022 --moduleResolution node --allowSyntheticDefaultImports --esModuleInterop --strict --skipLibCheck --forceConsistentCasingInFileNames index.ts; then
    print_error "Server build failed"
    exit 1
fi
cd ..
print_success "Server built successfully"

# Create build directory structure
print_step "Creating build directory structure..."
mkdir -p $BUILD_DIR
mkdir -p $BUILD_DIR/public
mkdir -p $BUILD_DIR/node_modules

# Copy server build
cp -r server/$SERVER_BUILD_DIR/* $BUILD_DIR/
print_success "Server files copied"

# Copy frontend build to public directory
cp -r $FRONTEND_BUILD_DIR/* $BUILD_DIR/public/
print_success "Frontend files copied to public directory"

# Copy server package.json and install production dependencies
cp server/package.json $BUILD_DIR/
print_success "Server package.json copied"

# Copy necessary server files
if [ -f "server/.env" ]; then
    cp server/.env $BUILD_DIR/
    print_success ".env file copied"
else
    print_warning ".env file not found - you'll need to create one in the build directory"
fi

# Create a production package.json for the build
cat > $BUILD_DIR/package.json << EOF
{
  "name": "vocabboost-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "lowdb": "^7.0.1",
    "nodemailer": "^6.9.8",
    "@google/genai": "^1.14.0",
    "dotenv": "^16.3.1"
  }
}
EOF

# Install production dependencies in build directory
print_step "Installing production dependencies..."
cd $BUILD_DIR
if ! yarn install --production; then
    print_error "Failed to install production dependencies"
    exit 1
fi
cd ..
print_success "Production dependencies installed"

# Create startup script
cat > $BUILD_DIR/start.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting VocabBoost AI server..."
node index.js
EOF

chmod +x $BUILD_DIR/start.sh

# Create README for deployment
cat > $BUILD_DIR/README.md << 'EOF'
# VocabBoost AI - Production Build

This folder contains the complete production build of VocabBoost AI.

## Environment Setup

1. Create a `.env` file with the following variables:
   ```
   API_KEY=your_gemini_api_key
   GEMINI_API_KEY=your_gemini_api_key
   PORT=3001
   SMTP_USER=your_smtp_email (optional)
   SMTP_PASS=your_smtp_password (optional)
   ```

## Running the Application

### Option 1: Using the start script
```bash
./start.sh
```

### Option 2: Direct node command
```bash
node index.js
```

The server will start on port 3001 (or the PORT specified in .env) and serve both the API and the frontend application.

## Deployment Notes

- The frontend is served from the `/public` directory
- All API routes are prefixed with `/api`
- The database file `db.json` will be created automatically
- Make sure to set the environment variables before starting
EOF

# Create .gitignore for build directory
cat > $BUILD_DIR/.gitignore << 'EOF'
node_modules/
.env
db.json
*.log
EOF

print_success "Build completed successfully!"
echo ""
echo -e "${GREEN}📁 Build output: ${BUILD_DIR}/${NC}"
echo -e "${BLUE}📋 Next steps:${NC}"
echo "   1. Copy the '${BUILD_DIR}' folder to your server"
echo "   2. Create a .env file with your API keys"
echo "   3. Run: ./start.sh or node index.js"
echo ""
echo -e "${YELLOW}📝 Note: Make sure to set up your environment variables before running!${NC}"
