#!/usr/bin/env python3
"""
Simplified script to build a standalone spotdl executable using PyInstaller.
This creates a single bundled executable that can be distributed with the app.
"""

import subprocess
import sys
import os
import shutil
from pathlib import Path


def run_command(cmd, description=""):
    """Run a command and return success status."""
    if description:
        print(f"  {description}...")

    try:
        result = subprocess.run(
            cmd,
            shell=True,
            check=True,
            capture_output=True,
            text=True,
            timeout=600  # 10 minute timeout for PyInstaller
        )
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] Command failed: {cmd}")
        if e.stderr:
            print(f"Error output: {e.stderr}")
        return False, e.stderr or "Command failed"
    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")
        return False, str(e)


def cleanup_existing():
    """Clean up any existing build artifacts."""
    print("Cleaning up existing installations...")

    paths_to_remove = ["spotdl_env", "spotdl-executable", "build", "dist/spotdl"]

    for path_str in paths_to_remove:
        path = Path(path_str)
        if path.exists():
            try:
                if path.is_dir():
                    shutil.rmtree(path)
                else:
                    path.unlink()
                print(f"  [OK] Removed: {path_str}")
            except Exception as e:
                print(f"  [WARN] Could not remove {path_str}: {e}")


def check_python_version():
    """Check if Python 3.10+ is available and return the command."""
    try:
        # Try different Python commands
        python_cmds = ["python3.11", "python3.10", "python3"]

        for cmd in python_cmds:
            try:
                result = subprocess.run(
                    [cmd, "--version"],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                if result.returncode == 0:
                    version_output = result.stdout.strip()
                    parts = version_output.split()
                    if len(parts) >= 2:
                        version = parts[1]
                        version_parts = version.split('.')
                        if len(version_parts) >= 2:
                            major = int(version_parts[0])
                            minor = int(version_parts[1])
                            if major >= 3 and minor >= 10:
                                print(f"[OK] Python {version} detected ({cmd})")
                                return cmd
            except (subprocess.CalledProcessError, FileNotFoundError, ValueError):
                continue

        print("[ERROR] Python 3.10+ not found")
        return None
    except Exception as e:
        print(f"[ERROR] Could not detect Python version: {e}")
        return None


def install_dependencies(python_cmd):
    """Install required dependencies."""
    print("\nInstalling dependencies...")

    # Install PyInstaller
    success, _ = run_command(
        f"{python_cmd} -m pip install pyinstaller",
        "Installing PyInstaller"
    )
    if not success:
        return False

    # Install spotdl
    success, _ = run_command(
        f"{python_cmd} -m pip install spotdl",
        "Installing spotdl"
    )
    if not success:
        return False

    # Install yt-dlp
    success, _ = run_command(
        f"{python_cmd} -m pip install yt-dlp",
        "Installing yt-dlp"
    )
    if not success:
        print("[WARN] Failed to install yt-dlp, but continuing...")

    return True


def build_executable(python_cmd):
    """Build the spotdl executable using PyInstaller."""
    print("\nBuilding spotdl executable with PyInstaller...")

    # Create output directory
    output_dir = Path("binaries/spotdl")
    output_dir.mkdir(parents=True, exist_ok=True)

    # PyInstaller command
    # --onefile: Create a single executable file
    # --name: Name of the executable
    # --clean: Clean PyInstaller cache before building
    # --noconfirm: Replace output directory without asking
    # --collect-data: Include data files from packages
    # --hidden-import: Explicitly import modules that PyInstaller might miss
    pyinstaller_cmd = (
        f"{python_cmd} -m PyInstaller "
        f"--onefile "
        f"--name spotdl "
        f"--clean "
        f"--noconfirm "
        f"--distpath {output_dir} "
        f"--collect-data pykakasi "
        f"--collect-data charset_normalizer "
        f"--hidden-import pykakasi "
        f"--hidden-import charset_normalizer "
        f"-c "  # Console application
    )

    # Add platform-specific options
    if sys.platform == 'darwin':
        pyinstaller_cmd += "--target-arch arm64 "

    # Create a simple entry point script for PyInstaller
    entry_script = Path("scripts/spotdl_entry.py")
    entry_script.write_text("""#!/usr/bin/env python3
import sys
from spotdl.console.entry_point import entry_point

if __name__ == '__main__':
    entry_point()
""")

    pyinstaller_cmd += f"{entry_script}"

    success, output = run_command(
        pyinstaller_cmd,
        "Running PyInstaller (this may take a few minutes)"
    )

    # Clean up entry script
    if entry_script.exists():
        entry_script.unlink()

    if not success:
        return False

    # Verify the executable was created
    if sys.platform == 'darwin':
        executable_path = output_dir / "spotdl"
    elif sys.platform == 'win32':
        executable_path = output_dir / "spotdl.exe"
    else:
        executable_path = output_dir / "spotdl"

    if not executable_path.exists():
        print(f"[ERROR] Executable not found at: {executable_path}")
        return False

    # Make executable on Unix-like systems
    if sys.platform != 'win32':
        os.chmod(executable_path, 0o755)

    print(f"[OK] Executable created at: {executable_path}")
    return True


def main():
    """Main build function."""
    print("[BUILD] Building spotdl with PyInstaller...")
    print("=" * 60)

    # Check Python version and get the command
    python_cmd = check_python_version()
    if not python_cmd:
        print("\n[INFO] Please install Python 3.10 or higher and try again.")
        return False

    # Clean up existing artifacts
    cleanup_existing()

    # Install dependencies
    if not install_dependencies(python_cmd):
        print("[ERROR] Failed to install dependencies")
        return False

    # Build the executable
    if not build_executable(python_cmd):
        print("[ERROR] Failed to build executable")
        return False

    print("\n" + "=" * 60)
    print("[OK] PyInstaller build complete!")
    print("=" * 60)
    print("\n[INFO] You can now run the app with: npm start")

    return True


if __name__ == "__main__":
    try:
        success = main()
        if success:
            print("\n[SUCCESS] Build completed successfully!")
            sys.exit(0)
        else:
            print("\n[FAILED] Build failed. Please check the error messages above.")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n[STOPPED] Build interrupted by user")
        sys.exit(130)
    except Exception as e:
        print(f"\n[FAILED] Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
