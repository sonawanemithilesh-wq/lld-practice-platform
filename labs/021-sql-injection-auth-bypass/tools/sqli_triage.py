"""LLM helper for analyzing SQL Injection authentication-bypass behavior.

The learner inspects the login response, can adjust STARTER_PROMPT, and verifies
every recommendation against the local target. Provider is selected by DOJO_LLM:
openai | anthropic | ollama.
"""

from __future__ import annotations

import argparse
import os
import sys
import urllib.parse
from urllib.request import Request, urlopen


STARTER_PROMPT = """\
You are an expert security educator assisting a learner with a local, synthetic
SQL Injection lab in a controlled training environment. Review the login response,
error diagnostics, and observed behavior to explain:
1. The likely SQL query structure used by the backend.
2. How the submitted input manipulates or breaks the query syntax or logic.
3. A minimal, controlled test payload to demonstrate authentication bypass locally.
4. How the vulnerability can be safely remediated using parameterized queries.
"""


def submit_login(url: str, username: str, password: str = "") -> tuple[int, str]:
    data = urllib.parse.urlencode({"username": username, "password": password}).encode("utf-8")
    req = Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    try:
        with urlopen(req, timeout=10) as response:  # nosec B310 - local lab URL
            return response.status, response.read().decode("utf-8", errors="replace")
    except Exception as exc:
        return 500, f"Request failed: {exc}"


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
    parser.add_argument("--url", default="http://target.dojo.local:8080/login", help="Target login URL")
    parser.add_argument("--username", required=True, help="Username or probe string to test")
    parser.add_argument("--password", default="", help="Password to send")
    args = parser.parse_args()

    status_code, body = submit_login(args.url, args.username, args.password)

    provider = os.environ.get("DOJO_LLM", "openai").lower()
    if provider not in CALLERS:
        sys.exit(f"unknown DOJO_LLM={provider!r}; expected one of {sorted(CALLERS)}")

    # Extract relevant snippets from body for context
    context = (
        f"Target URL: {args.url}\n"
        f"Tested Username: {args.username!r}\n"
        f"Tested Password: {args.password!r}\n"
        f"HTTP Status: {status_code}\n\n"
        f"=== Response Snippet ===\n{body[:3000]}\n\n"
        "Provide a structured triage table:\n"
        "1. Query Anatomy: Inferred query construction\n"
        "2. Injection Evidence: Observed syntax errors or behavioral anomalies\n"
        "3. Local Proof Hypothesis: Safe auth-bypass payload candidate and explanation\n"
        "4. Safe Remediation: Example prepared statement parameterized query"
    )
    print(CALLERS[provider](STARTER_PROMPT, context))


if __name__ == "__main__":
    main()
