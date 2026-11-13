#!/usr/bin/env python3
"""Offline validation for production Discord announcement templates."""
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("feather_discord_sender", ROOT / "tools" / "send-discord-announcement.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

for name, path in module.ANNOUNCEMENTS.items():
    data = json.loads(path.read_text(encoding="utf-8"))
    assert data["allowed_mentions"]["parse"] == []
    assert data["embeds"], name
    for embed in data["embeds"]:
        assert len(embed.get("title", "")) <= 256
        assert len(embed.get("description", "")) <= 4096
        assert len(embed.get("fields", [])) <= 25
        for field in embed.get("fields", []):
            assert len(field["name"]) <= 256 and len(field["value"]) <= 1024
    request = module.prepare_request("https://discord.com/api/webhooks/123456/secret", name)
    assert "wait=true" in request.full_url
    if data.get("components"):
        assert "with_components=true" in request.full_url
        assert all(row["type"] == 1 for row in data["components"])
        for row in data["components"]:
            assert 1 <= len(row["components"]) <= 5
            for button in row["components"]:
                assert button["type"] == 2 and button["style"] == 5 and button["url"].startswith("https://")
    assert "play.mcfeather.com" in json.dumps(data), name
print("PASS: Discord templates, webhooks, and link buttons are valid.")
