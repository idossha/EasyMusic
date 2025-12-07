# 🎵 EasyMusic

A simple Electron app for downloading music from Spotify using the spotdl Python library.

📖 **[View Documentation](https://idohaber.github.io/EasyMusic/)**

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

The build process automatically downloads FFmpeg binaries for bundling. If you need to download them separately:
```bash
npm run download-ffmpeg
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

## macOS Installation

**Important:** EasyMusic is code-signed but not notarized by Apple. When you first run the app, macOS will block it for security reasons. You must explicitly allow it in System Settings.

### First-Time Setup

1. Download the `.dmg` file from the releases page
2. Double-click the `.dmg` file to mount it
3. **Don't double-click the app icon directly** - this will trigger the security block
4. Instead, **right-click** on the EasyMusic app icon
5. Select "Open" from the context menu
6. In the security dialog that appears, click "Open" again
7. The app will now run normally and be trusted for future launches

### Alternative: Disable Gatekeeper Temporarily

If you prefer, you can temporarily disable macOS Gatekeeper:

```bash
# Disable Gatekeeper
sudo spctl --master-disable

# After installing and running EasyMusic, re-enable Gatekeeper
sudo spctl --master-enable
```

**Security Note:** Only disable Gatekeeper if you trust the source. Re-enable it immediately after installation.

## Troubleshooting

- **"Downloader not available"**: Run `npm run build-spotdl`
- **Download fails**: Check URL, internet, and disk space
- **Build issues**: Ensure Python venv is available
- **FFmpeg errors**: FFmpeg is automatically bundled with the app. For development, run `npm run download-ffmpeg`
- **macOS "App cannot be opened"**: See the macOS Installation section above

## Disclaimer

**Users are responsible for their actions and potential legal consequences. We do not support unauthorized downloading of copyrighted material and take no responsibility for user actions.**

This application is for personal, non-commercial use only. Users are expected to respect the intellectual property rights of artists and content creators, and comply with Spotify's Terms of Service and applicable local laws.
