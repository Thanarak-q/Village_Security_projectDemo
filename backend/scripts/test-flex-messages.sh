#!/bin/bash

# Test script for LINE Flex Message Service
# This script runs both unit tests and manual tests

set -e

echo "🧪 LINE Flex Message Service Test Suite"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the backend directory"
    exit 1
fi

# Check if required dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if vitest is installed
if ! npm list vitest > /dev/null 2>&1; then
    echo "📦 Installing test dependencies..."
    npm install --save-dev vitest @vitest/ui
fi

# Check if tsx is installed for manual tests
if ! npm list tsx > /dev/null 2>&1; then
    echo "📦 Installing tsx for manual tests..."
    npm install --save-dev tsx
fi

echo ""
echo "🔧 Environment Check:"
echo "====================="

# Check environment variables
if [ -z "$LINE_CHANNEL_ACCESS_TOKEN" ]; then
    echo "⚠️  LINE_CHANNEL_ACCESS_TOKEN not set"
    echo "   Set it in your .env file for manual tests"
else
    echo "✅ LINE_CHANNEL_ACCESS_TOKEN is set"
fi

if [ -z "$FRONTEND_URL" ]; then
    echo "⚠️  FRONTEND_URL not set"
    echo "   Set it in your .env file for manual tests"
else
    echo "✅ FRONTEND_URL is set"
fi

echo ""
echo "🧪 Running Unit Tests:"
echo "======================"

# Run unit tests
if npm run test:flex 2>/dev/null; then
    echo "✅ Unit tests passed!"
else
    echo "📝 Running unit tests with vitest..."
    npx vitest run src/tests/flexMessage.test.ts
fi

echo ""
echo "🔍 Running Manual Tests:"
echo "========================"

# Check if manual test should be run
read -p "Do you want to run manual tests with real LINE API? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -z "$LINE_CHANNEL_ACCESS_TOKEN" ]; then
        echo "❌ Cannot run manual tests without LINE_CHANNEL_ACCESS_TOKEN"
        echo "   Please set it in your .env file and try again"
        exit 1
    fi
    
    echo "🚀 Running manual tests..."
    echo "⚠️  Make sure you have updated the USER_ID in manualFlexMessageTest.ts"
    echo ""
    
    npx tsx src/tests/manualFlexMessageTest.ts
else
    echo "⏭️  Skipping manual tests"
fi

echo ""
echo "📊 Test Summary:"
echo "================"
echo "✅ Unit tests completed"
echo "📱 Manual tests: $([ -z "$LINE_CHANNEL_ACCESS_TOKEN" ] && echo "Skipped (no token)" || echo "Completed")"
echo ""
echo "🎉 Test suite finished!"
echo ""
echo "💡 Tips:"
echo "  - Check your LINE app for received messages"
echo "  - Update USER_ID in manualFlexMessageTest.ts for real testing"
echo "  - Set LINE_CHANNEL_ACCESS_TOKEN in .env for manual tests"
echo "  - Run 'npm run test:watch' for continuous testing"
