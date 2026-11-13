#!/usr/bin/env python3
"""Send one FeatherMC opening announcement using a secret environment variable."""
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
MESSAGE = ROOT / "discord" / "launch-announcement.json"

def main():
    webhook = os.environ.get("DISCORD_WEBHOOK_URL", "").strip()
    if not webhook:
        print("Missing DISCORD_WEBHOOK_URL. Add it as a GitHub Actions repository secret.", file=sys.stderr)
        return 2
    target = urlsplit(webhook)
    if target.scheme != "https" or target.hostname not in {"discord.com", "discordapp.com"} or not target.path.startswith("/api/webhooks/"):
        print("Invalid Discord webhook URL. Use an HTTPS /api/webhooks/ URL.", file=sys.stderr)
        return 2
    payload = json.loads(MESSAGE.read_text(encoding="utf-8"))
    if not payload.get("embeds"):
        print("Announcement requires an embed.", file=sys.stderr)
        return 2
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(webhook, data=data, headers={"Content-Type": "application/json", "User-Agent": "FeatherMC-Announcement/1.0"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            if response.status not in (200, 204):
                print("Discord returned an unexpected HTTP status.", file=sys.stderr)
                return 1
    except urllib.error.HTTPError as error:
        print(f"Discord rejected the request (HTTP {error.code}).", file=sys.stderr)
        return 1
    except Exception as error:
        print(f"Webhook request failed ({type(error).__name__}).", file=sys.stderr)
        return 1
    print("FeatherMC Discord announcement sent successfully.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
