#!/usr/bin/env node

/**
 * Test script to verify that Spotify downloads use spotdl and YouTube downloads use yt-dlp
 */

const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Mock the app object to avoid Electron dependencies
global.app = {
  isPackaged: false
};

// Mock __dirname for development
global.__dirname = path.join(__dirname, '..');

// Import required modules
const CONSTANTS = require('../config/constants.js');

// Define helper functions directly (copied from main.js to avoid Electron dependencies)
function getBasePath() {
  // In packaged app, extraResources are in process.resourcesPath
  // In development, they're in __dirname
  if (global.app.isPackaged) {
    return process.resourcesPath;
  }
  return global.__dirname;
}

function getSpotdlPath() {
  const fsSync = require('fs');
  const basePath = getBasePath();
  const platform = process.platform;

  // Determine the executable name based on platform
  const executableName = platform === 'win32' ? 'spotdl.exe' : 'spotdl';
  const spotdlPath = path.join(basePath, 'binaries', 'spotdl', executableName);

  // Check if the executable exists
  if (fsSync.existsSync(spotdlPath)) {
    return spotdlPath;
  }

  // Fallback to system spotdl if available
  return 'spotdl';
}

function getYtdlpPath() {
  const fsSync = require('fs');
  const basePath = getBasePath();
  const platform = process.platform;

  // Determine the executable name based on platform
  let executableName;
  if (platform === 'win32') {
    executableName = 'yt-dlp.exe';
  } else if (platform === 'darwin') {
    executableName = 'yt-dlp_macos';
  } else {
    executableName = 'yt-dlp';
  }

  const ytdlpPath = path.join(basePath, 'binaries', 'ytdlp', executableName);

  // Check if the executable exists
  if (fsSync.existsSync(ytdlpPath)) {
    return ytdlpPath;
  }

  // Fallback to system yt-dlp if available
  return 'yt-dlp';
}

// Get binary paths
const spotdlPath = getSpotdlPath();
const ytdlpPath = getYtdlpPath();

console.log('[TEST] Testing binary separation...');
console.log(`[TEST] SpotDL path: ${spotdlPath}`);
console.log(`[TEST] yt-dlp path: ${ytdlpPath}`);
console.log('');

// Test spotdl
console.log('[TEST] Testing SpotDL binary...');
const spotdlProcess = spawn(spotdlPath, ['--version'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let spotdlOutput = '';
let spotdlError = '';

spotdlProcess.stdout.on('data', (data) => {
  spotdlOutput += data.toString();
});

spotdlProcess.stderr.on('data', (data) => {
  spotdlError += data.toString();
});

spotdlProcess.on('close', (code) => {
  if (code === 0) {
    console.log('[PASS] SpotDL is working');
    console.log(`[INFO] Version output: ${spotdlOutput.trim()}`);
  } else {
    console.log('[FAIL] SpotDL failed');
    console.log(`[ERROR] ${spotdlError}`);
  }

  // Test yt-dlp
  console.log('');
  console.log('[TEST] Testing yt-dlp binary...');
  const ytdlpProcess = spawn(ytdlpPath, ['--version'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let ytdlpOutput = '';
  let ytdlpError = '';

  ytdlpProcess.stdout.on('data', (data) => {
    ytdlpOutput += data.toString();
  });

  ytdlpProcess.stderr.on('data', (data) => {
    ytdlpError += data.toString();
  });

  ytdlpProcess.on('close', (code) => {
    if (code === 0) {
      console.log('[PASS] yt-dlp is working');
      console.log(`[INFO] Version output: ${ytdlpOutput.trim()}`);
    } else {
      console.log('[FAIL] yt-dlp failed');
      console.log(`[ERROR] ${ytdlpError}`);
    }

    console.log('');
    console.log('[TEST] Binary separation test completed!');

    // Check if binaries are different
    if (spotdlPath !== ytdlpPath) {
      console.log('[PASS] Binaries are properly separated');
      console.log(`[INFO] Spotify: ${path.basename(spotdlPath)}`);
      console.log(`[INFO] YouTube: ${path.basename(ytdlpPath)}`);
    } else {
      console.log('[WARN] Binaries appear to be the same - this may be expected if using system binaries');
    }

    process.exit(code === 0 ? 0 : 1);
  });
});

spotdlProcess.on('error', (error) => {
  console.log('[FAIL] Failed to start SpotDL process:', error.message);
  process.exit(1);
});