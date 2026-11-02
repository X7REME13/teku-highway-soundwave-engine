#!/usr/bin/env python3
"""
Teku Highway Soundwave Engine // Automated Headless Capture Tool
Automates headless Chromium rendering and screenshot verification without manual prompts.
Follows RULE[user_global] for clean, frictionless Python automation.
"""

import sys
import os
import shutil
import tempfile
import subprocess
import argparse
from pathlib import Path

def find_chromium():
    for name in ['chromium', 'chromium-browser', 'google-chrome', 'chrome']:
        path = shutil.which(name)
        if path:
            return path
    # Check default debian paths
    for default_path in ['/usr/bin/chromium', '/usr/bin/chromium-browser']:
        if os.path.exists(default_path) and os.access(default_path, os.X_OK):
            return default_path
    raise FileNotFoundError("Chromium/Chrome binary not found on system PATH.")

def capture_screenshot(url: str, output_path: str, width: int = 1280, height: int = 800, timeout_sec: int = 35) -> bool:
    """
    Captures a crisp headless screenshot using an isolated user profile and non-blocking flags.
    """
    chromium_bin = find_chromium()
    out = Path(output_path).resolve()
    out.parent.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory() as tmp_user_data:
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
            f'--user-data-dir={tmp_user_data}',
            f'--window-size={width},{height}',
            f'--screenshot={str(out)}',
            url
        ]

        try:
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=timeout_sec, text=True)
            if out.exists() and out.stat().st_size > 0:
                print(f"[OK] Captured screenshot: {out} ({out.stat().st_size} bytes)")
                return True
            else:
                print(f"[WARN] Chromium exited (code {res.returncode}) but output file was not created.", file=sys.stderr)
                if res.stderr:
                    print(f"[STDERR]: {res.stderr[:400]}", file=sys.stderr)
                return False
        except subprocess.TimeoutExpired:
            print(f"[ERROR] Chromium capture timed out after {timeout_sec}s.", file=sys.stderr)
            return False
        except Exception as e:
            print(f"[ERROR] Screenshot failed: {e}", file=sys.stderr)
            return False

def main():
    parser = argparse.ArgumentParser(description="Automated Headless Capture Tool")
    parser.add_argument("url", nargs="?", default="http://127.0.0.1:8085/?hud=z31", help="URL to capture")
    parser.add_argument("--output", "-o", default="/tmp/teku_preview.png", help="Output PNG file path")
    parser.add_argument("--hud", choices=["c4", "z31", "teku"], help="Convenience shortcut for local HUD skins")
    parser.add_argument("--width", type=int, default=1280, help="Viewport width")
    parser.add_argument("--height", type=int, default=800, help="Viewport height")
    parser.add_argument("--port", type=int, default=8085, help="Local server port if using --hud")

    args = parser.parse_args()

    url = args.url
    if args.hud:
        url = f"http://127.0.0.1:{args.port}/?hud={args.hud}"

    success = capture_screenshot(url, args.output, args.width, args.height)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
