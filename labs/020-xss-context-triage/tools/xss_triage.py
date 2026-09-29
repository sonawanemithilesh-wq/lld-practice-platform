"""LLM helper for classifying an XSS reflection context.

The learner edits STARTER_PROMPT and verifies every recommendation in the
local target. Provider is selected by DOJO_LLM: openai | anthropic | ollama.
"""

from __future__ import annotations

import argparse
import os
import sys
from urllib.request import urlopen


STARTER_PROMPT = """\
You are helping test a local training application for reflected XSS. Review the
HTTP response and suggest a payload that proves XSS.
"""


def fetch(url: str) -> str:
    with urlopen(url, timeout=10) as response:  # nosec B310 - local lab URL supplied by learner
        return response.read().decode("utf-8", errors="replace")


def call_openai(prompt: str, context: str) -> str:
    from openai import OpenAI

    response = OpenAI().chat.completions.create(
        model=os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": context},
        ],
        temperature=0.1,
    )
    return response.choices[0].message.content or ""


def call_anthropic(prompt: str, context: str) -> str:
    import anthropic

    response = anthropic.Anthropic().messages.create(
        model=os.environ.get("ANTHROPIC_MODEL", "claude-opus-4-7"),
        max_tokens=1024,
        system=prompt,
        messages=[{"role": "user", "content": context}],
    )
    return "".join(block.text for block in response.content if block.type == "text")


def call_ollama(prompt: str, context: str) -> str:
    import ollama

    response = ollama.Client(host=os.environ.get("OLLAMA_HOST")).chat(
        model=os.environ.get("OLLAMA_MODEL", "llama3.1"),
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": context},
        ],
    )
    return response["message"]["content"]


CALLERS = {"openai": call_openai, "anthropic": call_anthropic, "ollama": call_ollama}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", required=True)
    parser.add_argument("--marker", required=True)
    args = parser.parse_args()

    html = fetch(args.url)
    if args.marker not in html:
        sys.exit(f"marker {args.marker!r} was not found in the fetched response")

    provider = os.environ.get("DOJO_LLM", "openai").lower()
    if provider not in CALLERS:
        sys.exit(f"unknown DOJO_LLM={provider!r}; expected one of {sorted(CALLERS)}")

    context = (
        f"Marker: {args.marker}\n"
        "Return a table with: context, exact reflection evidence, a minimal local-only "
        "proof idea, and assumptions to verify. Do not recommend sending data.\n\n"
        f"=== HTTP response ===\n{html}"
    )
    print(CALLERS[provider](STARTER_PROMPT, context))


if __name__ == "__main__":
    main()
