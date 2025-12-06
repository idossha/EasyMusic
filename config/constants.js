/**
 * Application constants and configuration values.
 *
 * This file centralizes all magic numbers, strings, timeouts, and other
 * configuration values used throughout the application to improve maintainability
 * and reduce code duplication.
 */

const CONSTANTS = {
  // Timeout values (in milliseconds)
  SPOTDL_CHECK_TIMEOUT: 5000,
  DOWNLOAD_TIMEOUT: 10 * 60 * 1000, // 10 minutes
  GRACEFUL_KILL_TIMEOUT: 5000,

  // Spotdl configuration
  SPOTDL_ARGS: {
    COMMAND: 'download',
    FORMAT: 'mp3',
    BITRATE: '320k',
    THREADS: '1',
    MAX_RETRIES: '5'
  },

  // File extensions for music files
  MUSIC_EXTENSIONS: ['.mp3', '.flac', '.m4a', '.wav', '.ogg'],

  // Directory names
  SPOTDL_ENV_DIR: 'spotdl_env',
  DOWNLOADS_DIR: 'downloads',

  // Progress percentages
  PROGRESS_PREPARING: '0%',
  PROGRESS_TRACKS_FOUND: '10%',
  PROGRESS_DOWNLOADING: '50%',
  PROGRESS_COMPLETED: '80%',
  PROGRESS_FINISHED: '100%',

  // Status messages
  STATUS_CHECKING: 'Checking downloader...',
  STATUS_READY: 'Downloader is ready',
  STATUS_NOT_AVAILABLE: 'Downloader not available. Please run: npm run build-spotdl',
  STATUS_FAILED: 'Failed to check downloader status',
  STATUS_PREPARING: 'Preparing download...',
  STATUS_STOPPED: 'Download stopped',
  STATUS_FAILED_DOWNLOAD: 'Download failed',

  // Log prefixes
  LOG_DOWNLOADING: 'Downloading:',
  LOG_FINISHED: '✓ Finished:',
  LOG_DETECTED: 'Detected',

  // UI Messages
  UI_MESSAGES: {
    DOWNLOADING: 'Downloading...',
    STOPPING: 'Stopping...',
    STOP: 'Stop',
    DOWNLOAD_MUSIC: 'Download Music',
    FOLDER_PLACEHOLDER: 'Select output folder...',
    URL_PLACEHOLDER: 'https://open.spotify.com/track/... or spotify:track:...',
    URL_HELP: 'Paste a Spotify track, album, or playlist URL',
    DOWNLOAD_COMPLETE: 'Download complete!',
    DOWNLOAD_FAILED: 'Download failed',
    DOWNLOAD_STOPPED: 'Download stopped',
    NO_ACTIVE_DOWNLOAD: 'No active download process'
  },

  // Event names for IPC communication
  IPC_EVENTS: {
    DOWNLOAD_MUSIC: 'download-music',
    CHECK_SPOTIFYDL: 'check-spotifydl',
    SELECT_OUTPUT_FOLDER: 'select-output-folder',
    STOP_DOWNLOAD: 'stop-download',
    DOWNLOAD_PROGRESS: 'download-progress'
  }
};


module.exports = CONSTANTS;