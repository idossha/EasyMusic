/**
 * Electron main process for EasyMusic Spotify Downloader.
 *
 * This module handles:
 * - Application lifecycle and window management
 * - IPC communication with the renderer process
 * - Spotify download process management
 * - File system operations
 */

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { spawn } = require('child_process');
const CONSTANTS = require('./config/constants');

// Redirect console output to stdout/stderr in development mode
if (process.argv.includes('--dev')) {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  console.log = (...args) => {
    process.stdout.write('[MAIN] ' + args.join(' ') + '\n');
    originalLog(...args);
  };

  console.error = (...args) => {
    process.stderr.write('[MAIN] ' + args.join(' ') + '\n');
    originalError(...args);
  };

  console.warn = (...args) => {
    process.stderr.write('[MAIN] ' + args.join(' ') + '\n');
    originalWarn(...args);
  };
}

let mainWindow = null;
let activeProcess = null;
let downloadTimeout = null;
let currentTrackCount = 0;
let downloadedTracks = 0;
let currentTrackName = null;

/**
 * Resets all download tracking variables to their initial state
 */
function resetDownloadTracking() {
  currentTrackCount = 0;
  downloadedTracks = 0;
  currentTrackName = null;
  
  // Clear any active timeout
  if (downloadTimeout) {
    clearTimeout(downloadTimeout);
    downloadTimeout = null;
  }
}

/**
 * Gets the paths for the spotdl virtual environment
 * @returns {Object} Object containing venvPython and wrapperScript paths
 */
function getSpotdlPaths() {
  const fsSync = require('fs');
  const venvDir = path.join(__dirname, CONSTANTS.SPOTDL_ENV_DIR, 'bin');
  
  // Try python3 first (common on macOS/Linux), then python (Windows)
  let venvPython = path.join(venvDir, 'python3');
  if (!fsSync.existsSync(venvPython)) {
    venvPython = path.join(venvDir, 'python');
  }
  
  const wrapperScript = path.join(__dirname, CONSTANTS.SPOTDL_ENV_DIR, 'spotdl_wrapper.py');
  return { venvPython, wrapperScript };
}

/**
 * Checks if spotdl is available in the virtual environment
 * @returns {Promise<boolean>} True if spotdl is available and working
 */
async function checkSpotifydl() {
  try {
    const { venvPython, wrapperScript } = getSpotdlPaths();

    // Check if virtual environment files exist
    const fsSync = require('fs');
    const venvExists = fsSync.existsSync(venvPython);
    const wrapperExists = fsSync.existsSync(wrapperScript);

    if (!venvExists || !wrapperExists) {
      return false;
    }

    // Test basic execution
    return new Promise((resolve) => {
      let testProcess = null;
      let timeoutId = null;
      let isResolved = false;

      const cleanup = (result) => {
        if (isResolved) return;
        isResolved = true;

        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        if (testProcess && !testProcess.killed) {
          testProcess.kill();
        }

        resolve(result);
      };

      try {
        testProcess = spawn(venvPython, [wrapperScript, '--help'], {
          stdio: ['ignore', 'ignore', 'ignore']
        });

        testProcess.on('close', (code) => {
          cleanup(code === 0);
        });

        testProcess.on('error', (error) => {
          cleanup(false);
        });

        // Timeout after configured duration
        timeoutId = setTimeout(() => {
          cleanup(false);
        }, CONSTANTS.SPOTDL_CHECK_TIMEOUT);
      } catch (error) {
        cleanup(false);
      }
    });
  } catch (error) {
    console.error('Spotdl check failed:', error.message);
    return false;
  }
}

/**
 * Creates the main application window
 */
function createWindow() {
  console.log('Main: Creating window...');
  console.log('Main: Preload script path:', path.join(__dirname, 'preload.js'));

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'EasyMusic - Spotify Downloader'
  });

  console.log('Main: Window created successfully');

  // Load the app
  mainWindow.loadFile('renderer/index.html').catch(error => {
    console.error('Failed to load index.html:', error);
  });

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    // Clean up resources when window is closed
    if (activeProcess) {
      activeProcess.kill('SIGTERM');
      activeProcess = null;
    }
    resetDownloadTracking();
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for Spotifydl operations
ipcMain.handle('download-music', async (event, spotifyUrl, outputFolder) => {
  try {
    return await downloadMusic(spotifyUrl, outputFolder);
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
});

ipcMain.handle('check-spotifydl', async () => {
  try {
    const available = await checkSpotifydl();
    return { available };
  } catch (error) {
    return { available: false, error: error.message };
  }
});

ipcMain.handle('select-output-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory']
  });

  if (!result.canceled) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('get-constants', () => {
  return CONSTANTS;
});

ipcMain.handle('stop-download', async () => {
  try {
    if (!activeProcess) {
      return { success: false, error: 'No active download process' };
    }

    const processToKill = activeProcess;
    activeProcess = null;
    resetDownloadTracking();

    // Try graceful termination first
    processToKill.kill('SIGTERM');

    // Give it a moment to terminate gracefully, then force kill if needed
    setTimeout(() => {
      if (processToKill && !processToKill.killed) {
        processToKill.kill('SIGKILL');
      }
    }, CONSTANTS.GRACEFUL_KILL_TIMEOUT);

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(CONSTANTS.IPC_EVENTS.DOWNLOAD_PROGRESS, '\nDownload stopped by user.\n');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Failed to stop download:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Validates if the provided URL is a valid Spotify URL
 * @param {string} url - The URL to validate
 * @returns {boolean} True if the URL is valid
 */
function isValidSpotifyUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  const trimmedUrl = url.trim();
  return trimmedUrl.includes('spotify.com') || trimmedUrl.startsWith('spotify:');
}

/**
 * Ensures the download directory exists, creating it if necessary
 * @param {string} outputFolder - The output folder path (optional)
 * @returns {Promise<string>} The absolute path to the downloads directory
 * @throws {Error} If directory creation fails
 */
async function ensureDownloadDirectory(outputFolder = null) {
  try {
    const downloadsDir = outputFolder || path.join(__dirname, CONSTANTS.DOWNLOADS_DIR);
    await fs.mkdir(downloadsDir, { recursive: true });
    return downloadsDir;
  } catch (error) {
    console.error('Failed to create download directory:', error);
    throw new Error(`Failed to create download directory: ${error.message}`);
  }
}

/**
 * Parses track count from spotdl output
 * @param {string} line - The output line to parse
 * @returns {number|null} The track count or null if not found
 */
function parseTrackCount(line) {
  const trackCountMatch = line.match(/Found (\d+) songs? in (.+)/i);
  return trackCountMatch && !line.includes('Processing query') ? parseInt(trackCountMatch[1]) : null;
}

/**
 * Parses download progress from spotdl output
 * @param {string} line - The output line to parse
 * @returns {Object|null} Object with trackName if found, null otherwise
 */
function parseDownloadProgress(line) {
  const downloadStartMatch = line.match(/Downloading (.+?) \((\d+)\/(\d+)\)/i) ||
                             line.match(/Downloading (.+?) to/i) ||
                             line.match(/\[(\d+)\/(\d+)\]\s*(.+?)\s*\(/i);

  if (downloadStartMatch && downloadStartMatch[1] && downloadStartMatch[1].length > 0) {
    return { trackName: downloadStartMatch[1].trim() };
  }
  return null;
}

/**
 * Parses download completion from spotdl output
 * @param {string} line - The output line to parse
 * @returns {string|null} The completed track name or null if not found
 */
function parseDownloadComplete(line) {
  const downloadCompleteMatch = line.match(/Downloaded "(.+?)":/i) ||
                                line.match(/Downloaded (.+?) in/i) ||
                                line.match(/\[download\]\s*(.+?)\s*has finished downloading/i) ||
                                line.match(/Successfully downloaded (.+?)$/i);

  if (downloadCompleteMatch && downloadCompleteMatch[1]) {
    return downloadCompleteMatch[1].trim().replace(/"/g, '');
  }
  return null;
}

/**
 * Gets list of music files from the download directory
 * @param {string} downloadsDir - The download directory path
 * @returns {Promise<string[]>} Array of music filenames
 */
async function getDownloadedFiles(downloadsDir) {
  try {
    const files = await fs.readdir(downloadsDir);
    return files.filter(file =>
      CONSTANTS.MUSIC_EXTENSIONS.some(ext => file.endsWith(ext))
    );
  } catch (error) {
    console.error('Error reading output directory:', error);
    return [];
  }
}

/**
 * Downloads music from Spotify using spotdl
 * @param {string} spotifyUrl - The Spotify URL to download
 * @param {string} outputFolder - The output folder path (optional)
 * @returns {Promise<Object>} Download result with success status and files
 * @throws {Error} If download fails
 */
async function downloadMusic(spotifyUrl, outputFolder = null) {
  // Basic validation - ensure it's a Spotify URL
  if (!isValidSpotifyUrl(spotifyUrl)) {
    throw new Error('Invalid Spotify URL');
  }

  // Check if there's already an active download
  if (activeProcess) {
    throw new Error('A download is already in progress');
  }

  // Ensure download directory exists
  const downloadsDir = await ensureDownloadDirectory(outputFolder);

  return new Promise((resolve, reject) => {
    const { venvPython, wrapperScript } = getSpotdlPaths();

    // Prepare spotdl command arguments
    const args = [
      CONSTANTS.SPOTDL_ARGS.COMMAND,
      spotifyUrl,
      '--output', downloadsDir,
      '--format', CONSTANTS.SPOTDL_ARGS.FORMAT,
      '--bitrate', CONSTANTS.SPOTDL_ARGS.BITRATE,
      '--threads', CONSTANTS.SPOTDL_ARGS.THREADS,
      '--max-retries', CONSTANTS.SPOTDL_ARGS.MAX_RETRIES
    ];

    // Send progress updates safely
    const sendProgress = (message) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(CONSTANTS.IPC_EVENTS.DOWNLOAD_PROGRESS, message);
      }
    };

    sendProgress(`Starting download for: ${spotifyUrl}\n`);
    sendProgress(`Output folder: ${downloadsDir}\n\n`);

    let spotdlProcess;
    try {
      // Spawn the spotdl process
      spotdlProcess = spawn(venvPython, [wrapperScript, ...args], {
        cwd: downloadsDir,
        stdio: ['ignore', 'pipe', 'pipe']
      });
    } catch (error) {
      reject(new Error(`Failed to start download process: ${error.message}`));
      return;
    }

    // Track the active process for potential termination
    activeProcess = spotdlProcess;

    let outputBuffer = '';
    let errorBuffer = '';
    let isSettled = false;

    const cleanup = () => {
      activeProcess = null;
      resetDownloadTracking();
    };

    const settlePromise = (settleFunc, ...args) => {
      if (isSettled) return;
      isSettled = true;
      cleanup();
      settleFunc(...args);
    };

    // Handle stdout
    spotdlProcess.stdout.on('data', (data) => {
      const output = data.toString();
      outputBuffer += output;

      // Parse output for better progress tracking
      const lines = output.split('\n').filter(line => line.trim());
      for (const line of lines) {
        // Detect track count
        const trackCount = parseTrackCount(line);
        if (trackCount !== null) {
          currentTrackCount = trackCount;
          sendProgress(`Detected ${currentTrackCount} tracks.\n`);
          continue;
        }

        // Detect starting download of a track
        const downloadProgress = parseDownloadProgress(line);
        if (downloadProgress) {
          currentTrackName = downloadProgress.trackName;
          sendProgress(`${CONSTANTS.LOG_DOWNLOADING} ${currentTrackName}...\n`);
        }

        // Detect completed download
        const completedTrack = parseDownloadComplete(line);
        if (completedTrack) {
          downloadedTracks++;
          sendProgress(`${CONSTANTS.LOG_FINISHED} ${completedTrack}\n`);
          currentTrackName = null;
        }
      }
    });

    // Handle stderr
    spotdlProcess.stderr.on('data', (data) => {
      const error = data.toString();
      errorBuffer += error;
      sendProgress(error);
    });

    // Handle process completion
    spotdlProcess.on('close', async (code) => {
      if (code === 0) {
        // Success - get list of downloaded files
        try {
          const musicFiles = await getDownloadedFiles(downloadsDir);
          sendProgress('\n✓ Finished all downloads.\n');
          settlePromise(resolve, {
            success: true,
            files: musicFiles,
            output: outputBuffer
          });
        } catch (error) {
          console.error('Failed to get downloaded files:', error);
          settlePromise(reject, new Error(`Download completed but failed to list files: ${error.message}`));
        }
      } else {
        // Error
        sendProgress(`\nDownload failed!\n${errorBuffer}\n`);
        settlePromise(reject, new Error(`Download failed: ${errorBuffer || 'Unknown error'}`));
      }
    });

    // Handle process errors
    spotdlProcess.on('error', (error) => {
      settlePromise(reject, new Error(`Failed to start download process: ${error.message}`));
    });

    // Timeout after configured duration
    downloadTimeout = setTimeout(() => {
      if (!isSettled && spotdlProcess && !spotdlProcess.killed) {
        spotdlProcess.kill('SIGTERM');
        settlePromise(reject, new Error(`Download timed out after ${CONSTANTS.DOWNLOAD_TIMEOUT / 60000} minutes`));
      }
    }, CONSTANTS.DOWNLOAD_TIMEOUT);
  });
}


