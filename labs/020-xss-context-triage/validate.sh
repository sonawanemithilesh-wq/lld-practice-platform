#!/usr/bin/env bash
# The collector keeps proof state in a named Docker volume. `docker compose
# down -v` removes that state on reset, making this check deterministic.

set -euo pipefail

status="$(curl -fsS http://host.docker.internal:9201/status)"

if [[ "$status" == *'"proved":true'* ]] && [[ "$status" == *'"token":"dojo-xss-context-triage"'* ]]; then
    echo "local XSS proof recorded"
    exit 0
fi

echo "no valid local XSS proof recorded yet" >&2
echo "open the encoded vulnerable search URL in a browser, then try again" >&2
exit 1
