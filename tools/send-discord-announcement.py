#!/usr/bin/env python3
"""Post a selected FeatherMC announcement through a secret Discord webhook.

No webhook URL is stored in source control. Choose the message from a fixed
allowlist: never read an arbitrary file path from workflow input.
"""
import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

ROOT = Path(__file__).resolve().parents[1]
ANNOUNCEMENTS = {
    "how-to-play": ROOT / "discord" / "how-to-play.json",
    "opening": ROOT / "discord" / "launch-announcement.json",
}


def prepare_request(webhook, announcement):
    target = urlsplit(webhook)
    if (
        target.scheme != "https"
        or target.hostname not in {"discord.com", "discordapp.com"}
        or not target.path.startswith("/api/webhooks/")
        or target.username
        or target.password
        or target.fragment
    ):
        raise ValueError("Invalid Discord webhook URL. Expected HTTPS /api/webhooks/.")

    payload = json.loads(ANNOUNCEMENTS[announcement].read_text(encoding="utf-8"))
    if not payload.get("embeds"):
        raise ValueError("Announcement has no embed.")
    if payload.get("allowed_mentions", {}).get("parse", []) != []:
        raise ValueError("Mass mentions are disabled for announcements.")

    parameters = dict(parse_qsl(target.query, keep_blank_values=True))
    # wait=true confirms that the message was actually persisted.
    parameters["wait"] = "true"
    # Required for action-row link buttons on ordinary Discord webhooks.
    if payload.get("components"):
        parameters["with_components"] = "true"
    url = urlunsplit((target.scheme, target.netloc, target.path, urlencode(parameters), ""))
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    return urllib.request.Request(
        url, data=data,
        headers={"Content-Type": "application/json", "User-Agent": "FeatherMC-Announcement/2.0"},
        method="POST",
    )


def main():
    parser = argparse.ArgumentParser(description="Send a FeatherMC Discord announcement.")
    parser.add_argument("--announcement", choices=sorted(ANNOUNCEMENTS), default="how-to-play")
    args = parser.parse_args()
    webhook = os.environ.get("DISCORD_WEBHOOK_URL", "").strip()
    if not webhook:
        print("Missing DISCORD_WEBHOOK_URL GitHub Actions repository secret.", file=sys.stderr)
        return 2
    try:
        request = prepare_request(webhook, args.announcement)
    except (ValueError, OSError, json.JSONDecodeError) as error:
        print(f"Cannot prepare announcement: {error}", file=sys.stderr)
        return 2
    try:
        with urllib.request.urlopen(request, timeout=25) as response:
            if response.status != 200:
                print("Discord did not confirm the posted message.", file=sys.stderr)
                return 1
            result = json.load(response)
            if not result.get("id"):
                print("Discord response did not contain a message ID.", file=sys.stderr)
                return 1
    except urllib.error.HTTPError as error:
        print(f"Discord rejected the request (HTTP {error.code}).", file=sys.stderr)
        return 1
    except Exception as error:
        print(f"Webhook request failed ({type(error).__name__}).", file=sys.stderr)
        return 1
    print(f"Discord announcement sent: {args.announcement}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
