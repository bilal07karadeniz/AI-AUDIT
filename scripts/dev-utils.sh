#!/bin/bash

# Development Utilities for AI-AUDIT
# Collection of helpful scripts for developers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ============================================================================
# Helper Functions
# ============================================================================

print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# ============================================================================
# Development Commands
# ============================================================================

cmd_help() {
    print_header "AI-AUDIT Development Utilities"

    echo "Available commands:"
    echo ""
    echo "  help              Show this help message"
    echo "  setup             Run initial project setup"
    echo "  clean             Clean all build artifacts and dependencies"
    echo "  reset             Reset project to fresh state"
    echo "  check             Check project health and dependencies"
    echo "  logs              View backend logs"
    echo "  lint              Run linters"
    echo "  format            Format code"
    echo "  test              Run tests (when implemented)"
    echo "  build             Build frontend and backend"
    echo "  dev               Start development servers"
    echo "  stats             Show project statistics"
    echo "  backup            Create project backup"
    echo ""
    echo "Usage: ./scripts/dev-utils.sh <command>"
    echo ""
}

cmd_setup() {
    print_header "Running Project Setup"

    cd "$PROJECT_ROOT"

    if [ -f "./setup.sh" ]; then
        print_info "Running automated setup script..."
        ./setup.sh
    else
        print_error "Setup script not found!"
        exit 1
    fi

    print_success "Setup complete!"
}

cmd_clean() {
    print_header "Cleaning Project"

    cd "$PROJECT_ROOT"

    print_info "Removing node_modules..."
    rm -rf node_modules
    rm -rf server/node_modules

    print_info "Removing build artifacts..."
    rm -rf dist
    rm -rf server/dist

    print_info "Removing lock files..."
    rm -f package-lock.json
    rm -f server/package-lock.json

    print_info "Clearing cache..."
    rm -rf .vite
    rm -rf server/.tsbuildinfo

    print_success "Project cleaned!"
}

cmd_reset() {
    print_header "Resetting Project"

    print_warning "This will delete all dependencies and build artifacts!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Reset cancelled"
        return
    fi

    cmd_clean

    print_info "Reinstalling dependencies..."
    npm install
    cd server && npm install && cd ..

    print_success "Project reset complete!"
}

cmd_check() {
    print_header "Checking Project Health"

    cd "$PROJECT_ROOT"

    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js: $NODE_VERSION"
    else
        print_error "Node.js not found!"
    fi

    # Check npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_success "npm: v$NPM_VERSION"
    else
        print_error "npm not found!"
    fi

    # Check frontend dependencies
    if [ -d "node_modules" ]; then
        print_success "Frontend dependencies installed"
    else
        print_warning "Frontend dependencies not installed (run: npm install)"
    fi

    # Check backend dependencies
    if [ -d "server/node_modules" ]; then
        print_success "Backend dependencies installed"
    else
        print_warning "Backend dependencies not installed (run: cd server && npm install)"
    fi

    # Check environment files
    if [ -f ".env" ]; then
        print_success "Frontend .env file exists"
    else
        print_warning "Frontend .env file missing"
    fi

    if [ -f "server/.env" ]; then
        print_success "Backend .env file exists"

        # Check API key
        if grep -q "ANTHROPIC_API_KEY=sk-ant-" server/.env; then
            print_success "API key configured in backend .env"
        else
            print_warning "API key not configured in backend .env"
        fi
    else
        print_warning "Backend .env file missing"
    fi

    # Check git status
    if [ -d ".git" ]; then
        print_success "Git repository initialized"
        BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
        print_info "Current branch: $BRANCH"
    else
        print_warning "Not a git repository"
    fi

    print_success "Health check complete!"
}

cmd_logs() {
    print_header "Viewing Backend Logs"

    if [ -f "server/logs/app.log" ]; then
        tail -f server/logs/app.log
    else
        print_warning "No log file found"
        print_info "Start the backend server to generate logs"
    fi
}

cmd_lint() {
    print_header "Running Linters"

    cd "$PROJECT_ROOT"

    print_info "Linting frontend..."
    npm run lint || true

    print_info "Linting backend..."
    cd server && npm run lint || true && cd ..

    print_success "Linting complete!"
}

cmd_format() {
    print_header "Formatting Code"

    cd "$PROJECT_ROOT"

    if command -v prettier &> /dev/null; then
        print_info "Running Prettier..."
        prettier --write "src/**/*.{ts,tsx,js,jsx,json,css,md}"
        prettier --write "server/src/**/*.{ts,js,json}"
        print_success "Code formatted!"
    else
        print_warning "Prettier not installed"
        print_info "Install with: npm install -g prettier"
    fi
}

cmd_test() {
    print_header "Running Tests"

    print_warning "Tests not yet implemented"
    print_info "This feature will be available in a future update"
}

cmd_build() {
    print_header "Building Project"

    cd "$PROJECT_ROOT"

    print_info "Building frontend..."
    npm run build

    print_info "Building backend..."
    cd server && npm run build && cd ..

    print_success "Build complete!"
}

cmd_dev() {
    print_header "Starting Development Servers"

    print_info "Starting backend server..."
    print_info "In a new terminal, run: cd server && npm run dev"
    echo ""

    print_info "Starting frontend server..."
    print_info "In another terminal, run: npm run dev"
    echo ""

    print_info "Or use the combined command in package.json:"
    print_info "npm run dev:all (if available)"
}

cmd_stats() {
    print_header "Project Statistics"

    cd "$PROJECT_ROOT"

    # Count files
    TOTAL_FILES=$(find src server/src -type f | wc -l)
    TS_FILES=$(find src server/src -name "*.ts" -o -name "*.tsx" | wc -l)

    # Count lines
    TOTAL_LINES=$(find src server/src -name "*.ts" -o -name "*.tsx" | xargs wc -l | tail -1 | awk '{print $1}')

    # Count commits
    if [ -d ".git" ]; then
        TOTAL_COMMITS=$(git rev-list --count HEAD 2>/dev/null || echo "0")
    else
        TOTAL_COMMITS="N/A"
    fi

    # Size
    PROJECT_SIZE=$(du -sh . 2>/dev/null | awk '{print $1}')

    echo "Code Statistics:"
    echo "  Total files: $TOTAL_FILES"
    echo "  TypeScript files: $TS_FILES"
    echo "  Total lines: $TOTAL_LINES"
    echo "  Git commits: $TOTAL_COMMITS"
    echo "  Project size: $PROJECT_SIZE"
    echo ""

    # Dependencies
    echo "Dependencies:"
    FRONTEND_DEPS=$(cat package.json | grep -o '"dependencies"' | wc -l)
    BACKEND_DEPS=$(cat server/package.json | grep -o '"dependencies"' | wc -l)
    echo "  Frontend dependencies: $FRONTEND_DEPS packages"
    echo "  Backend dependencies: $BACKEND_DEPS packages"
    echo ""

    print_success "Statistics gathered!"
}

cmd_backup() {
    print_header "Creating Project Backup"

    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_NAME="ai-audit-backup-$TIMESTAMP.tar.gz"

    cd "$PROJECT_ROOT/.."

    print_info "Creating backup: $BACKUP_NAME"

    tar -czf "$BACKUP_NAME" \
        --exclude="AI-AUDIT/node_modules" \
        --exclude="AI-AUDIT/server/node_modules" \
        --exclude="AI-AUDIT/dist" \
        --exclude="AI-AUDIT/server/dist" \
        --exclude="AI-AUDIT/.git" \
        AI-AUDIT/

    BACKUP_SIZE=$(du -h "$BACKUP_NAME" | awk '{print $1}')

    print_success "Backup created: $BACKUP_NAME ($BACKUP_SIZE)"
}

# ============================================================================
# Main Script Logic
# ============================================================================

main() {
    # Check if command provided
    if [ $# -eq 0 ]; then
        cmd_help
        exit 0
    fi

    # Execute command
    case "$1" in
        help)
            cmd_help
            ;;
        setup)
            cmd_setup
            ;;
        clean)
            cmd_clean
            ;;
        reset)
            cmd_reset
            ;;
        check)
            cmd_check
            ;;
        logs)
            cmd_logs
            ;;
        lint)
            cmd_lint
            ;;
        format)
            cmd_format
            ;;
        test)
            cmd_test
            ;;
        build)
            cmd_build
            ;;
        dev)
            cmd_dev
            ;;
        stats)
            cmd_stats
            ;;
        backup)
            cmd_backup
            ;;
        *)
            print_error "Unknown command: $1"
            echo ""
            cmd_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
