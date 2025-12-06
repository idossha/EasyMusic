/**
 * Preload script for EasyMusic Spotify Downloader.
 *
 * This script runs in a privileged context and exposes safe APIs
 * to the renderer process via contextBridge.
 */

const { contextBridge, ipcRenderer } = require('electron');

// Load constants synchronously
let CONSTANTS = null;
try {
    CONSTANTS = require('./config/constants');
    console.log('Preload: CONSTANTS loaded successfully');
} catch (error) {
    console.error('Preload: Failed to load CONSTANTS:', error.message);
    // Temporary fallback - define minimal constants
    console.log('Preload: Using fallback constants');
    CONSTANTS = {
        STATUS_READY: 'Downloader is ready',
        STATUS_NOT_AVAILABLE: 'Downloader not available. Please run: npm run build-spotdl',
        STATUS_FAILED: 'Failed to check downloader status',
        PROGRESS_PREPARING: '0%',
        PROGRESS_TRACKS_FOUND: '10%',
        PROGRESS_DOWNLOADING: '50%',
        PROGRESS_COMPLETED: '80%',
        PROGRESS_FINISHED: '100%',
        UI_MESSAGES: {
            DOWNLOADING: 'Downloading...',
            STOPPING: 'Stopping...',
            STOP: 'Stop',
            DOWNLOAD_MUSIC: 'Download Music'
        }
    };
}

/**
 * Validates IPC invoke arguments
 * @param {string} spotifyUrl - The Spotify URL
 * @param {string} outputFolder - The output folder path
 * @returns {boolean} True if arguments are valid
 */
function validateDownloadArgs(spotifyUrl, outputFolder) {
    if (typeof spotifyUrl !== 'string' || !spotifyUrl.trim()) {
        console.error('Invalid spotifyUrl:', spotifyUrl);
        return false;
    }
    if (outputFolder && typeof outputFolder !== 'string') {
        console.error('Invalid outputFolder:', outputFolder);
        return false;
    }
    return true;
}

/**
 * Validates callback function
 * @param {Function} callback - The callback function
 * @returns {boolean} True if callback is valid
 */
function validateCallback(callback) {
    if (typeof callback !== 'function') {
        console.error('Invalid callback: expected function, got', typeof callback);
        return false;
    }
    return true;
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
try {
    contextBridge.exposeInMainWorld('electronAPI', {
        // Download music
        downloadMusic: (spotifyUrl, outputFolder) => {
            if (!validateDownloadArgs(spotifyUrl, outputFolder)) {
                return Promise.reject(new Error('Invalid arguments'));
            }
            return ipcRenderer.invoke('download-music', spotifyUrl, outputFolder);
        },

        // Check Spotifydl availability
        checkSpotifydl: () => {
            return ipcRenderer.invoke('check-spotifydl');
        },

        // Select output folder
        selectOutputFolder: () => {
            return ipcRenderer.invoke('select-output-folder');
        },

        // Stop download
        stopDownload: () => {
            return ipcRenderer.invoke('stop-download');
        },

        // Listen for download progress
        onDownloadProgress: (callback) => {
            if (!validateCallback(callback)) {
                return () => {}; // Return no-op cleanup function
            }
            
            ipcRenderer.on('download-progress', callback);
            
            // Return cleanup function
            return () => {
                try {
                    ipcRenderer.removeListener('download-progress', callback);
                } catch (error) {
                    console.error('Failed to remove listener:', error);
                }
            };
        },

        // Remove all listeners for an event
        removeAllListeners: (event) => {
            if (typeof event !== 'string') {
                console.error('Invalid event name:', event);
                return;
            }
            ipcRenderer.removeAllListeners(event);
        }
    });
} catch (error) {
    console.error('Failed to expose electronAPI:', error.message);
}

// Expose constants to renderer process
if (CONSTANTS) {
    try {
        contextBridge.exposeInMainWorld('CONSTANTS', CONSTANTS);
        console.log('Preload: CONSTANTS exposed to renderer');
    } catch (error) {
        console.error('Preload: Failed to expose CONSTANTS:', error.message);
    }
} else {
    console.error('Preload: CONSTANTS not loaded, cannot expose to renderer');
}
