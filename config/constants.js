/**
 * Application constants and configuration values.
 *
 * This file centralizes all magic numbers, strings, timeouts, and other
 * configuration values used throughout the application to improve maintainability
 * and reduce code duplication.
 */

const CONSTANTS = {
  // Timeout values (in milliseconds)
  DOWNLOAD_TIMEOUT: 30 * 60 * 1000, // 30 minutes (increased for large playlists)
  GRACEFUL_KILL_TIMEOUT: 5000,

  // Rate limiting configuration
  RATE_LIMIT: {
    BATCH_SIZE: 50, // Process songs in batches of 50
    DELAY_BETWEEN_BATCHES: 10000, // 10 second delay between batches (in milliseconds)
    DELAY_BETWEEN_SONGS: 2000 // 2 second delay between individual songs (in milliseconds)
  },

  // Spotdl configuration
  SPOTDL_ARGS: {
    COMMAND: 'download',
    FORMAT: 'mp3',
    BITRATE: '320k',
    THREADS: '1',
    MAX_RETRIES: '5'
  },

  // yt-dlp configuration
  YTDLP_ARGS: {
    FORMAT: 'bestaudio[ext=m4a]/best[ext=m4a]',
    AUDIO_FORMAT: 'mp3',
    AUDIO_QUALITY: '320K',
    MAX_RETRIES: '5',
    OUTPUT_TEMPLATE: '%(title)s.%(ext)s'
  },

  // File extensions for music files
  MUSIC_EXTENSIONS: ['.mp3', '.flac', '.m4a', '.wav', '.ogg'],

  // Directory names
  DOWNLOADS_DIR: 'downloads',

  // Download modes
  DOWNLOAD_MODES: {
    SPOTIFY: 'spotify',
    YOUTUBE: 'youtube'
  },

  // Progress percentages
  PROGRESS_PREPARING: '0%',
  PROGRESS_TRACKS_FOUND: '10%',
  PROGRESS_DOWNLOADING: '50%',
  PROGRESS_COMPLETED: '80%',
  PROGRESS_FINISHED: '100%',

  // Status messages
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
    SPOTIFY_URL_PLACEHOLDER: 'Paste URL of track, artist, or playlist',
    YOUTUBE_URL_PLACEHOLDER: 'Paste YouTube video URL',
    SPOTIFY_URL_HELP: 'Paste a Spotify track, album, or playlist URL',
    YOUTUBE_URL_HELP: 'Paste a YouTube video URL',
    DOWNLOAD_COMPLETE: 'Download complete!',
    DOWNLOAD_FAILED: 'Download failed',
    DOWNLOAD_STOPPED: 'Download stopped',
    NO_ACTIVE_DOWNLOAD: 'No active download process'
  },

  // Event names for IPC communication
  IPC_EVENTS: {
    DOWNLOAD_MUSIC: 'download-music',
    DOWNLOAD_YOUTUBE: 'download-youtube',
    SELECT_OUTPUT_FOLDER: 'select-output-folder',
    STOP_DOWNLOAD: 'stop-download',
    DOWNLOAD_PROGRESS: 'download-progress'
  }
};


module.exports = CONSTANTS;