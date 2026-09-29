"""Local-only XSS proof collector for the Dojo lab."""

from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse


TOKEN = "dojo-xss-context-triage"
STATE_PATH = Path("/data/proof.json")


def state() -> dict[str, object]:
    if not STATE_PATH.exists():
        return {"proved": False, "token": None}
    try:
        return json.loads(STATE_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {"proved": False, "token": None}


class Collector(BaseHTTPRequestHandler):
    def do_GET(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler API
        parsed = urlparse(self.path)
        if parsed.path == "/proof":
            token = parse_qs(parsed.query).get("token", [""])[0]
            if token == TOKEN:
                STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
                STATE_PATH.write_text(
                    json.dumps({"proved": True, "token": TOKEN}, separators=(",", ":")),
                    encoding="utf-8",
                )
            self.respond("proof endpoint reached\n", "text/plain; charset=utf-8")
            return
        if parsed.path == "/status":
            self.respond(json.dumps(state(), separators=(",", ":")), "application/json")
            return
        if parsed.path == "/health":
            self.respond("ok\n", "text/plain; charset=utf-8")
            return
        self.send_error(404, "not found")

    def respond(self, body: str, content_type: str) -> None:
        encoded = body.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def log_message(self, _format: str, *_args: object) -> None:
        return


if __name__ == "__main__":
    ThreadingHTTPServer(("0.0.0.0", 8081), Collector).serve_forever()
