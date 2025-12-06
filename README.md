# 🎵 EasyMusic

A simple Electron app for downloading music from Spotify using the spotdl Python library.

## Features

- **User-friendly GUI** - No command line required
- **High-quality downloads** - 320kbps MP3 files
- **Multiple formats** - Tracks, albums, and playlists
- **Real-time progress** - Live download tracking
- **Cross-platform** - Windows, macOS, Linux

## Quick Start

### Prerequisites
- Node.js 14+ and Python 3.7+

### Setup & Run
```bash
npm install
npm run build-spotdl
npm run dev
```

### Build for Production
```bash
npm run build
```

## Usage

1. Paste a Spotify URL (track, album, or playlist)
2. Select output folder
3. Click "Download Music"
4. Watch progress and enjoy your music!

## Supported URLs

- Tracks: `https://open.spotify.com/track/...`
- Albums: `https://open.spotify.com/album/...`
- Playlists: `https://open.spotify.com/playlist/...`

## Project Structure

```
├── main.js          # Electron main process & download logic
├── renderer/
│   ├── app.js       # UI logic
│   ├── index.html   # Interface
│   └── styles.css   # Styling
├── config/
│   └── constants.js # Configuration
├── scripts/
│   └── build-spotdl.py # Python environment setup
└── package.json     # Dependencies & scripts
```

## Troubleshooting

- **"Downloader not available"**: Run `npm run build-spotdl`
- **Download fails**: Check URL, internet, and disk space
- **Build issues**: Ensure Python venv is available

## Disclaimer

**Users are responsible for their actions and potential legal consequences. We do not support unauthorized downloading of copyrighted material and take no responsibility for user actions.**

This application is for personal, non-commercial use only. Users are expected to respect the intellectual property rights of artists and content creators, and comply with Spotify's Terms of Service and applicable local laws.
