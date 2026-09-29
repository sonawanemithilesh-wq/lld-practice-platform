"""Synthetic, intentionally vulnerable local authentication portal with modern SaaS UI."""

from __future__ import annotations

import html
import json
import os
import sqlite3
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


DB_PATH = Path("/data/dojo_access.db")
COLLECTOR_INTERNAL_URL = "http://collector.dojo.local:8081/proof?token=dojo-sqli-auth-bypass"
PROOF_TOKEN = "dojo-sqli-auth-bypass"


def init_database() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    try:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                role TEXT NOT NULL,
                full_name TEXT NOT NULL,
                email TEXT NOT NULL
            );
        """)
        # Seed users
        cursor.execute("SELECT COUNT(*) FROM users")
        if cursor.fetchone()[0] == 0:
            cursor.executemany("""
                INSERT INTO users (username, password, role, full_name, email)
                VALUES (?, ?, ?, ?, ?)
            """, [
                (
                    "admin",
                    "x7K#9mP$2vL@dojo_corp_admin_secret_9941",
                    "admin",
                    "Chief Security Officer (Admin)",
                    "admin@access.dojo.local",
                ),
                (
                    "analyst",
                    "DojoAnalyst2026!",
                    "analyst",
                    "Alex Chen (SOC Analyst)",
                    "analyst@access.dojo.local",
                ),
                (
                    "operator",
                    "OperatorAccess2026!",
                    "operator",
                    "Jordan Lee (Infrastructure)",
                    "operator@access.dojo.local",
                ),
            ])
            conn.commit()
    finally:
        conn.close()


def notify_collector() -> None:
    try:
        req = urllib.request.Request(
            COLLECTOR_INTERNAL_URL,
            headers={"User-Agent": "Dojo-Target/1.0"},
        )
        with urllib.request.urlopen(req, timeout=2):  # nosec B310
            pass
    except Exception:
        pass


COMMON_STYLES = """
:root {
  --bg-main: #0a0e17;
  --bg-card: rgba(15, 23, 42, 0.75);
  --bg-card-hover: rgba(30, 41, 59, 0.85);
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-focus: #38bdf8;
  --primary: #38bdf8;
  --primary-glow: rgba(56, 189, 248, 0.25);
  --accent-emerald: #10b981;
  --accent-emerald-glow: rgba(16, 185, 129, 0.25);
  --accent-red: #ef4444;
  --accent-amber: #f59e0b;
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --text-faint: #64748b;
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-sans);
  background-color: var(--bg-main);
  background-image:
    radial-gradient(circle at 50% 0%, rgba(56, 189, 248, 0.12) 0%, transparent 55%),
    radial-gradient(circle at 85% 30%, rgba(16, 185, 129, 0.06) 0%, transparent 40%);
  color: var(--text-main);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

a {
  color: var(--primary);
  text-decoration: none;
  transition: color 0.15s ease;
}

a:hover {
  color: #7dd3fc;
}

.navbar {
  border-bottom: 1px solid var(--border-subtle);
  background: rgba(10, 14, 23, 0.85);
  backdrop-filter: blur(12px);
  position: sticky;
  top: 0;
  z-index: 50;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.85rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 700;
  font-size: 1.15rem;
  color: #fff;
  letter-spacing: -0.01em;
}

.brand-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #0284c7, #0369a1);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 16px rgba(2, 132, 199, 0.4);
}

.brand-badge {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  background: rgba(56, 189, 248, 0.15);
  color: var(--primary);
  border: 1px solid rgba(56, 189, 248, 0.3);
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  font-weight: 600;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.nav-link {
  color: var(--text-muted);
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  transition: all 0.15s ease;
}

.nav-link:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
}

.nav-link.active {
  color: var(--primary);
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.2);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2.5rem 1.5rem;
}

.auth-card {
  width: 100%;
  max-width: 480px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  padding: 2.5rem;
  backdrop-filter: blur(16px);
  box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5);
  position: relative;
  overflow: hidden;
}

.auth-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--primary), transparent);
}

.auth-card.safe::before {
  background: linear-gradient(90deg, transparent, var(--accent-emerald), transparent);
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-icon {
  width: 54px;
  height: 54px;
  border-radius: 14px;
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.25rem;
  color: var(--primary);
}

.auth-card.safe .auth-icon {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.25);
  color: var(--accent-emerald);
}

.auth-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.02em;
  margin-bottom: 0.5rem;
}

.auth-subtitle {
  color: var(--text-muted);
  font-size: 0.875rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 0.45rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.input-wrapper {
  position: relative;
}

.form-input {
  width: 100%;
  background: rgba(10, 14, 23, 0.6);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  color: #fff;
  font-size: 0.9375rem;
  font-family: inherit;
  transition: all 0.2s ease;
  outline: none;
}

.form-input:focus {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px var(--primary-glow);
  background: rgba(10, 14, 23, 0.9);
}

.input-icon {
  position: absolute;
  left: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-faint);
  pointer-events: none;
}

.btn-primary {
  width: 100%;
  background: linear-gradient(135deg, #0284c7, #0369a1);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.85rem;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);
  margin-top: 0.5rem;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #0369a1, #075985);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(2, 132, 199, 0.4);
}

.btn-safe {
  background: linear-gradient(135deg, #059669, #047857);
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
}

.btn-safe:hover {
  background: linear-gradient(135deg, #047857, #065f46);
  box-shadow: 0 6px 16px rgba(5, 150, 105, 0.4);
}

.alert {
  padding: 0.85rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
}

.alert-danger {
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: #fca5a5;
}

.alert-sql-error {
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: #fde68a;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  line-height: 1.4;
  word-break: break-all;
}

.credentials-box {
  margin-top: 2rem;
  padding: 1rem 1.25rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-subtle);
  font-size: 0.8125rem;
}

.credentials-box-title {
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.credential-item {
  display: flex;
  justify-content: space-between;
  padding: 0.3rem 0;
  color: var(--text-faint);
  font-family: var(--font-mono);
  border-bottom: 1px dashed rgba(255, 255, 255, 0.05);
}

.credential-item:last-child {
  border-bottom: none;
}

.credential-item strong {
  color: var(--text-muted);
}

.footer {
  border-top: 1px solid var(--border-subtle);
  padding: 1.5rem;
  text-align: center;
  font-size: 0.8125rem;
  color: var(--text-faint);
  background: rgba(10, 14, 23, 0.95);
}

.dashboard-card {
  width: 100%;
  max-width: 720px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  padding: 2.5rem;
  backdrop-filter: blur(16px);
  box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5);
}

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 1.5rem;
  margin-bottom: 2rem;
}

.user-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-admin {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

.badge-analyst {
  background: rgba(56, 189, 248, 0.15);
  border: 1px solid rgba(56, 189, 248, 0.3);
  color: #38bdf8;
}

.badge-operator {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #34d399;
}

.proof-banner {
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.proof-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: rgba(16, 185, 129, 0.2);
  color: var(--accent-emerald);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.query-inspect-box {
  background: #05080f;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 1rem 1.25rem;
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: #38bdf8;
  margin-top: 1.5rem;
  overflow-x: auto;
}
"""

NAVBAR_HTML = """
<header class="navbar">
  <div class="nav-container">
    <div class="brand">
      <div class="brand-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          <path d="M9 12l2 2 4-4"></path>
        </svg>
      </div>
      <span>Dojo Access</span>
      <span class="brand-badge">IAM Gateway</span>
    </div>
    <div class="nav-links">
      <a href="/login" class="nav-link" id="nav-vulnerable">Vulnerable Portal</a>
      <a href="/safe-login" class="nav-link" id="nav-safe">Parameterized Safe Portal</a>
    </div>
  </div>
</header>
"""

FOOTER_HTML = """
<footer class="footer">
  <p>&copy; 2026 Dojo Access Management Services &bull; Local Synthetic Security Training Portal &bull; Intentionally Vulnerable</p>
</footer>
"""


def render_login_page(
    error_msg: str | None = None,
    sql_error: str | None = None,
    executed_query: str | None = None,
    safe_mode: bool = False,
    username_val: str = "",
) -> str:
    active_nav_vuln = "active" if not safe_mode else ""
    active_nav_safe = "active" if safe_mode else ""
    form_action = "/safe-login" if safe_mode else "/login"
    card_class = "auth-card safe" if safe_mode else "auth-card"
    btn_class = "btn-primary btn-safe" if safe_mode else "btn-primary"
    portal_title = "Parameterized Safe Gateway" if safe_mode else "Enterprise Single Sign-On"
    portal_subtitle = (
        "Protected by Prepared Statements &amp; Parameterized Query Execution"
        if safe_mode
        else "Authenticate to access internal systems and operational dashboards"
    )

    alert_html = ""
    if error_msg:
        alert_html += f"""
        <div class="alert alert-danger">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <div>{html.escape(error_msg)}</div>
        </div>
        """

    if sql_error:
        alert_html += f"""
        <div class="alert alert-sql-error">
          <div>
            <strong>[SQLite Diagnostic Output]</strong><br>
            Error: {html.escape(sql_error)}<br>
            {f'Query: <code>{html.escape(executed_query)}</code>' if executed_query else ''}
          </div>
        </div>
        """

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dojo Access - {portal_title}</title>
  <style>{COMMON_STYLES}</style>
</head>
<body>
  {NAVBAR_HTML}
  <script>
    document.getElementById('{ 'nav-safe' if safe_mode else 'nav-vulnerable' }').classList.add('active');
  </script>
  <main class="main-content">
    <div class="{card_class}">
      <div class="auth-header">
        <div class="auth-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <h1 class="auth-title">{portal_title}</h1>
        <p class="auth-subtitle">{portal_subtitle}</p>
      </div>

      {alert_html}

      <form action="{form_action}" method="POST">
        <div class="form-group">
          <label class="form-label" for="username">Username or Corporate ID</label>
          <div class="input-wrapper">
            <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <input class="form-input" type="text" id="username" name="username" value="{html.escape(username_val, quote=True)}" placeholder="e.g. analyst, operator, admin" required autofocus autocomplete="off">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="password">Password</label>
          <div class="input-wrapper">
            <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <input class="form-input" type="password" id="password" name="password" placeholder="Enter your credentials" autocomplete="off">
          </div>
        </div>

        <button type="submit" class="{btn_class}">
          <span>Authenticate &rarr;</span>
        </button>
      </form>

      <div class="credentials-box">
        <div class="credentials-box-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <span>Authorized Test Accounts</span>
        </div>
        <div class="credential-item">
          <span>analyst</span>
          <span>DojoAnalyst2026!</span>
        </div>
        <div class="credential-item">
          <span>operator</span>
          <span>OperatorAccess2026!</span>
        </div>
        <div class="credential-item" style="color: #fca5a5;">
          <span>admin</span>
          <em>[Complex unknown secret]</em>
        </div>
      </div>
    </div>
  </main>
  {FOOTER_HTML}
</body>
</html>"""


def render_dashboard(
    user_row: tuple[int, str, str, str, str],
    executed_query: str,
    was_sqli_bypass: bool,
    safe_mode: bool = False,
) -> str:
    user_id, username, role, full_name, email = user_row
    badge_class = f"badge-{role}" if role in ("admin", "analyst", "operator") else "badge-analyst"

    proof_section = ""
    if username == "admin" or role == "admin":
        proof_section = f"""
        <div class="proof-banner">
          <div class="proof-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div>
            <h3 style="color: #fff; font-size: 1.05rem; font-weight: 700; margin-bottom: 0.2rem;">
              Authentication Bypass Successful!
            </h3>
            <p style="color: var(--text-muted); font-size: 0.875rem;">
              You have successfully bypassed authentication and accessed the system as <strong>{html.escape(username)}</strong>.
              The local proof collector has been notified.
            </p>
          </div>
        </div>
        <!-- Client-side proof ping for host browser -->
        <img src="http://localhost:9211/proof?token={PROOF_TOKEN}" style="display:none" alt="" />
        <script>
          fetch('http://localhost:9211/proof?token={PROOF_TOKEN}').catch(() => {{}});
        </script>
        """

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dojo Access - Command Console</title>
  <style>{COMMON_STYLES}</style>
</head>
<body>
  {NAVBAR_HTML}
  <main class="main-content">
    <div class="dashboard-card">
      {proof_section}

      <div class="dashboard-header">
        <div>
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
            <h1 style="font-size: 1.5rem; font-weight: 700; color: #fff;">{html.escape(full_name)}</h1>
            <span class="user-badge {badge_class}">{html.escape(role)}</span>
          </div>
          <p style="color: var(--text-muted); font-size: 0.875rem;">
            Authenticated Identity: <code>{html.escape(username)}</code> &bull; Email: <code>{html.escape(email)}</code>
          </p>
        </div>
        <div>
          <a href="/login" class="nav-link" style="border: 1px solid var(--border-subtle);">&larr; Sign Out</a>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 1.25rem;">
          <div style="font-size: 0.75rem; color: var(--text-faint); text-transform: uppercase; font-weight: 600;">Account ID</div>
          <div style="font-size: 1.25rem; font-weight: 700; color: #fff; margin-top: 0.25rem;">#{user_id}</div>
        </div>
        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 1.25rem;">
          <div style="font-size: 0.75rem; color: var(--text-faint); text-transform: uppercase; font-weight: 600;">Access Tier</div>
          <div style="font-size: 1.25rem; font-weight: 700; color: var(--primary); margin-top: 0.25rem;">Tier-{1 if role == 'admin' else 2} Privileges</div>
        </div>
        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 1.25rem;">
          <div style="font-size: 0.75rem; color: var(--text-faint); text-transform: uppercase; font-weight: 600;">Session Status</div>
          <div style="font-size: 1.25rem; font-weight: 700; color: var(--accent-emerald); margin-top: 0.25rem;">Active &bull; Verified</div>
        </div>
      </div>

      <div style="margin-top: 1.5rem;">
        <h3 style="font-size: 0.95rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.5rem;">
          Executed SQL Statement:
        </h3>
        <div class="query-inspect-box">
          {html.escape(executed_query)}
        </div>
        <p style="font-size: 0.8rem; color: var(--text-faint); margin-top: 0.5rem;">
          {'This dynamic query concatenated raw user inputs directly into SQL syntax.' if not safe_mode else 'This query used parameterized placeholders (?), treating input strictly as literal values.'}
        </p>
      </div>
    </div>
  </main>
  {FOOTER_HTML}
</body>
</html>"""


class TargetServer(BaseHTTPRequestHandler):
    def do_GET(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler API
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/health":
            self.respond("ok\n", "text/plain; charset=utf-8")
            return
        if parsed.path in ("/", "/login"):
            self.respond(render_login_page())
            return
        if parsed.path == "/safe-login":
            self.respond(render_login_page(safe_mode=True))
            return
        self.send_error(404, "not found")

    def do_POST(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler API
        parsed = urllib.parse.urlparse(self.path)
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode("utf-8", errors="replace")
        form_data = urllib.parse.parse_qs(body, keep_blank_values=True)

        username = form_data.get("username", [""])[0]
        password = form_data.get("password", [""])[0]

        if parsed.path == "/login":
            self.handle_vulnerable_login(username, password)
            return
        if parsed.path == "/safe-login":
            self.handle_safe_login(username, password)
            return

        self.send_error(404, "not found")

    def handle_vulnerable_login(self, username: str, password: str) -> None:
        # Deliberately vulnerable: user input is concatenated directly into SQL statement
        query = (
            f"SELECT id, username, role, full_name, email FROM users "
            f"WHERE username = '{username}' AND password = '{password}'"
        )

        conn = sqlite3.connect(DB_PATH)
        try:
            cursor = conn.cursor()
            cursor.execute(query)
            row = cursor.fetchone()
            if row:
                # Authentication succeeded
                user_name = row[1]
                role = row[2]
                if user_name == "admin" or role == "admin":
                    notify_collector()
                self.respond(
                    render_dashboard(
                        user_row=row,
                        executed_query=query,
                        was_sqli_bypass=(user_name == "admin" and password != "x7K#9mP$2vL@dojo_corp_admin_secret_9941"),
                        safe_mode=False,
                    )
                )
            else:
                self.respond(
                    render_login_page(
                        error_msg="Invalid username or password.",
                        executed_query=query,
                        username_val=username,
                    )
                )
        except sqlite3.OperationalError as exc:
            # Reveal SQLite error to help student understand dynamic concatenation
            self.respond(
                render_login_page(
                    error_msg="Database error encountered during authentication.",
                    sql_error=str(exc),
                    executed_query=query,
                    username_val=username,
                )
            )
        finally:
            conn.close()

    def handle_safe_login(self, username: str, password: str) -> None:
        # Safe implementation using parameterized prepared statements
        query = (
            "SELECT id, username, role, full_name, email FROM users "
            "WHERE username = ? AND password = ?"
        )

        conn = sqlite3.connect(DB_PATH)
        try:
            cursor = conn.cursor()
            cursor.execute(query, (username, password))
            row = cursor.fetchone()
            if row:
                self.respond(
                    render_dashboard(
                        user_row=row,
                        executed_query=f"{query} -- parameters: ({username!r}, '********')",
                        was_sqli_bypass=False,
                        safe_mode=True,
                    )
                )
            else:
                self.respond(
                    render_login_page(
                        error_msg="Invalid credentials. Input was safely evaluated as literal data.",
                        safe_mode=True,
                        username_val=username,
                    )
                )
        except sqlite3.OperationalError as exc:
            self.respond(
                render_login_page(
                    error_msg="Database query failure.",
                    sql_error=str(exc),
                    safe_mode=True,
                    username_val=username,
                )
            )
        finally:
            conn.close()

    def respond(self, body: str, content_type: str = "text/html; charset=utf-8") -> None:
        encoded = body.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def log_message(self, _format: str, *_args: object) -> None:
        return


if __name__ == "__main__":
    init_database()
    ThreadingHTTPServer(("0.0.0.0", 8080), TargetServer).serve_forever()
