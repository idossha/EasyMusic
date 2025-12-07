#!/usr/bin/env node

/**
 * Simple test for Spotify download functionality
 * Tests that spotdl can download from a Spotify URL
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('[TEST] Starting Spotify download test...');

const spotdlPath = path.join(__dirname, '..', 'binaries', 'spotdl', 'spotdl');
const testUrl = 'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh'; // Popular test track
const outputDir = path.join(__dirname, '..', 'test-output');

console.log(`[TEST] Using spotdl at: ${spotdlPath}`);
console.log(`[TEST] Test URL: ${testUrl}`);

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`[TEST] Created output directory: ${outputDir}`);
}

// Test command: spotdl download [URL] --output [DIR] --limit 1 (limit to 1 track for quick test)
const args = ['download', testUrl, '--output', outputDir, '--limit', '1'];

console.log(`[TEST] Running: ${spotdlPath} ${args.join(' ')}`);

const spotdlProcess = spawn(spotdlPath, args, {
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 30000 // 30 second timeout
});

let stdout = '';
let stderr = '';

spotdlProcess.stdout.on('data', (data) => {
    stdout += data.toString();
});

spotdlProcess.stderr.on('data', (data) => {
    stderr += data.toString();
});

spotdlProcess.on('close', (code) => {
    console.log(`[TEST] Process exited with code: ${code}`);

    if (code === 0) {
        console.log('[PASS] Spotify download test completed successfully!');

        // Check if any files were created in output directory
        const files = fs.readdirSync(outputDir);
        const audioFiles = files.filter(file => file.endsWith('.mp3') || file.endsWith('.m4a') || file.endsWith('.flac'));

        if (audioFiles.length > 0) {
            console.log(`[PASS] Found ${audioFiles.length} audio file(s): ${audioFiles.join(', ')}`);
        } else {
            console.log('[WARN] No audio files found in output directory');
        }

    } else {
        console.log('[FAIL] Spotify download test failed!');
        if (stderr) {
            console.log('[ERROR] stderr:', stderr);
        }
        if (stdout) {
            console.log('[INFO] stdout:', stdout);
        }
        process.exit(1);
    }
});

spotdlProcess.on('error', (error) => {
    console.log('[FAIL] Failed to start spotdl process:', error.message);
    process.exit(1);
});

// Timeout after 30 seconds
setTimeout(() => {
    console.log('[FAIL] Test timed out after 30 seconds');
    spotdlProcess.kill('SIGTERM');
    process.exit(1);
}, 30000);