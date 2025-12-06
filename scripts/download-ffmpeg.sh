#!/bin/bash
# Script to download FFmpeg binaries for bundling with EasyMusic

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BINARIES_DIR="$PROJECT_ROOT/binaries"

echo "Downloading FFmpeg binaries for EasyMusic..."
echo "Project root: $PROJECT_ROOT"

# Create binaries directories
mkdir -p "$BINARIES_DIR/darwin-arm64"
mkdir -p "$BINARIES_DIR/darwin-x64"

# Download macOS ARM64 FFmpeg
echo "Downloading FFmpeg for macOS ARM64..."
if [ ! -f "$BINARIES_DIR/darwin-arm64/ffmpeg" ]; then
  curl -L https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip -o /tmp/ffmpeg-arm64.zip
  unzip -o /tmp/ffmpeg-arm64.zip -d "$BINARIES_DIR/darwin-arm64/"
  chmod +x "$BINARIES_DIR/darwin-arm64/ffmpeg"
  rm /tmp/ffmpeg-arm64.zip
  echo "✓ macOS ARM64 FFmpeg downloaded"
else
  echo "✓ macOS ARM64 FFmpeg already exists"
fi

# Download macOS x64 FFmpeg
echo "Downloading FFmpeg for macOS x64..."
if [ ! -f "$BINARIES_DIR/darwin-x64/ffmpeg" ]; then
  curl -L https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip -o /tmp/ffmpeg-x64.zip
  unzip -o /tmp/ffmpeg-x64.zip -d "$BINARIES_DIR/darwin-x64/"
  chmod +x "$BINARIES_DIR/darwin-x64/ffmpeg"
  rm /tmp/ffmpeg-x64.zip
  echo "✓ macOS x64 FFmpeg downloaded"
else
  echo "✓ macOS x64 FFmpeg already exists"
fi

# Verify downloads
echo ""
echo "Verifying downloads..."
if [ -f "$BINARIES_DIR/darwin-arm64/ffmpeg" ]; then
  FFMPEG_ARM64_VERSION=$("$BINARIES_DIR/darwin-arm64/ffmpeg" -version 2>&1 | head -n 1)
  echo "✓ ARM64: $FFMPEG_ARM64_VERSION"
fi

if [ -f "$BINARIES_DIR/darwin-x64/ffmpeg" ]; then
  FFMPEG_X64_VERSION=$("$BINARIES_DIR/darwin-x64/ffmpeg" -version 2>&1 | head -n 1)
  echo "✓ x64: $FFMPEG_X64_VERSION"
fi

echo ""
echo "✓ All FFmpeg binaries downloaded successfully!"
echo "You can now build the app with: npm run build"
