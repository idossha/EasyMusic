#!/usr/bin/env python3
"""
Script to download the yt-dlp binary for the current platform.
This downloads a pre-built executable that can be distributed with the app.
"""

import subprocess
import sys
import os
import shutil
import urllib.request
import platform
from pathlib import Path
from typing import Tuple, Optional


def run_command(cmd: str, cwd: Optional[str] = None, description: str = "") -> Tuple[bool, str]:
    """
    Run a command and return success status and output.

    Args:
        cmd: Command to execute
        cwd: Working directory for command
        description: Description of the command for logging

    Returns:
        Tuple of (success: bool, output: str)
    """
    if not cmd or not isinstance(cmd, str):
        print("[ERROR] Invalid command")
        return False, "Invalid command"

    try:
        if description:
            print(f"  {description}...")

        result = subprocess.run(
            cmd,
            shell=True,
            cwd=cwd,
            check=True,
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout for downloads
        )
        return True, result.stdout
    except subprocess.TimeoutExpired:
        print(f"[ERROR] Command timed out: {cmd}")
        return False, "Command timed out"
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] Command failed: {cmd}")
        if e.stderr:
            print(f"[ERROR] stderr: {e.stderr}")
        return False, e.stderr or "Command failed"


def get_platform_info():
    """Get platform information for downloading the correct binary"""
    system = platform.system().lower()
    machine = platform.machine().lower()

    # Map platform info to yt-dlp naming convention
    if system == "darwin":
        return "macos", "yt-dlp_macos"
    elif system == "linux":
        if machine in ["x86_64", "amd64"]:
            return "linux", "yt-dlp_linux"
        elif machine.startswith("arm"):
            return "linux_arm", "yt-dlp_linux_armv7l"
        else:
            return "linux", f"yt-dlp_linux_{machine}"
    elif system == "windows":
        if machine in ["x86_64", "amd64"]:
            return "windows", "yt-dlp.exe"
        else:
            return "windows", f"yt-dlp_{machine}.exe"
    else:
        raise ValueError(f"Unsupported platform: {system} {machine}")


def download_binary():
    """Download the yt-dlp binary for the current platform"""
    print("[INFO] Downloading yt-dlp binary...")

    try:
        platform_name, binary_name = get_platform_info()
    except ValueError as e:
        print(f"[ERROR] {e}")
        return False

    # yt-dlp releases page
    base_url = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/"
    download_url = f"{base_url}{binary_name}"

    script_dir = Path(__file__).parent
    project_root = script_dir.parent

    # Create binaries/ytdlp directory if it doesn't exist
    ytdlp_dir = project_root / 'binaries' / 'ytdlp'
    ytdlp_dir.mkdir(parents=True, exist_ok=True)

    # Download path
    download_path = ytdlp_dir / binary_name

    try:
        print(f"[INFO] Downloading from: {download_url}")
        with urllib.request.urlopen(download_url) as response:
            with open(download_path, 'wb') as f:
                shutil.copyfileobj(response, f)

        # Make executable on Unix-like systems
        if platform.system() != "Windows":
            os.chmod(download_path, 0o755)

        print(f"[SUCCESS] yt-dlp binary downloaded to: {download_path}")
        return True

    except Exception as e:
        print(f"[ERROR] Failed to download yt-dlp: {e}")
        return False


def verify_binary():
    """Verify that the downloaded binary works"""
    print("[INFO] Verifying yt-dlp binary...")

    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    ytdlp_dir = project_root / 'binaries' / 'ytdlp'

    # Find the binary file
    binary_files = list(ytdlp_dir.glob('yt-dlp*'))
    if not binary_files:
        print("[ERROR] No yt-dlp binary found")
        return False

    binary_path = binary_files[0]

    # Test the binary with --version
    success, output = run_command(f'"{binary_path}" --version', description="Testing yt-dlp binary")
    if success:
        version = output.strip()
        print(f"[SUCCESS] yt-dlp binary verified (version: {version})")
        return True
    else:
        print("[ERROR] yt-dlp binary verification failed")
        return False


def main():
    """Main download process"""
    print("[INFO] Starting yt-dlp binary download process...")

    # Download the binary
    if not download_binary():
        return 1

    # Verify the binary
    if not verify_binary():
        return 1

    print("[SUCCESS] yt-dlp binary setup completed successfully!")
    print("[INFO] You can now use the yt-dlp binary for YouTube downloads.")
    return 0


if __name__ == "__main__":
    sys.exit(main())