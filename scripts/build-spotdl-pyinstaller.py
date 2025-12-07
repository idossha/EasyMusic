#!/usr/bin/env python3
"""
Script to build a standalone spotdl executable using PyInstaller.
This creates a self-contained executable that can be distributed with the app.
"""

import subprocess
import sys
import os
import shutil
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
            timeout=600  # 10 minute timeout for PyInstaller builds
        )
        return True, result.stdout
    except subprocess.TimeoutExpired:
        print(f"[ERROR] Command timed out: {cmd}")
        return False, "Command timed out"
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] Command failed: {cmd}")
        if e.stderr:
            print(f"Error output: {e.stderr}")
        return False, e.stderr or "Command failed"
    except Exception as e:
        print(f"[ERROR] Unexpected error running command: {e}")
        return False, str(e)


def cleanup_existing_installation() -> None:
    """Clean up any existing spotdl installations and build artifacts."""
    print("[CLEANUP] Cleaning up existing installations...")

    directories_to_remove = ["spotdl_env", "spotdl-executable", "build", "dist"]
    files_to_remove = ["spotdl.spec"]

    for directory in directories_to_remove:
        if not directory:  # Safety check
            continue

        dir_path = Path(directory)
        if dir_path.exists():
            try:
                shutil.rmtree(dir_path)
                print(f"  [OK] Removed directory: {directory}")
            except PermissionError:
                print(f"  [WARN] Permission denied: {directory}")
            except Exception as e:
                print(f"  [WARN] Could not remove {directory}: {e}")

    for file in files_to_remove:
        if not file:  # Safety check
            continue

        file_path = Path(file)
        if file_path.exists():
            try:
                file_path.unlink()
                print(f"  [OK] Removed file: {file}")
            except PermissionError:
                print(f"  [WARN] Permission denied: {file}")
            except Exception as e:
                print(f"  [WARN] Could not remove {file}: {e}")


def check_python_version() -> Optional[str]:
    """
    Check if Python 3.8+ is available for PyInstaller compatibility.

    Returns:
        Python command string if compatible version found, None otherwise
    """
    try:
        # Try different Python commands in order of preference
        python_cmds = ["python3.11", "python3.10", "python3.9", "python3.8", "python3"]

        for cmd in python_cmds:
            try:
                result = subprocess.run(
                    [cmd, "--version"],
                    capture_output=True,
                    text=True,
                    timeout=5
                )

                if result.returncode != 0:
                    continue

                version_output = result.stdout.strip()
                if not version_output:
                    continue

                # Parse version string (e.g., "Python 3.9.7")
                parts = version_output.split()
                if len(parts) < 2:
                    continue

                version = parts[1]
                version_parts = version.split('.')

                if len(version_parts) < 2:
                    continue

                major = int(version_parts[0])
                minor = int(version_parts[1])

                if major >= 3 and minor >= 8:
                    print(f"[OK] Python {version} detected ({cmd})")
                    return cmd
                else:
                    print(f"[WARN] Python {version} is too old for PyInstaller. Requires Python 3.8+")

            except (subprocess.CalledProcessError, FileNotFoundError, ValueError):
                continue

        print("[ERROR] Python 3.8+ not found")
        return None

    except Exception as e:
        print(f"[ERROR] Could not detect Python version: {e}")
        return None


def create_pyinstaller_entry_point(entry_point_path: str) -> bool:
    """
    Create a PyInstaller entry point script for spotdl.

    Args:
        entry_point_path: Path where the entry point script should be created

    Returns:
        True if successful, False otherwise
    """
    if not entry_point_path or not isinstance(entry_point_path, str):
        print("[ERROR] Invalid entry point path")
        return False

    entry_point_script = '''#!/usr/bin/env python3
"""PyInstaller entry point for spotdl executable."""

import sys
import os

# Ensure proper encoding for subprocess calls
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

try:
    from spotdl.console.entry_point import entry_point
except ImportError as e:
    print(f"Error: Failed to import spotdl: {e}", file=sys.stderr)
    sys.exit(1)

if __name__ == '__main__':
    try:
        entry_point()
    except Exception as e:
        print(f"Error: spotdl execution failed: {e}", file=sys.stderr)
        sys.exit(1)
'''

    try:
        entry_point_path_obj = Path(entry_point_path)

        # Ensure parent directory exists
        entry_point_path_obj.parent.mkdir(parents=True, exist_ok=True)

        # Write the entry point script
        with open(entry_point_path_obj, "w", encoding="utf-8") as f:
            f.write(entry_point_script)

        print(f"[OK] Created PyInstaller entry point: {entry_point_path}")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to create entry point script: {e}")
        return False


def build_executable_with_pyinstaller(python_cmd: str) -> bool:
    """
    Build a standalone executable using PyInstaller.

    Args:
        python_cmd: Python command to use

    Returns:
        True if successful, False otherwise
    """
    print("\n[BUILD] Setting up build environment...")

    env_path = Path("spotdl_env")
    entry_point_path = "spotdl_entry.py"

    # Create virtual environment
    success, output = run_command(
        f"{python_cmd} -m venv spotdl_env",
        description="Creating virtual environment"
    )
    if not success:
        print("[ERROR] Failed to create virtual environment")
        print("[INFO] Make sure python3-venv is installed")
        return False

    # Define paths within virtual environment
    venv_bin_dir = env_path / "bin"
    venv_python = venv_bin_dir / "python3"
    if not venv_python.exists():
        venv_python = venv_bin_dir / "python"

    venv_pip = venv_bin_dir / "pip3"
    if not venv_pip.exists():
        venv_pip = venv_bin_dir / "pip"

    # Verify venv was created
    if not venv_python.exists():
        print(f"[ERROR] Virtual environment Python not found at: {venv_python}")
        return False

    # Upgrade pip
    print("\n[BUILD] Upgrading pip...")
    success, output = run_command(
        f"{venv_pip} install --upgrade pip",
        description="Upgrading pip"
    )
    if not success:
        print("[WARN] Warning: Failed to upgrade pip, continuing anyway...")

    # Install spotdl and dependencies
    print("\n[BUILD] Installing spotdl and dependencies...")
    success, output = run_command(
        f"{venv_pip} install spotdl yt-dlp",
        description="Installing spotdl and yt-dlp"
    )
    if not success:
        print("[ERROR] Failed to install spotdl")
        print("[INFO] Check your internet connection and try again")
        return False

    # Install PyInstaller
    print("\n[BUILD] Installing PyInstaller...")
    success, output = run_command(
        f"{venv_pip} install pyinstaller",
        description="Installing PyInstaller"
    )
    if not success:
        print("[ERROR] Failed to install PyInstaller")
        return False

    # Create entry point script
    print("\n[BUILD] Creating PyInstaller entry point...")
    if not create_pyinstaller_entry_point(entry_point_path):
        return False

    # Build the executable
    print("\n[BUILD] Building standalone executable...")
    output_dir = Path("binaries/spotdl")
    output_dir.mkdir(parents=True, exist_ok=True)

    # PyInstaller command with optimizations for spotdl
    pyinstaller_cmd = [
        str(venv_python), "-m", "PyInstaller",
        "--onefile",  # Single executable file
        "--name", "spotdl",  # Output executable name
        "--distpath", str(output_dir),
        "--workpath", "build",
        "--specpath", ".",
        "--clean",  # Clean cache
        "--noconfirm",  # Don't ask for confirmation
        # Exclude unnecessary modules to reduce size
        "--exclude-module", "tkinter",
        "--exclude-module", "matplotlib",
        "--exclude-module", "PIL",
        "--exclude-module", "numpy",
        "--exclude-module", "pytest",
        "--exclude-module", "setuptools",
        # Collect data files for dependencies
        "--collect-data", "pykakasi",
        "--collect-data", "spotdl",
        "--collect-data", "ytmusicapi",
        # Include locale files explicitly
        "--add-data", f"{env_path}/lib/python*/site-packages/ytmusicapi/locales:ytmusicapi/locales",
        entry_point_path
    ]

    success, output = run_command(
        " ".join(pyinstaller_cmd),
        description="Building executable with PyInstaller (this may take several minutes)"
    )
    if not success:
        print("[ERROR] PyInstaller build failed")
        return False

    # Verify the executable was created
    executable_path = output_dir / "spotdl"
    if not executable_path.exists():
        print(f"[ERROR] Executable not found at: {executable_path}")
        return False

    # Make executable (Unix-like systems)
    if os.name != 'nt':
        try:
            os.chmod(executable_path, 0o755)
            print("  [OK] Made executable runnable")
        except Exception as e:
            print(f"  [WARN] Could not make executable: {e}")

    # Clean up temporary files
    try:
        Path(entry_point_path).unlink(missing_ok=True)
        print("  [OK] Cleaned up temporary files")
    except Exception as e:
        print(f"  [WARN] Could not clean up temporary files: {e}")

    print(f"[OK] Executable built successfully: {executable_path}")
    return True


def main() -> bool:
    """
    Main build function.

    Returns:
        True if build succeeded, False otherwise
    """
    print("[BUILD] Building spotdl standalone executable...")
    print("=" * 60)

    # Check prerequisites
    python_cmd = check_python_version()
    if not python_cmd:
        print("\n[INFO] Please install Python 3.8 or higher and try again.")
        return False

    # Clean up existing installation
    cleanup_existing_installation()

    # Build the executable
    if not build_executable_with_pyinstaller(python_cmd):
        print("[ERROR] Failed to build executable")
        return False

    # Verify the build
    output_dir = Path("binaries/spotdl")
    executable_path = output_dir / "spotdl"

    print("\n[VERIFY] Verifying build...")
    if not executable_path.exists():
        print(f"[ERROR] Executable not found at: {executable_path}")
        return False

    # Get file size for verification
    try:
        size_mb = executable_path.stat().st_size / (1024 * 1024)
        print(f"  [OK] Executable size: {size_mb:.1f} MB")
    except Exception as e:
        print(f"  [WARN] Could not get file size: {e}")

    print("\n" + "=" * 60)
    print("[OK] Executable build complete!")
    print("=" * 60)
    print(f"   Executable: {executable_path}")
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
