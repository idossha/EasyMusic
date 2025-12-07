/**
 * Electron renderer process for EasyMusic Spotify Downloader.
 *
 * This module handles:
 * - User interface interactions and form validation
 * - Download progress display and updates
 * - IPC communication with the main process
 * - UI state management
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

let progressCleanup = null;
let currentMode = 'spotify'; // Default to spotify

/**
 * Cached DOM elements for the application
 */
const elements = {};

/**
 * Caches frequently used DOM elements
 */
function cacheElements() {
    elements.downloadForm = document.getElementById('downloadForm');
    elements.musicUrlInput = document.getElementById('musicUrl');
    elements.outputFolderInput = document.getElementById('outputFolder');
    elements.selectFolderBtn = document.getElementById('selectFolderBtn');
    elements.downloadBtn = document.getElementById('downloadBtn');
    elements.progressSection = document.getElementById('progressSection');
    elements.progressFill = document.getElementById('progressFill');
    elements.progressText = document.getElementById('progressText');
    elements.logOutput = document.getElementById('logOutput');
    elements.resultsSection = document.getElementById('resultsSection');
    elements.resultsList = document.getElementById('resultsList');
    elements.downloadAnotherBtn = document.getElementById('downloadAnotherBtn');
    elements.stopBtn = document.getElementById('stopBtn');
    elements.spinner = document.getElementById('spinner');
    elements.modeToggleBtn = document.getElementById('modeToggleBtn');
}

/**
 * Sets up event listeners for the application
 */
function setupEventListeners() {
    elements.selectFolderBtn.addEventListener('click', handleSelectFolder);
    elements.downloadForm.addEventListener('submit', handleDownload);
    elements.downloadAnotherBtn.addEventListener('click', resetForm);
    elements.stopBtn.addEventListener('click', handleStopDownload);
    elements.musicUrlInput.addEventListener('input', validateForm);

    // Mode toggle button event listener
    elements.modeToggleBtn.addEventListener('click', handleModeToggle);
}

/**
 * Handles mode toggle between Spotify and YouTube
 */
function handleModeToggle(event) {
    // Toggle between spotify and youtube modes
    const newMode = currentMode === window.CONSTANTS.DOWNLOAD_MODES.SPOTIFY
        ? window.CONSTANTS.DOWNLOAD_MODES.YOUTUBE
        : window.CONSTANTS.DOWNLOAD_MODES.SPOTIFY;

    currentMode = newMode;

    // Update button data attribute
    elements.modeToggleBtn.dataset.mode = newMode;

    // Update UI based on mode
    updateUIForMode();

    // Update input placeholder and validation
    updateInputForMode();

    // Clear input value when switching modes
    elements.musicUrlInput.value = '';
    validateForm();
}

/**
 * Updates the input field based on the current mode
 */
function updateInputForMode() {
    if (currentMode === window.CONSTANTS.DOWNLOAD_MODES.SPOTIFY) {
        elements.musicUrlInput.placeholder = window.CONSTANTS.UI_MESSAGES.SPOTIFY_URL_PLACEHOLDER;
    } else if (currentMode === window.CONSTANTS.DOWNLOAD_MODES.YOUTUBE) {
        elements.musicUrlInput.placeholder = window.CONSTANTS.UI_MESSAGES.YOUTUBE_URL_PLACEHOLDER;
    }
}

/**
 * Updates the UI for the current mode (called after constants are loaded)
 */
function updateUIForMode() {
    updateInputForMode();
}

/**
 * Initializes the application
 */
async function initializeApp() {
    try {
        // Check if APIs are available
        if (!window.electronAPI || !window.CONSTANTS) {
            throw new Error('Application not properly initialized. Missing: ' +
                (!window.electronAPI ? 'electronAPI ' : '') +
                (!window.CONSTANTS ? 'CONSTANTS' : ''));
        }

        cacheElements();
        setupEventListeners();

        // Set the correct initial mode
        currentMode = window.CONSTANTS.DOWNLOAD_MODES.SPOTIFY;

        // Set initial mode
        updateInputForMode();
    } catch (error) {
        console.error('Failed to initialize app:', error.message);
        alert(`Failed to initialize application: ${error.message}\n\nPlease restart the app.`);
    }
}


/**
 * Handles the folder selection button click
 */
async function handleSelectFolder() {
    if (!window.electronAPI) {
        alert('Application not properly initialized. Please restart.');
        return;
    }

    try {
        const folderPath = await window.electronAPI.selectOutputFolder();
        if (folderPath) {
            elements.outputFolderInput.value = folderPath;
            validateForm();
        }
    } catch (error) {
        alert('Failed to select output folder. Please try again.');
    }
}

/**
 * Handles stopping the download process
 */
async function handleStopDownload() {
    if (!window.electronAPI) {
        return;
    }

    try {
        elements.stopBtn.disabled = true;
        const stopTextElement = elements.stopBtn.querySelector('.stop-text');
        if (stopTextElement) {
            stopTextElement.textContent = window.CONSTANTS.UI_MESSAGES.STOPPING;
        }

        const result = await window.electronAPI.stopDownload();

        if (result.success) {
            elements.progressText.textContent = window.CONSTANTS.UI_MESSAGES.DOWNLOAD_STOPPED;
            elements.progressFill.style.width = window.CONSTANTS.PROGRESS_PREPARING;
            setTimeout(() => {
                resetForm();
            }, 2000);
        } else {
            alert(`Failed to stop download: ${result.error}`);
            elements.stopBtn.disabled = false;
            if (stopTextElement) {
                stopTextElement.textContent = window.CONSTANTS.UI_MESSAGES.STOP;
            }
        }
    } catch (error) {
        alert('Failed to stop download. Please try again.');
        elements.stopBtn.disabled = false;
        const stopTextElement = elements.stopBtn.querySelector('.stop-text');
        if (stopTextElement) {
            stopTextElement.textContent = window.CONSTANTS.UI_MESSAGES.STOP;
        }
    }
}

/**
 * Validates the form inputs and enables/disables the download button
 */
function validateForm() {
    if (!elements.musicUrlInput || !elements.outputFolderInput || !elements.downloadBtn) {
        console.error('Form elements not properly initialized');
        return;
    }

    const url = elements.musicUrlInput.value.trim();
    const folder = elements.outputFolderInput.value.trim();

    let isValidUrl = false;

    if (currentMode === window.CONSTANTS.DOWNLOAD_MODES.SPOTIFY) {
        // Basic Spotify URL validation
        isValidUrl = url && (
            url.includes('spotify.com') ||
            url.startsWith('spotify:') ||
            url.match(/spotify:(track|album|playlist):[a-zA-Z0-9]+/)
        );
    } else if (currentMode === window.CONSTANTS.DOWNLOAD_MODES.YOUTUBE) {
        // Basic YouTube URL validation
        isValidUrl = url && (
            url.includes('youtube.com') ||
            url.includes('youtu.be') ||
            url.match(/youtube\.com\/watch\?v=[\w-]+/) ||
            url.match(/youtu\.be\/[\w-]+/)
        );
    }

    const isLoading = elements.downloadBtn.classList.contains('loading');
    elements.downloadBtn.disabled = !isValidUrl || !folder || isLoading;
}

/**
 * Initiates the download process
 * @param {string} spotifyUrl - The Spotify URL to download
 * @param {string} outputFolder - The output folder path
 */
async function startDownload(spotifyUrl, outputFolder) {
    if (!window.electronAPI) {
        alert('Application not properly initialized. Please restart.');
        return;
    }

    // Clean up any existing progress listener
    if (progressCleanup) {
        progressCleanup();
        progressCleanup = null;
    }

    // Start download process
    setDownloadingState(true);
    elements.progressSection.style.display = 'block';
    elements.resultsSection.style.display = 'none';
    elements.logOutput.textContent = '';
    elements.progressFill.style.width = window.CONSTANTS.PROGRESS_PREPARING;
    elements.progressText.textContent = window.CONSTANTS.STATUS_PREPARING;

    // Listen for progress updates
    try {
        progressCleanup = window.electronAPI.onDownloadProgress((data) => {
            elements.logOutput.textContent += data;
            elements.logOutput.scrollTop = elements.logOutput.scrollHeight;

            // Update progress based on log content
            updateProgressFromLogs(data);
        });
    } catch (error) {
        // Progress listener setup failed, continue without it
    }

    try {
        let result;
        if (currentMode === window.CONSTANTS.DOWNLOAD_MODES.SPOTIFY) {
            result = await window.electronAPI.downloadMusic(spotifyUrl, outputFolder);
        } else if (currentMode === window.CONSTANTS.DOWNLOAD_MODES.YOUTUBE) {
            result = await window.electronAPI.downloadYoutube(spotifyUrl, outputFolder);
        }

        if (result && result.success) {
            // Check if download was stopped by user
            if (result.stopped) {
                // Download was stopped, just reset form without showing error
                setTimeout(() => {
                    resetForm();
                }, 1000);
            } else {
                // Download completed successfully - just reset form
                setTimeout(() => {
                    resetForm();
                }, 2000);
            }
        } else {
            throw new Error('Download failed');
        }
    } catch (error) {
        const errorMessage = error.message || 'Unknown error';
        // Don't show alert if download was stopped
        if (!errorMessage.includes('stopped')) {
            alert(`${window.CONSTANTS.UI_MESSAGES.DOWNLOAD_FAILED}: ${errorMessage}`);
        }
        resetForm();
    } finally {
        setDownloadingState(false);
        if (progressCleanup) {
            progressCleanup();
            progressCleanup = null;
        }
    }
}

/**
 * Handles the download form submission
 */
async function handleDownload(event) {
    event.preventDefault();

    const musicUrl = elements.musicUrlInput.value.trim();
    const outputFolder = elements.outputFolderInput.value.trim();

    if (!musicUrl || !outputFolder) {
        alert('Please provide both URL and output folder.');
        return;
    }

    await startDownload(musicUrl, outputFolder);
}

/**
 * Updates progress display based on log data
 */
function updateProgressFromLogs(logData) {
    // Update progress text based on the latest log messages
    const logContent = elements.logOutput.textContent;

    // Look for the most recent progress indicator
    const lines = logContent.split('\n').filter(line => line.trim());
    let latestStatus = window.CONSTANTS.STATUS_PREPARING;

    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();

        if (line.includes(window.CONSTANTS.LOG_DETECTED) && line.includes('tracks')) {
            const match = line.match(/Detected (\d+) tracks/);
            if (match) {
                latestStatus = `Found ${match[1]} tracks to download`;
                elements.progressFill.style.width = window.CONSTANTS.PROGRESS_TRACKS_FOUND;
            }
            break;
        } else if (line.startsWith(window.CONSTANTS.LOG_DOWNLOADING)) {
            const trackName = line.replace(window.CONSTANTS.LOG_DOWNLOADING, '').trim();
            latestStatus = `${window.CONSTANTS.LOG_DOWNLOADING} ${trackName}`;
            elements.progressFill.style.width = window.CONSTANTS.PROGRESS_DOWNLOADING;
            break;
        } else if (line.startsWith(window.CONSTANTS.LOG_FINISHED)) {
            const trackName = line.replace(window.CONSTANTS.LOG_FINISHED, '').trim();
            latestStatus = `Completed: ${trackName}`;
            elements.progressFill.style.width = window.CONSTANTS.PROGRESS_COMPLETED;
            break;
        } else if (line.includes('Finished all downloads')) {
            latestStatus = 'All downloads completed!';
            elements.progressFill.style.width = window.CONSTANTS.PROGRESS_FINISHED;
            break;
        } else if (line.includes(window.CONSTANTS.UI_MESSAGES.DOWNLOAD_STOPPED)) {
            latestStatus = window.CONSTANTS.UI_MESSAGES.DOWNLOAD_STOPPED;
            elements.progressFill.style.width = window.CONSTANTS.PROGRESS_PREPARING;
            break;
        } else if (line.includes(window.CONSTANTS.UI_MESSAGES.DOWNLOAD_FAILED)) {
            latestStatus = window.CONSTANTS.UI_MESSAGES.DOWNLOAD_FAILED;
            elements.progressFill.style.width = window.CONSTANTS.PROGRESS_PREPARING;
            break;
        }
    }

    elements.progressText.textContent = latestStatus;
}

/**
 * Shows the download results
 */
function showResults(files) {
    elements.progressSection.style.display = 'none';
    elements.resultsSection.style.display = 'block';

    elements.resultsList.innerHTML = '';
    files.forEach(file => {
        const fileElement = document.createElement('div');
        fileElement.textContent = `✓ ${file}`;
        elements.resultsList.appendChild(fileElement);
    });

    elements.progressFill.style.width = window.CONSTANTS.PROGRESS_FINISHED;
    elements.progressText.textContent = window.CONSTANTS.UI_MESSAGES.DOWNLOAD_COMPLETE;
}

/**
 * Resets the form to its initial state
 */
function resetForm() {
    // Clean up progress listener if it exists
    if (progressCleanup) {
        progressCleanup();
        progressCleanup = null;
    }

    if (elements.progressSection) {
        elements.progressSection.style.display = 'none';
    }
    
    if (elements.resultsSection) {
        elements.resultsSection.style.display = 'none';
    }
    
    if (elements.logOutput) {
        elements.logOutput.textContent = '';
    }
    
    if (elements.progressFill && window.CONSTANTS) {
        elements.progressFill.style.width = window.CONSTANTS.PROGRESS_PREPARING;
    }
    
    if (elements.stopBtn) {
        elements.stopBtn.style.display = 'none';
    }
    
    setDownloadingState(false);
    validateForm();
}

/**
 * Updates the downloading state of the UI
 * @param {boolean} isDownloading - Whether download is in progress
 */
function setDownloadingState(isDownloading) {
    if (!elements.downloadBtn) {
        return;
    }

    elements.downloadBtn.disabled = isDownloading;
    elements.downloadBtn.classList.toggle('loading', isDownloading);

    if (elements.spinner) {
        elements.spinner.style.display = isDownloading ? 'block' : 'none';
    }

    const btnText = document.querySelector('.btn-text');
    if (btnText && window.CONSTANTS) {
        btnText.textContent = isDownloading ?
            window.CONSTANTS.UI_MESSAGES.DOWNLOADING : window.CONSTANTS.UI_MESSAGES.DOWNLOAD_MUSIC;
    }

    if (elements.musicUrlInput) {
        elements.musicUrlInput.disabled = isDownloading;
    }

    if (elements.selectFolderBtn) {
        elements.selectFolderBtn.disabled = isDownloading;
    }

    if (elements.stopBtn) {
        elements.stopBtn.style.display = isDownloading ? 'block' : 'none';
        if (isDownloading) {
            elements.stopBtn.disabled = false;
            const stopText = elements.stopBtn.querySelector('.stop-text');
            if (stopText && window.CONSTANTS) {
                stopText.textContent = window.CONSTANTS.UI_MESSAGES.STOP;
            }
        }
    }
}
