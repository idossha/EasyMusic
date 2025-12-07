# EasyMusic Test Scripts

Simple test scripts to verify the functionality of the spotdl PyInstaller executable and Electron integration.

## Test Scripts

### 1. `test-spotify-download.js`
Tests Spotify download functionality by downloading a single track from Spotify.
- **Purpose**: Verify spotdl can download from Spotify URLs
- **Duration**: ~30 seconds
- **Output**: Audio file in `../test-output/` directory

```bash
node tests/test-spotify-download.js
```

### 2. `test-youtube-download.js`
Tests YouTube download functionality by downloading audio from a YouTube video.
- **Purpose**: Verify spotdl can download from YouTube URLs
- **Duration**: ~30 seconds
- **Output**: Audio file in `../test-output/` directory

```bash
node tests/test-youtube-download.js
```

### 3. `test-electron-connectivity.js`
Tests that the Electron app can find and execute the spotdl executable.
- **Purpose**: Verify path resolution and basic execution works
- **Duration**: ~5 seconds
- **Output**: Version information from spotdl

```bash
node tests/test-electron-connectivity.js
```

## Running All Tests

```bash
# Run all tests sequentially
node tests/test-electron-connectivity.js && node tests/test-spotify-download.js && node tests/test-youtube-download.js
```

## Test Output

- `[PASS]` - Test completed successfully
- `[FAIL]` - Test failed (check error messages)
- `[WARN]` - Test passed but with warnings
- `[INFO]` - Informational messages

## Cleanup

Test downloads are saved to `../test-output/`. You can clean up test files with:

```bash
rm -rf ../test-output/
```