# 🎵 EasyMusic

A simple Electron app for downloading music from Spotify and YouTube using spotdl and yt-dlp.

<p align="center">
  <img src="assets/EasyMusic_screenshot.png" alt="EasyMusic Screenshot" width="600">
</p>


## Features

- **Dual Platform Support** - Download from Spotify and YouTube
- **User-friendly GUI** - No command line required
- **High-quality downloads** - 320kbps MP3 files
- **Multiple formats** - Tracks, albums, playlists, and individual YouTube videos
- **Real-time progress** - Live download tracking with detailed logs
- **Stop/Cancel downloads** - Full control over download processes
- **Rate limiting** - Built-in delays to respect platform policies
- **Cross-platform** - Windows, macOS (Apple Silicon), Linux

## Quick Start

### Prerequisites
- Node.js 14+ and Python 3.10+

### Setup & Run
```bash
npm install
npm run build-spotdl
npm run build-ytdlp
npm run dev
```

The `build-spotdl` and `build-ytdlp` scripts will automatically download pre-built executables for both Spotify and YouTube downloading.

### Build for Production
```bash
npm run build
```

The build process automatically downloads FFmpeg binaries and builds both spotdl and yt-dlp executables for bundling. If you need to download them separately:
```bash
npm run download-ffmpeg
```

## Usage

1. **Choose your platform**: Click the mode toggle to switch between Spotify and YouTube
2. **Paste URL**: Enter a Spotify URL (track, album, playlist) or YouTube video URL
3. **Select output folder**: Choose where to save your downloads
4. **Download**: Click "Download Music" and watch real-time progress
5. **Stop anytime**: Use the stop button to cancel downloads mid-process

## Supported URLs

### Spotify
- Tracks: `https://open.spotify.com/track/...`
- Albums: `https://open.spotify.com/album/...`
- Playlists: `https://open.spotify.com/playlist/...`
- Artists: `https://open.spotify.com/artist/...`

### YouTube
- Videos: `https://www.youtube.com/watch?v=...`
- Shorts: `https://youtu.be/...`

## Project Structure

```
├── main.js          # Electron main process & download logic
├── renderer/
│   ├── app.js       # UI logic with Spotify/YouTube mode toggle
│   ├── index.html   # Interface
│   └── styles.css   # Styling
├── config/
│   └── constants.js # Configuration & constants
├── scripts/
│   ├── build-spotdl-pyinstaller.py # Spotdl executable builder
│   ├── build-ytdlp-pyinstaller.py  # yt-dlp executable builder
│   └── download-ffmpeg.sh         # FFmpeg binary downloader
├── binaries/        # Pre-built executables (spotdl, yt-dlp, ffmpeg)
├── assets/          # App icons and screenshots
└── package.json     # Dependencies & scripts
```


## Troubleshooting

### Common Issues
- **"Downloader not available"**: Run `npm run build-spotdl` for Spotify or `npm run build-ytdlp` for YouTube
- **Download fails**: Check URL format, internet connection, and available disk space
- **Build issues**: Ensure Python 3.10+ and Node.js 14+ are installed
- **FFmpeg errors**: FFmpeg is automatically bundled. For development, run `npm run download-ffmpeg`
- **YouTube downloads fail**: Ensure yt-dlp executable is built with `npm run build-ytdlp`
- **Rate limiting errors**: The app includes built-in delays to respect platform policies

### Build Scripts
```bash
npm run clean           # Remove all built binaries
npm run clean-spotdl    # Remove only spotdl binary
npm run clean-ytdlp     # Remove only yt-dlp binary
npm run build-verbose   # Build with detailed logging
```

## Disclaimer

**Users are responsible for their actions and potential legal consequences. We do not support unauthorized downloading of copyrighted material and take no responsibility for user actions.**

This application is for personal, non-commercial use only. Users are expected to respect the intellectual property rights of artists and content creators, and comply with Spotify's Terms of Service, YouTube's Terms of Service, and applicable local laws.

- **Spotify downloads** use the spotdl library and are subject to Spotify's terms
- **YouTube downloads** use yt-dlp and are subject to YouTube's terms
- **Copyright compliance** is the user's responsibility
- **Local laws** regarding digital content may vary by jurisdiction
