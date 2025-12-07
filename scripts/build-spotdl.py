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
    print("Cleaning up existing installations...")

    directories_to_remove = ["spotdl_env", "spotdl-executable"]
    files_to_remove = ["spotdl"]

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

def check_python_version() -> Tuple[bool, Optional[str]]:
    """
    Check if Python 3.10+ is available.

    Returns:
        Tuple of (success: bool, python_command: str or None)
    """
    try:
        # Try python first (for compatibility), then python3.11, then python3.10
        python_cmds = ["python", "python3.11", "python3.10"]

        result = None
        python_cmd = None

        for cmd in python_cmds:
            try:
                result = subprocess.run(
                    [cmd, "--version"],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                if result.returncode == 0:
                    python_cmd = cmd
                    break
            except (subprocess.CalledProcessError, FileNotFoundError):
                continue

        if result is None or result.returncode != 0:
            print("[ERROR] Python 3.10+ not found")
            return False, None

        version_output = result.stdout.strip()
        if not version_output:
            print("[ERROR] Could not parse Python version")
            return False, None

        # Parse version string (e.g., "Python 3.11.13")
        parts = version_output.split()
        if len(parts) < 2:
            print(f"[ERROR] Invalid version format: {version_output}")
            return False, None

        version = parts[1]
        version_parts = version.split('.')

        if len(version_parts) < 2:
            print(f"[ERROR] Invalid version format: {version}")
            return False, None

        major = int(version_parts[0])
        minor = int(version_parts[1])

        if major >= 3 and minor >= 10:
            print(f"[OK] Python {version} detected ({python_cmd})")
            return True, python_cmd
        else:
            print(f"[ERROR] Python {version} is too old. Requires Python 3.10+")
            return False, None

    except subprocess.TimeoutExpired:
        print("[ERROR] Python version check timed out")
        return False, None
    except ValueError as e:
        print(f"[ERROR] Could not parse Python version: {e}")
        return False, None
    except Exception as e:
        print(f"[ERROR] Could not detect Python version: {e}")
        return False, None

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
        os.chmod(wrapper_path_obj, 0o755)
            
        print(f"[OK] Created wrapper script: {wrapper_path}")
        return True
    except PermissionError:
        print(f"[ERROR] Permission denied creating wrapper script: {wrapper_path}")
        return False
    except Exception as e:
        print(f"[ERROR] Failed to create wrapper script: {e}")
        return False

def check_ci_environment() -> None:
    """Check if we're running in a CI environment and log relevant info."""
    import os

    ci_vars = ['CI', 'GITHUB_ACTIONS', 'GITLAB_CI', 'TRAVIS', 'JENKINS_HOME']
    is_ci = any(os.environ.get(var) for var in ci_vars)

    if is_ci:
        print("[INFO] Running in CI environment")
        print(f"[INFO] Python path: {sys.executable}")
        print(f"[INFO] Current working directory: {os.getcwd()}")
        print(f"[INFO] Platform: {sys.platform}")

        # Check if we're in a container or VM
        try:
            with open('/proc/1/cgroup', 'r') as f:
                if 'docker' in f.read().lower():
                    print("[INFO] Running in Docker container")
        except:
            pass
    else:
        print("[INFO] Running in local environment")

def main() -> bool:
    """
    Main build function.

    Returns:
        True if build succeeded, False otherwise
    """
    print("[BUILD] Building Spotifydl virtual environment...")
    print("=" * 60)

    # Check CI environment
    check_ci_environment()

    # Check prerequisites
    python_check_result = check_python_version()
    if not python_check_result[0]:
        print("\n[INFO] Please install Python 3.10 or higher and try again.")
        return False

    python_cmd = python_check_result[1]
    print(f"[INFO] Using Python: {python_cmd}")

    # Clean up existing installation
    cleanup_existing_installation()

    # Define paths
    venv_dir = "spotdl_env"
    venv_bin_dir = os.path.join(venv_dir, "bin")

    # Check for python executable (Unix-like systems)
    venv_python = os.path.join(venv_bin_dir, "python3")
    if not Path(venv_python).exists():
        venv_python = os.path.join(venv_bin_dir, "python")

    venv_pip = os.path.join(venv_bin_dir, "pip3")
    if not Path(venv_pip).exists():
        venv_pip = os.path.join(venv_bin_dir, "pip")
    
    wrapper_path = os.path.join(venv_dir, "spotdl_wrapper.py")

    try:
        # Create virtual environment
        print("\nCreating virtual environment...")
        venv_created = False

        # Try different venv creation methods
        venv_commands = [
            f"{python_cmd} -m venv --copies spotdl_env",
            f"{python_cmd} -m virtualenv spotdl_env",
            f"virtualenv spotdl_env"  # System virtualenv as fallback
        ]

        for i, cmd in enumerate(venv_commands):
            success, output = run_command(
                cmd,
                description=f"Creating virtual environment (method {i+1}/{len(venv_commands)})"
            )
            if success:
                venv_created = True
                break
            else:
                print(f"[WARN] Method {i+1} failed: {output}")

        if not venv_created:
            print("[ERROR] Failed to create virtual environment with any method")
            print("[INFO] Make sure python3-venv or virtualenv is installed")
            print("  Ubuntu/Debian: sudo apt install python3-venv")
            print("  CentOS/RHEL: sudo yum install python3-virtualenv")
            print("  macOS: pip3 install virtualenv")
            return False

        # Verify venv was created
        if not Path(venv_python).exists():
            print(f"[ERROR] Virtual environment Python not found at: {venv_python}")
            return False

        # Upgrade pip
        print("\nUpgrading pip...")
        success, output = run_command(
            f"{venv_pip} install --upgrade pip",
            description="Upgrading pip"
        )
        if not success:
            print("[WARN] Failed to upgrade pip, continuing anyway...")
            # Try alternative pip upgrade method
            success, output = run_command(
                f"{venv_python} -m pip install --upgrade pip",
                description="Alternative pip upgrade"
            )
            if not success:
                print("[WARN] Alternative pip upgrade also failed, continuing...")

        # Install spotdl with retry logic
        print("\nInstalling Spotifydl...")
        max_retries = 3
        spotdl_installed = False

        for attempt in range(max_retries):
            print(f"  Attempt {attempt + 1}/{max_retries}...")
            success, output = run_command(
                f"{venv_pip} install spotdl",
                description=f"Installing Spotifydl (attempt {attempt + 1}/{max_retries})",
                cwd=None  # Don't specify cwd for pip installs
            )
            if success:
                spotdl_installed = True
                break
            else:
                if attempt < max_retries - 1:
                    print(f"  [WARN] Attempt {attempt + 1} failed, retrying in 5 seconds...")
                    import time
                    time.sleep(5)
                else:
                    print("[ERROR] Failed to install Spotifydl after all retries")
                    print("[INFO] Check your internet connection and try again")
                    print(f"[DEBUG] Last error: {output}")

        if not spotdl_installed:
            return False

        # Install yt-dlp for YouTube downloads
        print("\nInstalling yt-dlp...")
        success, output = run_command(
            f"{venv_pip} install yt-dlp",
            description="Installing yt-dlp for YouTube downloads"
        )
        if not success:
            print("[WARN] Failed to install yt-dlp via venv pip, trying alternative methods...")
            # Try alternative installation methods
            alt_success = False

            # Try with python -m pip
            if not alt_success:
                alt_success, alt_output = run_command(
                    f"{venv_python} -m pip install yt-dlp",
                    description="Installing yt-dlp via python -m pip"
                )

            # Try system installation as fallback
            if not alt_success:
                alt_success, alt_output = run_command(
                    "pip3 install yt-dlp --user",
                    description="Installing yt-dlp system-wide as fallback"
                )

            if not alt_success:
                print("[WARN] yt-dlp installation failed. YouTube downloads may not work.")
                print("[INFO] You can manually install yt-dlp with: pip install yt-dlp")
                print(f"[DEBUG] Last error: {alt_output}")

        # Create wrapper script
        print("\nCreating wrapper script...")
        if not create_wrapper_script(wrapper_path):
            return False

        # Create python symlink if it doesn't exist (for compatibility on Unix-like systems)
        python_link = os.path.join(venv_bin_dir, "python")
        python3_path = os.path.join(venv_bin_dir, "python3")

        if Path(python3_path).exists() and not Path(python_link).exists():
            try:
                os.symlink("python3", python_link)
                print(f"  [OK] Created python symlink for compatibility")
            except Exception as e:
                print(f"  [WARN] Could not create python symlink (non-critical): {e}")

        # Verify installation
        print("\nVerifying installation...")
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
        print("\n\n[STOPPED] Build interrupted by user")
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
