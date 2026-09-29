"""Synthetic, intentionally vulnerable local support-search application with a modern SaaS UI."""

from __future__ import annotations

from html import escape
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

COMMON_STYLES = """
:root {
  --bg-main: #0a0e17;
  --bg-card: rgba(15, 23, 42, 0.7);
  --bg-card-hover: rgba(30, 41, 59, 0.85);
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-focus: #38bdf8;
  --primary: #38bdf8;
  --primary-glow: rgba(56, 189, 248, 0.25);
  --accent-emerald: #10b981;
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --text-faint: #64748b;
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
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
  background: rgba(10, 14, 23, 0.8);
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
  gap: 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.nav-link {
  color: var(--text-muted);
}

.nav-link:hover {
  color: var(--text-main);
}

.status-pill {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.25);
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  color: #34d399;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.9); }
}

.main-content {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 2.5rem 1.5rem 4rem;
}

.hero {
  text-align: center;
  max-width: 720px;
  margin: 1.5rem auto 3.5rem;
}

.hero-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--primary);
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.2);
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
  margin-bottom: 1.25rem;
}

.hero h1 {
  font-size: 2.65rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.2;
  margin-bottom: 0.85rem;
  background: linear-gradient(180deg, #ffffff 40%, #cbd5e1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero p {
  font-size: 1.05rem;
  color: var(--text-muted);
  margin-bottom: 2rem;
}

.search-container {
  position: relative;
  max-width: 640px;
  margin: 0 auto;
}

.search-box {
  display: flex;
  align-items: center;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 0.4rem;
  box-shadow: 0 8px 32px -4px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
  transition: all 0.2s ease;
}

.search-box:focus-within {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px var(--primary-glow), 0 12px 36px -4px rgba(0, 0, 0, 0.6);
  background: rgba(15, 23, 42, 0.95);
}

.search-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 0.85rem;
  padding-right: 0.5rem;
  color: var(--text-faint);
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 1rem;
  padding: 0.65rem 0.5rem;
  outline: none;
  font-family: inherit;
}

.search-input::placeholder {
  color: var(--text-faint);
}

.search-btn {
  background: linear-gradient(135deg, #0284c7, #0369a1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.15);
  font-weight: 600;
  font-size: 0.9rem;
  padding: 0.65rem 1.35rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.search-btn:hover {
  background: linear-gradient(135deg, #0369a1, #0284c7);
  box-shadow: 0 0 16px rgba(2, 132, 199, 0.5);
  transform: translateY(-1px);
}

.search-tags {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
  font-size: 0.8rem;
  color: var(--text-faint);
}

.search-tag {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.search-tag:hover {
  background: rgba(56, 189, 248, 0.1);
  color: var(--primary);
  border-color: rgba(56, 189, 248, 0.3);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.25rem;
  margin-bottom: 3.5rem;
}

.cat-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.cat-card:hover {
  background: var(--bg-card-hover);
  border-color: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
  box-shadow: 0 12px 28px -6px rgba(0, 0, 0, 0.4);
}

.cat-icon-box {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.25rem;
}

.cat-card h3 {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-main);
}

.cat-card p {
  font-size: 0.875rem;
  color: var(--text-muted);
  flex: 1;
}

.cat-link {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--primary);
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.5rem;
}

.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.25rem;
  margin-bottom: 3.5rem;
}

.article-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 1.25rem;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.article-card:hover {
  background: var(--bg-card-hover);
  border-color: rgba(56, 189, 248, 0.3);
  transform: translateY(-2px);
}

.article-tag {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--primary);
  margin-bottom: 0.5rem;
}

.article-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 0.75rem;
  line-height: 1.4;
}

.article-meta {
  font-size: 0.75rem;
  color: var(--text-faint);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.banner-box {
  background: linear-gradient(135deg, rgba(2, 132, 199, 0.12), rgba(16, 185, 129, 0.08));
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 12px;
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1.25rem;
}

.banner-content h4 {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.banner-content p {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #fff;
  padding: 0.6rem 1.25rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

.results-header {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 1.75rem 2rem;
  margin-bottom: 2rem;
}

.breadcrumb {
  font-size: 0.8rem;
  color: var(--text-faint);
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.results-title {
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-bottom: 0.5rem;
}

.query-container {
  background: rgba(0, 0, 0, 0.35);
  border: 1px dashed rgba(56, 189, 248, 0.35);
  border-radius: 8px;
  padding: 0.85rem 1.25rem;
  margin-top: 1rem;
}

.result-echo {
  font-size: 1.05rem;
  color: #e2e8f0;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-bottom: 2.5rem;
}

.result-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 1.5rem 1.75rem;
  transition: all 0.2s ease;
}

.result-card:hover {
  border-color: rgba(255, 255, 255, 0.18);
  transform: translateX(3px);
  background: var(--bg-card-hover);
}

.result-card h3 {
  font-size: 1.15rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.result-card p {
  font-size: 0.9rem;
  color: var(--text-muted);
  line-height: 1.6;
}

.profile-container {
  max-width: 580px;
  margin: 2rem auto;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  padding: 2.25rem;
  box-shadow: 0 16px 36px -8px rgba(0, 0, 0, 0.5);
  text-align: center;
}

.avatar-badge {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0284c7, #10b981);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.25rem;
  box-shadow: 0 0 24px rgba(2, 132, 199, 0.35);
}

.profile-title {
  font-size: 1.75rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
}

.profile-greeting {
  font-size: 1.25rem;
  color: var(--primary);
  margin-bottom: 1.25rem;
  font-weight: 600;
}

.security-note {
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 8px;
  padding: 0.85rem 1rem;
  font-size: 0.8rem;
  color: #a7f3d0;
  margin: 1.5rem 0;
  text-align: left;
}

.footer {
  border-top: 1px solid var(--border-subtle);
  background: rgba(10, 14, 23, 0.95);
  padding: 2rem 1.5rem;
  margin-top: auto;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.8rem;
  color: var(--text-faint);
}
"""

NAVBAR_HTML = """
<nav class="navbar">
  <div class="nav-container">
    <a href="/" class="brand">
      <div class="brand-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      </div>
      <span>Dojo Support</span>
      <span class="brand-badge">Enterprise</span>
    </a>
    <div class="nav-links">
      <a href="/" class="nav-link">Knowledge Base</a>
      <a href="/preview?name=SecurityAnalyst" class="nav-link">Profile Preview</a>
      <div class="status-pill">
        <span class="status-dot"></span>
        <span>Systems Operational</span>
      </div>
    </div>
  </div>
</nav>
"""

FOOTER_HTML = """
<footer class="footer">
  <div class="footer-container">
    <div>&copy; 2026 Dojo Security Platform. Enterprise Customer Support Portal.</div>
    <div style="display: flex; gap: 1.25rem;">
      <a href="/">Home</a>
      <a href="/preview?name=SecurityAnalyst">Profile Preview</a>
      <a href="/health">System Health</a>
    </div>
  </div>
</footer>
"""

SEARCH_BOX_TEMPLATE = """
<form action="/search" method="GET" class="search-container">
  <div class="search-box">
    <div class="search-icon-wrapper">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    </div>
    <input 
      type="text" 
      name="q" 
      class="search-input" 
      placeholder="Search documentation, security policies, API guides..." 
      value="{QUERY_VALUE}"
      autofocus
      autocomplete="off"
    >
    <button type="submit" class="search-btn">
      Search
    </button>
  </div>
  <div class="search-tags">
    <span>Popular:</span>
    <a href="/search?q=XSS+Mitigation" class="search-tag">XSS Mitigation</a>
    <a href="/search?q=API+Keys" class="search-tag">API Keys</a>
    <a href="/search?q=Proof+Collector" class="search-tag">Proof Collector</a>
    <a href="/search?q=SSO+Integration" class="search-tag">SSO Integration</a>
    <a href="/search?q=DOJO_MARKER" class="search-tag">DOJO_MARKER</a>
  </div>
</form>
"""


def render_home_page() -> str:
    search_bar = SEARCH_BOX_TEMPLATE.replace("{QUERY_VALUE}", "")
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Dojo Support | Customer Portal</title>
  <style>{COMMON_STYLES}</style>
</head>
<body>
  {NAVBAR_HTML}
  <main class="main-content">
    <section class="hero">
      <div class="hero-pill">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <span>24/7 Security Operations Help Desk</span>
      </div>
      <h1>How can we help you?</h1>
      <p>Search verified incident procedures, identity configuration guides, and API integration references.</p>
      {search_bar}
    </section>

    <div class="section-header">
      <h2 class="section-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
        Browse by Category
      </h2>
    </div>

    <div class="categories-grid">
      <div class="cat-card">
        <div class="cat-icon-box" style="background: rgba(56, 189, 248, 0.12); color: #38bdf8;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <h3>Security & Access</h3>
        <p>Enterprise SAML/SSO configuration, MFA enforcement, RBAC privileges, and audit log pipelines.</p>
        <a href="/search?q=Security" class="cat-link">View articles &rarr;</a>
      </div>

      <div class="cat-card">
        <div class="cat-icon-box" style="background: rgba(16, 185, 129, 0.12); color: #10b981;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
        </div>
        <h3>API & Integrations</h3>
        <p>REST API documentation, webhook setup, proof collector endpoints, and custom tool connectors.</p>
        <a href="/search?q=API" class="cat-link">View articles &rarr;</a>
      </div>

      <div class="cat-card">
        <div class="cat-icon-box" style="background: rgba(245, 158, 11, 0.12); color: #f59e0b;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </div>
        <h3>Getting Started</h3>
        <p>Initial tenant onboarding, operator container prerequisites, and recommended baseline workflows.</p>
        <a href="/search?q=Getting+Started" class="cat-link">View articles &rarr;</a>
      </div>

      <div class="cat-card">
        <div class="cat-icon-box" style="background: rgba(168, 85, 247, 0.12); color: #c084fc;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
        <h3>Account & Profile</h3>
        <p>Notification preferences, profile display names, security credentials, and identity verification.</p>
        <a href="/search?q=Account" class="cat-link">View articles &rarr;</a>
      </div>

      <div class="cat-card">
        <div class="cat-icon-box" style="background: rgba(239, 68, 68, 0.12); color: #f87171;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h3>Troubleshooting</h3>
        <p>Container routing diagnostics, search reflection analysis, port binding checks, and error codes.</p>
        <a href="/search?q=Troubleshooting" class="cat-link">View articles &rarr;</a>
      </div>

      <div class="cat-card">
        <div class="cat-icon-box" style="background: rgba(99, 102, 241, 0.12); color: #818cf8;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
            <line x1="1" y1="10" x2="23" y2="10"></line>
          </svg>
        </div>
        <h3>Billing & Licenses</h3>
        <p>Enterprise seat allocations, consumption metrics, subscription renewals, and invoice history.</p>
        <a href="/search?q=Billing" class="cat-link">View articles &rarr;</a>
      </div>
    </div>

    <div class="section-header">
      <h2 class="section-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
        Popular Articles & Quick Help
      </h2>
    </div>

    <div class="articles-grid">
      <div class="article-card">
        <div>
          <div class="article-tag">Security Advisory</div>
          <div class="article-title">Handling Reflected Input Contexts Across Dynamic Support Endpoints</div>
        </div>
        <div class="article-meta">
          <span>Security • 4 min read</span>
          <a href="/search?q=Reflected+Input">Read &rarr;</a>
        </div>
      </div>

      <div class="article-card">
        <div>
          <div class="article-tag">API Integration</div>
          <div class="article-title">Connecting Local Proof Collectors for Headless Browser Verification</div>
        </div>
        <div class="article-meta">
          <span>Collector • 3 min read</span>
          <a href="/search?q=Proof+Collector">Read &rarr;</a>
        </div>
      </div>

      <div class="article-card">
        <div>
          <div class="article-tag">Identity & Access</div>
          <div class="article-title">Contextual Output Encoding: Comparing Raw and Escaped Profile Views</div>
        </div>
        <div class="article-meta">
          <span>Identity • 5 min read</span>
          <a href="/preview?name=SecurityAnalyst">Preview &rarr;</a>
        </div>
      </div>

      <div class="article-card">
        <div>
          <div class="article-tag">Diagnostics</div>
          <div class="article-title">Automated Query Triage: Using Language Models to Classify Attack Surfaces</div>
        </div>
        <div class="article-meta">
          <span>Triage • 6 min read</span>
          <a href="/search?q=Query+Triage">Read &rarr;</a>
        </div>
      </div>
    </div>

    <div class="banner-box">
      <div class="banner-content">
        <h4>Need to verify your profile presentation?</h4>
        <p>Preview how your analyst username and credentials appear across the enterprise platform.</p>
      </div>
      <a href="/preview?name=SecurityAnalyst" class="btn-secondary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        Launch Profile Preview
      </a>
    </div>
  </main>
  {FOOTER_HTML}
</body>
</html>"""


def render_search_page(query: str) -> str:
    # Notice: in the search bar input attribute, we safely escape quotes
    # so that the input attribute doesn't malform, but in the results section,
    # `query` is inserted raw between HTML tags to preserve the intentional reflected XSS.
    safe_attr_val = escape(query, quote=True)
    search_bar = SEARCH_BOX_TEMPLATE.replace("{QUERY_VALUE}", safe_attr_val)

    # Deliberately vulnerable: `query` is inserted raw between tags.
    # We maintain <p id="result">Results for: {query}</p> exactly as required by the lab.
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Search | Dojo Support</title>
  <style>{COMMON_STYLES}</style>
</head>
<body>
  {NAVBAR_HTML}
  <main class="main-content">
    <div style="margin-bottom: 2rem;">
      {search_bar}
    </div>

    <div class="results-header">
      <div class="breadcrumb">
        <a href="/">Dojo Support</a>
        <span>/</span>
        <span>Knowledge Base</span>
        <span>/</span>
        <span>Search</span>
      </div>
      <h1 class="results-title">Support search</h1>
      <div class="query-container">
        <p id="result" class="result-echo">Results for: {query}</p>
      </div>
    </div>

    <div class="section-header">
      <h2 class="section-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
        Related Knowledge Base Articles
      </h2>
      <a href="/" class="btn-secondary" style="padding: 0.4rem 0.85rem; font-size: 0.8rem;">
        &larr; Back to support home
      </a>
    </div>

    <div class="result-list">
      <div class="result-card">
        <div class="article-tag">Security Advisory &bull; Updated 2 days ago</div>
        <h3><a href="#">KB-2041: Identifying Untrusted Reflection Contexts in Search Handlers</a></h3>
        <p>When user input is reflected directly into HTML responses without contextual sanitization, client browsers interpret character sequences according to surrounding DOM grammar. Verify whether values land inside text nodes or tag attributes before deploying mitigations.</p>
      </div>

      <div class="result-card">
        <div class="article-tag">Architecture &bull; Verified</div>
        <h3><a href="#">KB-1108: Ephemeral Proof Collector Configuration and Verification</a></h3>
        <p>The Dojo test collector monitors inbound GET requests containing the verification token. Use an Image or fetch handler in proof scenarios to demonstrate script execution without transmitting sensitive data.</p>
      </div>

      <div class="result-card">
        <div class="article-tag">Reference &bull; Documentation</div>
        <h3><a href="#">KB-3392: Comparing Raw vs Context-Encoded Reflection Endpoints</a></h3>
        <p>Examine the differences between the unencoded search route and the context-encoded profile preview endpoint to understand proper sanitization strategies for HTML text nodes.</p>
      </div>
    </div>

    <div style="text-align: center; margin-top: 2rem;">
      <a href="/" class="btn-secondary">&larr; Back to support home</a>
    </div>
  </main>
  {FOOTER_HTML}
</body>
</html>"""


def render_preview_page(name: str) -> str:
    escaped_name = escape(name)
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Profile Preview | Dojo Support</title>
  <style>{COMMON_STYLES}</style>
</head>
<body>
  {NAVBAR_HTML}
  <main class="main-content">
    <div class="breadcrumb" style="max-width: 580px; margin: 0 auto 1rem;">
      <a href="/">Dojo Support</a>
      <span>/</span>
      <span>Account</span>
      <span>/</span>
      <span>Profile Preview</span>
    </div>

    <div class="profile-container">
      <div class="avatar-badge">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </div>
      <h1 class="profile-title">Profile preview</h1>
      <p class="profile-greeting">Hello, {escaped_name}.</p>

      <div class="security-note">
        <strong>Context-Aware Encoding Active:</strong> This route applies <code>html.escape()</code> to encode HTML characters before outputting into the page text node. Tags and scripts are rendered strictly as safe text.
      </div>

      <form action="/preview" method="GET" style="margin-top: 1.5rem; display: flex; gap: 0.5rem; justify-content: center;">
        <input 
          type="text" 
          name="name" 
          value="{escape(name, quote=True)}" 
          placeholder="Enter display name..." 
          style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); color: #fff; padding: 0.5rem 0.85rem; border-radius: 6px; outline: none; font-size: 0.85rem;"
        >
        <button type="submit" class="btn-secondary" style="cursor: pointer;">
          Update Preview
        </button>
      </form>

      <div style="margin-top: 2rem;">
        <a href="/" class="btn-secondary">&larr; Back to support home</a>
      </div>
    </div>
  </main>
  {FOOTER_HTML}
</body>
</html>"""


class App(BaseHTTPRequestHandler):
    def do_GET(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler API
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query, keep_blank_values=True)

        if parsed.path == "/health":
            self.respond("ok\n", "text/plain; charset=utf-8")
            return

        if parsed.path == "/":
            self.respond(render_home_page())
            return

        if parsed.path == "/search":
            query = params.get("q", [""])[0]
            # Deliberately vulnerable: untrusted input is inserted directly
            # between HTML tags. This is the intended reflected-XSS route.
            self.respond(render_search_page(query))
            return

        if parsed.path == "/preview":
            name = params.get("name", [""])[0]
            # Comparison route: correctly encoded for HTML text context.
            self.respond(render_preview_page(name))
            return

        self.send_error(404, "not found")

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
    ThreadingHTTPServer(("0.0.0.0", 8080), App).serve_forever()

