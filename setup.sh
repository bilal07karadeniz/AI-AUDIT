#!/bin/bash

# SolidAudit Setup Script
# Automates the setup process for development

set -e  # Exit on error

echo ""
echo "🚀 SolidAudit Setup Script"
echo "============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js version
echo "📦 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version is too old (${NODE_VERSION})${NC}"
    echo "Please upgrade to Node.js 18 or higher"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) detected${NC}"

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm $(npm -v) detected${NC}"
echo ""

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install
echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd server
npm install
cd ..
echo -e "${GREEN}✅ Backend dependencies installed${NC}"
echo ""

# Setup environment files
echo "⚙️  Setting up environment files..."

# Frontend .env
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ Created frontend .env file${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Frontend .env already exists, skipping${NC}"
fi

# Backend .env
if [ ! -f "server/.env" ]; then
    if [ -f "server/.env.example" ]; then
        cp server/.env.example server/.env
        echo -e "${GREEN}✅ Created backend .env file${NC}"
        echo ""
        echo -e "${YELLOW}⚠️  IMPORTANT: You need to add your Anthropic API key!${NC}"
        echo ""
        read -p "Do you want to enter your API key now? (y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            read -p "Enter your Anthropic API key: " API_KEY
            if [ ! -z "$API_KEY" ]; then
                # Replace the API key line in server/.env
                if [[ "$OSTYPE" == "darwin"* ]]; then
                    # macOS
                    sed -i '' "s/ANTHROPIC_API_KEY=.*/ANTHROPIC_API_KEY=$API_KEY/" server/.env
                else
                    # Linux
                    sed -i "s/ANTHROPIC_API_KEY=.*/ANTHROPIC_API_KEY=$API_KEY/" server/.env
                fi
                echo -e "${GREEN}✅ API key saved${NC}"
            fi
        else
            echo -e "${YELLOW}⚠️  Remember to edit server/.env and add your API key before running!${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Backend .env already exists, skipping${NC}"
fi

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. Make sure you have added your Anthropic API key to server/.env"
echo "   Get one at: https://console.anthropic.com/"
echo ""
echo "2. Start the backend server (in one terminal):"
echo -e "   ${GREEN}npm run server:dev${NC}"
echo ""
echo "3. Start the frontend (in another terminal):"
echo -e "   ${GREEN}npm run dev${NC}"
echo ""
echo "4. Open your browser to:"
echo -e "   ${GREEN}http://localhost:5173${NC}"
echo ""
echo "For detailed instructions, see README.md"
echo ""
echo "Happy auditing! 🔍"
echo ""
