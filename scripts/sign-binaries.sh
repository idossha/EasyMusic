#!/bin/bash
# Script to code sign all Python binaries in the spotdl_env directory
# This ensures notarization succeeds by signing all .so, .dylib, and other executable files

# set -e  # Don't exit on individual signing failures

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
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

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_error "This script is only for macOS"
    exit 1
fi

# Check if binaries list exists (use environment variable or default)
BINARIES_FILE="${BINARIES_FILE:-binaries_to_sign.txt}"
if [[ ! -f "$BINARIES_FILE" ]]; then
    print_error "Binaries list not found: $BINARIES_FILE"
    print_info "Run 'python3 scripts/find-binaries.py' first to generate the list"
    exit 1
fi

# Get Developer ID certificate hash
if [[ -n "$CSC_NAME" ]]; then
    CERT_HASH="$CSC_NAME"
    print_info "Using certificate hash from CSC_NAME: $CERT_HASH"
elif [[ -n "$CODE_SIGN_IDENTITY" ]]; then
    CERT_HASH="$CODE_SIGN_IDENTITY"
    print_info "Using certificate hash from CODE_SIGN_IDENTITY: $CERT_HASH"
else
    print_error "No code signing identity found. Set CSC_NAME or CODE_SIGN_IDENTITY environment variable"
    exit 1
fi

# Verify certificate exists
if ! security find-identity -v -p codesigning | grep -q "$CERT_HASH"; then
    print_error "Developer ID certificate not found: $CERT_HASH"
    print_info "Available identities:"
    security find-identity -v -p codesigning
    exit 1
fi

print_info "Starting code signing process..."
echo "Certificate: $CERT_HASH"
echo "Binaries file: $BINARIES_FILE"
echo

# Read binaries from file and sign them
SIGNED_COUNT=0
FAILED_COUNT=0

while IFS= read -r binary_path; do
    # Skip empty lines
    [[ -z "$binary_path" ]] && continue

    # Skip comments
    [[ "$binary_path" =~ ^# ]] && continue

    # SAFETY: Only sign binaries within the project directory (spotdl_env or binaries)
    # Never sign system Python or Homebrew Python!
    if [[ "$binary_path" == /usr/* ]] || [[ "$binary_path" == /opt/* ]] || [[ "$binary_path" == /System/* ]]; then
        print_error "SAFETY: Refusing to sign system binary: $binary_path"
        print_info "Only binaries within the project directory should be signed."
        continue
    fi

    # Check if file exists
    if [[ ! -f "$binary_path" ]]; then
        print_warning "Binary not found, skipping: $binary_path"
        continue
    fi

    echo -n "Signing: $binary_path... "

    # Sign the binary with Developer ID certificate and timestamp
    # codesign outputs to stderr even on success, so we check the exit code directly
    if codesign --force --verify --verbose --timestamp --options=runtime --sign "$CERT_HASH" "$binary_path" >/dev/null 2>&1; then
        echo -e "${GREEN}OK${NC}"
        ((SIGNED_COUNT++))
    else
        echo -e "${RED}FAILED${NC}"
        ((FAILED_COUNT++))
    fi

done < "$BINARIES_FILE"

echo
print_info "Code signing completed!"
echo "Signed: $SIGNED_COUNT files"
if [[ $FAILED_COUNT -gt 0 ]]; then
    echo "Failed: $FAILED_COUNT files"
    exit 1
fi

print_success "All Python binaries have been signed successfully"
echo
print_info "You can now run electron-builder to build your app"