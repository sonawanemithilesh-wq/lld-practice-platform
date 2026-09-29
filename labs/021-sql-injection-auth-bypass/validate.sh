#!/usr/bin/env bash
# The collector keeps proof state in a named Docker volume. `docker compose
# down -v` removes that state on reset, making this check deterministic.

set -euo pipefail

status="$(curl -fsS http://host.docker.internal:9211/status)"

if [[ "$status" == *'"proved":true'* ]] && [[ "$status" == *'"token":"dojo-sqli-auth-bypass"'* ]]; then
    echo "local SQL injection authentication bypass proof recorded"
    exit 0
fi

echo "no valid local SQL injection proof recorded yet" >&2
echo "demonstrate administrative authentication bypass in the target portal, then try again" >&2
exit 1
