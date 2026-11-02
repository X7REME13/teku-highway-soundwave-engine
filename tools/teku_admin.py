#!/usr/bin/env python3
"""
Teku Highway Soundwave Engine // System Automation & Diagnostics Tool
Provides zero-friction CLI methods for automated screenshots, verification,
health diagnostics, and service checks in compliance with RULE[user_global].
"""

import sys
import os
import shutil
import tempfile
import subprocess
import argparse
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parent.parent

def find_chromium():
    for name in ['chromium', 'chromium-browser', 'google-chrome', 'chrome']:
        path = shutil.which(name)
        if path:
            return path
    for default_path in ['/usr/bin/chromium', '/usr/bin/chromium-browser']:
        if os.path.exists(default_path) and os.access(default_path, os.X_OK):
            return default_path
    raise FileNotFoundError("Chromium binary not found on system PATH.")

def capture(hud: str = "z31", output: str = None, width: int = 1280, height: int = 800, port: int = 8085, timeout: int = 40) -> bool:
    """
    Captures headless screenshots of the specified HUD skin (c4, z31, teku).
    Uses non-blocking flags, isolated user profile, and automatic output path.
    """
    if not output:
        output = f"/tmp/teku_{hud}.png"
    out_path = Path(output).resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)

    url = f"http://127.0.0.1:{port}/?hud={hud}"
    chromium_bin = find_chromium()

    print(f"[TEKU] Capturing {hud.upper()} HUD from {url} -> {out_path}...")
    with tempfile.TemporaryDirectory() as tmp_dir:
        cmd = [
            chromium_bin,
            '--headless',
            '--disable-gpu',
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-background-networking',
            '--disable-sync',
            '--no-first-run',
            '--no-default-browser-check',
            '--hide-scrollbars',
            f'--user-data-dir={tmp_dir}',
            f'--window-size={width},{height}',
            f'--screenshot={str(out_path)}',
            url
        ]

        try:
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=timeout, text=True)
            if out_path.exists() and out_path.stat().st_size > 0:
                print(f"[TEKU] ✓ Capture successful: {out_path} ({out_path.stat().st_size} bytes)")
                return True
            else:
                print(f"[TEKU] ✗ Capture failed. Return code: {res.returncode}", file=sys.stderr)
                return False
        except subprocess.TimeoutExpired:
            print(f"[TEKU] ✗ Capture timed out after {timeout}s", file=sys.stderr)
            return False

def verify() -> bool:
    """
    Executes the comprehensive Node.js engine and DOM verification suite.
    """
    print("[TEKU] Running automated verification test suites...")
    cmd = ['npm', 'test']
    res = subprocess.run(cmd, cwd=WORKSPACE)
    return res.returncode == 0

def status() -> dict:
    """
    Checks local server, font integrity, and git state.
    """
    print("=== TEKU SYSTEM DIAGNOSTICS ===")
    fonts = list((WORKSPACE / "fonts").glob("*.woff2")) if (WORKSPACE / "fonts").exists() else []
    print(f"Fonts loaded: {[f.name for f in fonts]}")
    
    server_check = subprocess.run(['pgrep', '-f', 'http.server.*8085'], stdout=subprocess.PIPE, text=True)
    server_running = bool(server_check.stdout.strip())
    print(f"Local Server (Port 8085): {'RUNNING' if server_running else 'STOPPED'}")

    return {
        "fonts": [f.name for f in fonts],
        "server_running": server_running
    }

def main():
    parser = argparse.ArgumentParser(description="Teku Admin & Diagnostics Automation Tool")
    subparsers = parser.add_subparsers(dest="command")

    # Screenshot subcommand
    shot_parser = subparsers.add_parser("shot", help="Capture HUD screenshot")
    shot_parser.add_argument("--hud", choices=["c4", "z31", "teku"], default="z31")
    shot_parser.add_argument("--output", "-o", default=None)
    shot_parser.add_argument("--width", type=int, default=1280)
    shot_parser.add_argument("--height", type=int, default=800)

    # Test subcommand
    subparsers.add_parser("test", help="Run full test suite")

    # Status subcommand
    subparsers.add_parser("status", help="Check system status")

    args = parser.parse_args()

    if args.command == "shot":
        ok = capture(hud=args.hud, output=args.output, width=args.width, height=args.height)
        sys.exit(0 if ok else 1)
    elif args.command == "test":
        ok = verify()
        sys.exit(0 if ok else 1)
    elif args.command == "status":
        status()
        sys.exit(0)
    else:
        # Default: status
        status()

if __name__ == "__main__":
    main()
