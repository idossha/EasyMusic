#!/usr/bin/env node

/**
 * Simple test for Electron connectivity with spotdl executable
 * Tests that Electron can find and execute the PyInstaller-built spotdl binary
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('[TEST] Starting Electron connectivity test...');

// Simulate the same path resolution as the Electron app
function getSpotdlPath() {
    const basePath = path.join(__dirname, '..'); // Simulate __dirname from main.js
    const platform = process.platform;
    const executableName = platform === 'win32' ? 'spotdl.exe' : 'spotdl';
    const spotdlPath = path.join(basePath, 'binaries', 'spotdl', executableName);
    return spotdlPath;
}

const spotdlPath = getSpotdlPath();
console.log(`[TEST] Expected spotdl path: ${spotdlPath}`);

// Check if executable exists
if (!fs.existsSync(spotdlPath)) {
    console.log('[FAIL] spotdl executable not found at expected path!');
    console.log(`[INFO] Checked path: ${spotdlPath}`);
    process.exit(1);
}

console.log('[PASS] spotdl executable found at expected path');

// Test basic execution (version check)
console.log('[TEST] Testing basic spotdl execution...');
const spotdlProcess = spawn(spotdlPath, ['--version'], {
    stdio: ['pipe', 'pipe', 'pipe']
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
    console.log(`[TEST] Version check exited with code: ${code}`);
    console.log(`[TEST] stdout: "${stdout.trim()}"`);
    console.log(`[TEST] stderr: "${stderr.trim()}"`);

    if (code === 0) {
        const version = stdout.trim();
        console.log(`[PASS] spotdl version: ${version}`);
        console.log('[PASS] Electron connectivity test completed successfully!');
        console.log('[INFO] The Electron app should be able to execute spotdl using the same path resolution.');
        process.exit(0); // Exit successfully
    } else {
        console.log('[FAIL] spotdl version check failed!');
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

// Timeout after 15 seconds
setTimeout(() => {
    console.log('[FAIL] Version check timed out after 15 seconds');
    spotdlProcess.kill('SIGTERM');
    process.exit(1);
}, 15000);