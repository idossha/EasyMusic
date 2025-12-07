#!/usr/bin/env node

/**
 * Simple test for YouTube download functionality
 * Tests that yt-dlp can download from a YouTube URL
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('[TEST] Starting YouTube download test...');

const ytdlpPath = path.join(__dirname, '..', 'binaries', 'ytdlp', 'yt-dlp_macos');
const ffmpegPath = path.join(__dirname, '..', 'binaries', 'darwin-arm64', 'ffmpeg');
const testUrl = 'https://www.youtube.com/watch?v=Jq8Ld58_rGo'; // Test video
const outputDir = path.join(__dirname, '..', 'test-output');

console.log(`[TEST] Using yt-dlp at: ${ytdlpPath}`);
console.log(`[TEST] Using ffmpeg at: ${ffmpegPath}`);
console.log(`[TEST] Test URL: ${testUrl}`);

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`[TEST] Created output directory: ${outputDir}`);
}

// Test command: yt-dlp --extract-audio --audio-format mp3 --output [DIR]/%(title)s.%(ext)s [URL]
const args = [
  '--extract-audio',
  '--audio-format', 'mp3',
  '--audio-quality', '192K',
  '--output', path.join(outputDir, '%(title)s.%(ext)s'),
  '--ffmpeg-location', ffmpegPath,
  testUrl
];

console.log(`[TEST] Running: ${ytdlpPath} ${args.join(' ')}`);

const ytdlpProcess = spawn(ytdlpPath, args, {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: outputDir,
    timeout: 60000 // 60 second timeout for yt-dlp
});

let stdout = '';
let stderr = '';

ytdlpProcess.stdout.on('data', (data) => {
    stdout += data.toString();
    console.log('[STDOUT]', data.toString().trim());
});

ytdlpProcess.stderr.on('data', (data) => {
    stderr += data.toString();
    console.log('[STDERR]', data.toString().trim());
});

ytdlpProcess.on('close', (code) => {
    console.log(`[TEST] Process exited with code: ${code}`);

    if (code === 0) {
        console.log('[PASS] YouTube download test completed successfully!');

        // Check if any files were created in output directory
        const files = fs.readdirSync(outputDir);
        const audioFiles = files.filter(file => file.endsWith('.mp3') || file.endsWith('.m4a') || file.endsWith('.flac'));

        if (audioFiles.length > 0) {
            console.log(`[PASS] Found ${audioFiles.length} audio file(s): ${audioFiles.join(', ')}`);
        } else {
            console.log('[WARN] No audio files found in output directory');
        }

    } else {
        console.log('[FAIL] YouTube download test failed!');
        if (stderr) {
            console.log('[ERROR] stderr:', stderr);
        }
        if (stdout) {
            console.log('[INFO] stdout:', stdout);
        }
        process.exit(1);
    }
});

ytdlpProcess.on('error', (error) => {
    console.log('[FAIL] Failed to start yt-dlp process:', error.message);
    process.exit(1);
});

// Timeout after 60 seconds
setTimeout(() => {
    console.log('[FAIL] Test timed out after 60 seconds');
    ytdlpProcess.kill('SIGTERM');
    process.exit(1);
}, 60000);