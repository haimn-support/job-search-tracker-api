#!/bin/bash

# Build Optimization Script
# Provides various build optimization commands and analysis

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to analyze bundle size
analyze_bundle() {
    print_status "Analyzing bundle size..."
    
    if [ ! -d "build" ]; then
        print_error "Build directory not found. Please run 'npm run build' first."
        exit 1
    fi
    
    # Calculate total bundle size
    TOTAL_SIZE=$(du -sh build/static 2>/dev/null | cut -f1)
    JS_SIZE=$(du -sh build/static/js 2>/dev/null | cut -f1)
    CSS_SIZE=$(du -sh build/static/css 2>/dev/null | cut -f1)
    
    print_success "Bundle Analysis Complete:"
    echo "  Total Static Assets: $TOTAL_SIZE"
    echo "  JavaScript Files: $JS_SIZE"
    echo "  CSS Files: $CSS_SIZE"
    
    # Check individual file sizes
    print_status "Largest JavaScript files:"
    find build/static/js -name "*.js" -exec du -h {} + | sort -hr | head -5
    
    print_status "Largest CSS files:"
    find build/static/css -name "*.css" -exec du -h {} + | sort -hr | head -5
}

# Function to run bundle size check
check_bundle_size() {
    print_status "Running bundle size check..."
    
    if command_exists bundlesize; then
        npx bundlesize
        print_success "Bundle size check completed"
    else
        print_warning "bundlesize not installed. Installing..."
        npm install --save-dev bundlesize
        npx bundlesize
    fi
}

# Function to run webpack bundle analyzer
run_bundle_analyzer() {
    print_status "Running webpack bundle analyzer..."
    
    if [ ! -d "build" ]; then
        print_error "Build directory not found. Please run 'npm run build' first."
        exit 1
    fi
    
    if command_exists webpack-bundle-analyzer; then
        npx webpack-bundle-analyzer build/static/js/*.js
    else
        print_warning "webpack-bundle-analyzer not installed. Installing..."
        npm install --save-dev webpack-bundle-analyzer
        npx webpack-bundle-analyzer build/static/js/*.js
    fi
}

# Function to optimize images
optimize_images() {
    print_status "Optimizing images..."
    
    if command_exists imagemin; then
        find public -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" | while read -r file; do
            echo "Optimizing: $file"
            imagemin "$file" --out-dir=public/optimized
        done
        print_success "Image optimization completed"
    else
        print_warning "imagemin not installed. Skipping image optimization."
    fi
}

# Function to clean build directory
clean_build() {
    print_status "Cleaning build directory..."
    rm -rf build
    print_success "Build directory cleaned"
}

# Function to run production build
build_production() {
    print_status "Building for production..."
    npm run build:production
    print_success "Production build completed"
}

# Function to run staging build
build_staging() {
    print_status "Building for staging..."
    npm run build:staging
    print_success "Staging build completed"
}

# Function to show help
show_help() {
    echo "Build Optimization Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  analyze          Analyze bundle size and composition"
    echo "  check-size       Check bundle size against limits"
    echo "  analyzer         Run webpack bundle analyzer"
    echo "  optimize-images   Optimize images in public directory"
    echo "  clean            Clean build directory"
    echo "  build-prod       Run production build"
    echo "  build-staging    Run staging build"
    echo "  all              Run all optimization steps"
    echo "  help             Show this help message"
    echo ""
}

# Main script logic
case "${1:-help}" in
    "analyze")
        analyze_bundle
        ;;
    "check-size")
        check_bundle_size
        ;;
    "analyzer")
        run_bundle_analyzer
        ;;
    "optimize-images")
        optimize_images
        ;;
    "clean")
        clean_build
        ;;
    "build-prod")
        build_production
        ;;
    "build-staging")
        build_staging
        ;;
    "all")
        print_status "Running all optimization steps..."
        clean_build
        build_production
        analyze_bundle
        check_bundle_size
        print_success "All optimization steps completed"
        ;;
    "help"|*)
        show_help
        ;;
esac
