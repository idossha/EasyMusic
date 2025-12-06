/**
 * Preload script for EasyMusic Spotify Downloader.
 *
 * This script runs in a privileged context and exposes safe APIs
 * to the renderer process via contextBridge.
 */

const { contextBridge, ipcRenderer } = require('electron');

// Define constants directly in preload to avoid loading issues
const CONSTANTS = {
    DOWNLOAD_MODES: {
        SPOTIFY: 'spotify',
        YOUTUBE: 'youtube'
    },
    UI_MESSAGES: {
        SPOTIFY_URL_PLACEHOLDER: 'Paste URL of track, artist, or playlist',
        YOUTUBE_URL_PLACEHOLDER: 'Paste YouTube video URL',
        DOWNLOADING: 'Downloading...',
        STOPPING: 'Stopping...',
        STOP: 'Stop',
        DOWNLOAD_MUSIC: 'Download Music',
        DOWNLOAD_COMPLETE: 'Download complete!',
        DOWNLOAD_FAILED: 'Download failed',
        DOWNLOAD_STOPPED: 'Download stopped',
        SPOTIFY_URL_HELP: 'Paste a Spotify track, album, or playlist URL',
        YOUTUBE_URL_HELP: 'Paste a YouTube video URL',
        NO_ACTIVE_DOWNLOAD: 'No active download process',
        FOLDER_PLACEHOLDER: 'Select output folder...'
    },
    STATUS_READY: 'Downloader is ready',
    STATUS_NOT_AVAILABLE: 'Downloader not available. Please run: npm run build-spotdl',
    STATUS_FAILED: 'Failed to check downloader status',
    STATUS_PREPARING: 'Preparing download...',
    STATUS_STOPPED: 'Download stopped',
    STATUS_FAILED_DOWNLOAD: 'Download failed',
    PROGRESS_PREPARING: '0%',
    PROGRESS_TRACKS_FOUND: '10%',
    PROGRESS_DOWNLOADING: '50%',
    PROGRESS_COMPLETED: '80%',
    PROGRESS_FINISHED: '100%',
    LOG_DOWNLOADING: 'Downloading:',
    LOG_FINISHED: '✓ Finished:',
    LOG_DETECTED: 'Detected'
};

// Expose electronAPI to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // Download music (Spotify)
    downloadMusic: (spotifyUrl, outputFolder) => {
        return ipcRenderer.invoke('download-music', spotifyUrl, outputFolder);
    },

    // Download YouTube
    downloadYoutube: (youtubeUrl, outputFolder) => {
        return ipcRenderer.invoke('download-youtube', youtubeUrl, outputFolder);
    },

    // Check Spotifydl availability
    checkSpotifydl: () => {
        return ipcRenderer.invoke('check-spotifydl');
    },

    // Check yt-dlp availability
    checkYtdlp: () => {
        return ipcRenderer.invoke('check-ytdlp');
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
        // Wrap the callback to extract just the data from the event
        const wrappedCallback = (_event, data) => {
            callback(data);
        };

        ipcRenderer.on('download-progress', wrappedCallback);

        // Return cleanup function
        return () => {
            ipcRenderer.removeListener('download-progress', wrappedCallback);
        };
    },

    // Remove all listeners for an event
    removeAllListeners: (event) => {
        ipcRenderer.removeAllListeners(event);
    }
});

// Expose constants to renderer process
contextBridge.exposeInMainWorld('CONSTANTS', CONSTANTS);
