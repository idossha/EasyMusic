#!/usr/bin/env python3
"""
Script to build a standalone Spotifydl virtual environment.
This creates a virtual environment with spotdl and all dependencies.
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
            timeout=300  # 5 minute timeout
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
    """Clean up any existing spotdl installations."""
    print("🧹 Cleaning up existing installations...")

    directories_to_remove = ["spotdl_env", "spotdl-executable"]
    files_to_remove = ["spotdl"]

    for directory in directories_to_remove:
        if not directory:  # Safety check
            continue
            
        dir_path = Path(directory)
        if dir_path.exists():
            try:
                shutil.rmtree(dir_path)
                print(f"  ✓ Removed directory: {directory}")
            except PermissionError:
                print(f"  ⚠️  Permission denied: {directory}")
            except Exception as e:
                print(f"  ⚠️  Could not remove {directory}: {e}")

    for file in files_to_remove:
        if not file:  # Safety check
            continue
            
        file_path = Path(file)
        if file_path.exists():
            try:
                file_path.unlink()
                print(f"  ✓ Removed file: {file}")
            except PermissionError:
                print(f"  ⚠️  Permission denied: {file}")
            except Exception as e:
                print(f"  ⚠️  Could not remove {file}: {e}")

def check_python_version() -> bool:
    """
    Check if Python 3.7+ is available.
    
    Returns:
        True if Python 3.7+ is available, False otherwise
    """
    try:
        result = subprocess.run(
            ["python3", "--version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode != 0:
            print("[ERROR] Python 3 not found")
            return False
            
        version_output = result.stdout.strip()
        if not version_output:
            print("[ERROR] Could not parse Python version")
            return False
            
        # Parse version string (e.g., "Python 3.9.7")
        parts = version_output.split()
        if len(parts) < 2:
            print(f"[ERROR] Invalid version format: {version_output}")
            return False
            
        version = parts[1]
        version_parts = version.split('.')
        
        if len(version_parts) < 2:
            print(f"[ERROR] Invalid version format: {version}")
            return False
            
        major = int(version_parts[0])
        minor = int(version_parts[1])
        
        if major >= 3 and minor >= 7:
            print(f"[OK] Python {version} detected")
            return True
        else:
            print(f"[ERROR] Python {version} is too old. Requires Python 3.7+")
            return False
            
    except subprocess.TimeoutExpired:
        print("[ERROR] Python version check timed out")
        return False
    except ValueError as e:
        print(f"[ERROR] Could not parse Python version: {e}")
        return False
    except Exception as e:
        print(f"[ERROR] Could not detect Python version: {e}")
        return False

def create_wrapper_script(wrapper_path: str) -> bool:
    """
    Create the wrapper script for spotdl.
    
    Args:
        wrapper_path: Path where the wrapper script should be created
        
    Returns:
        True if successful, False otherwise
    """
    if not wrapper_path or not isinstance(wrapper_path, str):
        print("[ERROR] Invalid wrapper path")
        return False
        
    wrapper_script = '''#!/usr/bin/env python3
"""Wrapper script for spotdl to ensure proper execution."""
import sys
import os

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
        wrapper_path_obj = Path(wrapper_path)
        
        # Ensure parent directory exists
        wrapper_path_obj.parent.mkdir(parents=True, exist_ok=True)
        
        # Write the wrapper script
        with open(wrapper_path_obj, "w", encoding="utf-8") as f:
            f.write(wrapper_script)
        
        # Make it executable on Unix-like systems
        if os.name != 'nt':  # Not Windows
            os.chmod(wrapper_path_obj, 0o755)
            
        print(f"[OK] Created wrapper script: {wrapper_path}")
        return True
    except PermissionError:
        print(f"[ERROR] Permission denied creating wrapper script: {wrapper_path}")
        return False
    except Exception as e:
        print(f"[ERROR] Failed to create wrapper script: {e}")
        return False

def main() -> bool:
    """
    Main build function.
    
    Returns:
        True if build succeeded, False otherwise
    """
    print("[BUILD] Building Spotifydl virtual environment...")
    print("=" * 60)

    # Check prerequisites
    if not check_python_version():
        print("\n[INFO] Please install Python 3.7 or higher and try again.")
        return False

    # Clean up existing installation
    cleanup_existing_installation()

    # Define paths
    venv_dir = "spotdl_env"
    venv_bin_dir = os.path.join(venv_dir, "bin")
    
    # Check for python3 or python executable
    venv_python = os.path.join(venv_bin_dir, "python3")
    if not Path(venv_python).exists():
        venv_python = os.path.join(venv_bin_dir, "python")
    
    venv_pip = os.path.join(venv_bin_dir, "pip3")
    if not Path(venv_pip).exists():
        venv_pip = os.path.join(venv_bin_dir, "pip")
    
    wrapper_path = os.path.join(venv_dir, "spotdl_wrapper.py")

    try:
        # Create virtual environment
        print("\n📦 Creating virtual environment...")
        success, output = run_command(
            "python3 -m venv spotdl_env",
            description="Creating virtual environment"
        )
        if not success:
            print("[ERROR] Failed to create virtual environment")
            print("[INFO] Make sure python3-venv is installed (sudo apt install python3-venv on Ubuntu)")
            return False

        # Verify venv was created
        if not Path(venv_python).exists():
            print(f"[ERROR] Virtual environment Python not found at: {venv_python}")
            return False

        # Upgrade pip
        print("\n📦 Upgrading pip...")
        success, output = run_command(
            f"{venv_pip} install --upgrade pip",
            description="Upgrading pip"
        )
        if not success:
            print("⚠️  Warning: Failed to upgrade pip, continuing anyway...")

        # Install spotdl
        print("\n📦 Installing Spotifydl...")
        success, output = run_command(
            f"{venv_pip} install spotdl",
            description="Installing Spotifydl (this may take a few minutes)"
        )
        if not success:
            print("[ERROR] Failed to install Spotifydl")
            print("[INFO] Check your internet connection and try again")
            return False

        # Install yt-dlp for YouTube downloads
        print("\n📦 Installing yt-dlp...")
        success, output = run_command(
            f"{venv_pip} install yt-dlp",
            description="Installing yt-dlp for YouTube downloads"
        )
        if not success:
            print("⚠️  Warning: Failed to install yt-dlp via pip, trying system installation...")
            # Try system installation as fallback
            success, output = run_command(
                "pip3 install yt-dlp --user",
                description="Installing yt-dlp system-wide as fallback"
            )
            if not success:
                print("⚠️  Warning: yt-dlp installation failed. YouTube downloads may not work.")
                print("[INFO] You can manually install yt-dlp with: pip install yt-dlp")

        # Create wrapper script
        print("\n📝 Creating wrapper script...")
        if not create_wrapper_script(wrapper_path):
            return False

        # Create python symlink if it doesn't exist (for compatibility)
        python_link = os.path.join(venv_bin_dir, "python")
        python3_path = os.path.join(venv_bin_dir, "python3")
        
        if Path(python3_path).exists() and not Path(python_link).exists():
            try:
                if os.name != 'nt':  # Unix-like systems
                    os.symlink("python3", python_link)
                    print(f"  ✓ Created python symlink for compatibility")
            except Exception as e:
                print(f"  ⚠️  Could not create python symlink (non-critical): {e}")

        # Verify installation
        print("\n🔍 Verifying installation...")
        if not Path(wrapper_path).exists():
            print(f"[ERROR] Wrapper script not found at: {wrapper_path}")
            return False
        
        if not Path(venv_python).exists():
            print(f"[ERROR] Python executable not found at: {venv_python}")
            return False

        print("\n" + "=" * 60)
        print("[OK] Virtual environment setup complete!")
        print("=" * 60)
        print(f"   Python executable: {venv_python}")
        print(f"   Wrapper script: {wrapper_path}")
        print("\n[INFO] You can now run the app with: npm start")

        return True

    except KeyboardInterrupt:
        print("\n\n[STOPPED]  Build interrupted by user")
        return False
    except Exception as e:
        print(f"[ERROR] Unexpected error during build: {e}")
        import traceback
        traceback.print_exc()
        return False

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
        print("\n[STOPPED]  Build interrupted by user")
        sys.exit(130)
    except Exception as e:
        print(f"\n[FAILED] Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
