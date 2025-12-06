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

/**
 * Wait for constants to be available and then initialize
 * @returns {Promise<void>}
 */
async function waitForConstants() {
    const MAX_RETRIES = 50; // 5 seconds max
    let retries = 0;

    return new Promise((resolve, reject) => {
        const checkConstants = () => {
            const hasConstants = typeof window.CONSTANTS !== 'undefined';
            const hasElectronAPI = typeof window.electronAPI !== 'undefined';

            if (hasConstants && hasElectronAPI) {
                resolve();
            } else if (retries >= MAX_RETRIES) {
                const missing = [];
                if (!hasConstants) missing.push('CONSTANTS');
                if (!hasElectronAPI) missing.push('electronAPI');
                reject(new Error(`Failed to load: ${missing.join(', ')}`));
            } else {
                retries++;
                setTimeout(checkConstants, 100);
            }
        };
        checkConstants();
    });
}

/**
 * Cached DOM elements for the application
 */
const elements = {};

/**
 * Caches frequently used DOM elements
 */
function cacheElements() {
    elements.downloadForm = document.getElementById('downloadForm');
    elements.spotifyUrlInput = document.getElementById('spotifyUrl');
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
    elements.statusIndicator = document.getElementById('statusIndicator');
    elements.statusText = document.getElementById('statusText');
    elements.spinner = document.getElementById('spinner');
}

/**
 * Sets up event listeners for the application
 */
function setupEventListeners() {
    elements.selectFolderBtn.addEventListener('click', handleSelectFolder);
    elements.downloadForm.addEventListener('submit', handleDownload);
    elements.downloadAnotherBtn.addEventListener('click', resetForm);
    elements.stopBtn.addEventListener('click', handleStopDownload);
    elements.spotifyUrlInput.addEventListener('input', validateForm);
}

/**
 * Initializes the application
 */
async function initializeApp() {
    try {
        cacheElements();
        setupEventListeners();

        // Wait for constants and electronAPI to be available
        await waitForConstants();

        // Check downloader status on startup
        await checkDownloaderStatus();
    } catch (error) {
        console.error('Failed to initialize app:', error.message);
        alert(`Failed to initialize application: ${error.message}\n\nPlease restart the app.`);
    }
}

/**
 * Checks the downloader status and updates the UI accordingly
 */
async function checkDownloaderStatus() {
    try {
        const downloaderStatus = await window.electronAPI.checkSpotifydl();

        if (downloaderStatus.available) {
            elements.statusIndicator.className = 'status-indicator success';
            elements.statusText.textContent = CONSTANTS.STATUS_READY;
            elements.downloadBtn.disabled = false;
        } else {
            elements.statusIndicator.className = 'status-indicator error';
            elements.statusText.textContent = CONSTANTS.STATUS_NOT_AVAILABLE;
            elements.downloadBtn.disabled = true;
        }
    } catch (error) {
        console.error('Failed to check downloader status:', error.message);
        elements.statusIndicator.className = 'status-indicator error';
        elements.statusText.textContent = CONSTANTS.STATUS_FAILED;
        elements.downloadBtn.disabled = true;
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
            stopTextElement.textContent = CONSTANTS.UI_MESSAGES.STOPPING;
        }

        const result = await window.electronAPI.stopDownload();

        if (result.success) {
            elements.progressText.textContent = CONSTANTS.UI_MESSAGES.DOWNLOAD_STOPPED;
            elements.progressFill.style.width = CONSTANTS.PROGRESS_PREPARING;
            setTimeout(() => {
                resetForm();
            }, 2000);
        } else {
            alert(`Failed to stop download: ${result.error}`);
            elements.stopBtn.disabled = false;
            if (stopTextElement) {
                stopTextElement.textContent = CONSTANTS.UI_MESSAGES.STOP;
            }
        }
    } catch (error) {
        alert('Failed to stop download. Please try again.');
        elements.stopBtn.disabled = false;
        const stopTextElement = elements.stopBtn.querySelector('.stop-text');
        if (stopTextElement) {
            stopTextElement.textContent = CONSTANTS.UI_MESSAGES.STOP;
        }
    }
}

/**
 * Validates the form inputs and enables/disables the download button
 */
function validateForm() {
    if (!elements.spotifyUrlInput || !elements.outputFolderInput || !elements.downloadBtn) {
        console.error('Form elements not properly initialized');
        return;
    }

    const url = elements.spotifyUrlInput.value.trim();
    const folder = elements.outputFolderInput.value.trim();

    // Basic Spotify URL validation
    const isValidUrl = url && (
        url.includes('spotify.com') ||
        url.startsWith('spotify:') ||
        url.match(/spotify:(track|album|playlist):[a-zA-Z0-9]+/)
    );

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
    elements.progressFill.style.width = CONSTANTS.PROGRESS_PREPARING;
    elements.progressText.textContent = CONSTANTS.STATUS_PREPARING;

    // Listen for progress updates
    try {
        progressCleanup = window.electronAPI.onDownloadProgress((event, data) => {
            elements.logOutput.textContent += data;
            elements.logOutput.scrollTop = elements.logOutput.scrollHeight;

            // Update progress based on log content
            updateProgressFromLogs(data);
        });
    } catch (error) {
        // Progress listener setup failed, continue without it
    }

    try {
        const result = await window.electronAPI.downloadMusic(spotifyUrl, outputFolder);

        if (result && result.success) {
            // Download completed successfully - just reset form
            setTimeout(() => {
                resetForm();
            }, 2000);
        } else {
            throw new Error('Download failed');
        }
    } catch (error) {
        const errorMessage = error.message || 'Unknown error';
        alert(`${CONSTANTS.UI_MESSAGES.DOWNLOAD_FAILED}: ${errorMessage}`);
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

    const spotifyUrl = elements.spotifyUrlInput.value.trim();
    const outputFolder = elements.outputFolderInput.value.trim();

    if (!spotifyUrl || !outputFolder) {
        alert('Please provide both Spotify URL and output folder.');
        return;
    }

    await startDownload(spotifyUrl, outputFolder);
}

/**
 * Updates progress display based on log data
 */
function updateProgressFromLogs(logData) {
    // Update progress text based on the latest log messages
    const logContent = elements.logOutput.textContent;

    // Look for the most recent progress indicator
    const lines = logContent.split('\n').filter(line => line.trim());
    let latestStatus = CONSTANTS.STATUS_PREPARING;

    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();

        if (line.includes(CONSTANTS.LOG_DETECTED) && line.includes('tracks')) {
            const match = line.match(/Detected (\d+) tracks/);
            if (match) {
                latestStatus = `Found ${match[1]} tracks to download`;
                elements.progressFill.style.width = CONSTANTS.PROGRESS_TRACKS_FOUND;
            }
            break;
        } else if (line.startsWith(CONSTANTS.LOG_DOWNLOADING)) {
            const trackName = line.replace(CONSTANTS.LOG_DOWNLOADING, '').trim();
            latestStatus = `${CONSTANTS.LOG_DOWNLOADING} ${trackName}`;
            elements.progressFill.style.width = CONSTANTS.PROGRESS_DOWNLOADING;
            break;
        } else if (line.startsWith(CONSTANTS.LOG_FINISHED)) {
            const trackName = line.replace(CONSTANTS.LOG_FINISHED, '').trim();
            latestStatus = `Completed: ${trackName}`;
            elements.progressFill.style.width = CONSTANTS.PROGRESS_COMPLETED;
            break;
        } else if (line.includes('Finished all downloads')) {
            latestStatus = 'All downloads completed!';
            elements.progressFill.style.width = CONSTANTS.PROGRESS_FINISHED;
            break;
        } else if (line.includes(CONSTANTS.UI_MESSAGES.DOWNLOAD_STOPPED)) {
            latestStatus = CONSTANTS.UI_MESSAGES.DOWNLOAD_STOPPED;
            elements.progressFill.style.width = CONSTANTS.PROGRESS_PREPARING;
            break;
        } else if (line.includes(CONSTANTS.UI_MESSAGES.DOWNLOAD_FAILED)) {
            latestStatus = CONSTANTS.UI_MESSAGES.DOWNLOAD_FAILED;
            elements.progressFill.style.width = CONSTANTS.PROGRESS_PREPARING;
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

    elements.progressFill.style.width = CONSTANTS.PROGRESS_FINISHED;
    elements.progressText.textContent = CONSTANTS.UI_MESSAGES.DOWNLOAD_COMPLETE;
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
    
    if (elements.progressFill && CONSTANTS) {
        elements.progressFill.style.width = CONSTANTS.PROGRESS_PREPARING;
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
    if (btnText && CONSTANTS) {
        btnText.textContent = isDownloading ?
            CONSTANTS.UI_MESSAGES.DOWNLOADING : CONSTANTS.UI_MESSAGES.DOWNLOAD_MUSIC;
    }

    if (elements.spotifyUrlInput) {
        elements.spotifyUrlInput.disabled = isDownloading;
    }

    if (elements.selectFolderBtn) {
        elements.selectFolderBtn.disabled = isDownloading;
    }

    if (elements.stopBtn) {
        elements.stopBtn.style.display = isDownloading ? 'block' : 'none';
        if (isDownloading) {
            elements.stopBtn.disabled = false;
            const stopText = elements.stopBtn.querySelector('.stop-text');
            if (stopText && CONSTANTS) {
                stopText.textContent = CONSTANTS.UI_MESSAGES.STOP;
            }
        }
    }
}
