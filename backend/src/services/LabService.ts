import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Lab, LabValidationResult } from '../domain/labTypes.js';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface LabConfig {
  id: string;
  slug: string;
  title: string;
  summary: string;
  difficulty: number;
  estimatedTimeMinutes: number;
  format: string;
  tags: string[];
  learningObjectives: string[];
  prerequisites: {
    knowledge: string[];
    system: string[];
    keys: string[];
  };
  hints: Array<{ id: string; trigger: string; text: string }>;
  references: Array<{ title: string; url: string }>;
  ports: {
    target: number;
    collector: number;
    readyz: number;
  };
  proofToken: string;
}

const LAB_CONFIGS: Record<string, LabConfig> = {
  '020-xss-context-triage': {
    id: '020-xss-context-triage',
    slug: '020-xss-context-triage',
    title: 'AI-assisted XSS context triage',
    summary:
      'Find a reflected XSS flaw in a small local support-search application. Use an LLM to classify the reflection context and critique a proof payload, then trigger a harmless local collector to demonstrate browser execution.',
    difficulty: 2,
    estimatedTimeMinutes: 45,
    format: 'hands-on',
    tags: ['web', 'xss', 'reflected-xss', 'payload-crafting', 'cybersecurity'],
    learningObjectives: [
      'Locate user-controlled input reflected in an HTTP response',
      'Classify the HTML context before selecting an XSS proof payload',
      'Use an LLM to critique payload assumptions instead of blindly copying a generic payload',
      'Demonstrate execution with a harmless, local-only proof collector'
    ],
    prerequisites: {
      knowledge: [
        'Basic HTTP requests and URL encoding',
        'Basic HTML: elements, attributes, and script execution',
        'Basic prompt engineering (system prompt and structured output)'
      ],
      system: ['Docker + docker compose', 'A local web browser'],
      keys: ['OPENAI_API_KEY, ANTHROPIC_API_KEY, or local Ollama install (optional)']
    },
    hints: [
      {
        id: 'h1',
        trigger: 'start',
        text: 'First send a harmless marker such as DOJO_MARKER and inspect exactly where it appears in the response.'
      },
      {
        id: 'h2',
        trigger: '2nd_failed_validate',
        text: 'The vulnerable route is the search endpoint. The proof collector is available on localhost port 9201 from your browser.'
      },
      {
        id: 'h3',
        trigger: '10m_idle',
        text: 'A browser-execution proof can be a script that creates an Image whose src points at the local collector; it does not need to read data.'
      }
    ],
    references: [
      {
        title: 'PortSwigger Web Security Academy — Cross-site scripting',
        url: 'https://portswigger.net/web-security/cross-site-scripting'
      },
      {
        title: 'OWASP Cross Site Scripting Prevention Cheat Sheet',
        url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html'
      }
    ],
    ports: {
      target: 9200,
      collector: 9201,
      readyz: 9202
    },
    proofToken: 'dojo-xss-context-triage'
  },
  '021-sql-injection-auth-bypass': {
    id: '021-sql-injection-auth-bypass',
    slug: '021-sql-injection-auth-bypass',
    title: 'AI-assisted SQL injection auth bypass',
    summary:
      'Discover an authentication bypass SQL injection flaw in a local login portal. Use an LLM to analyze the dynamic query structure, formulate a controlled test payload, verify admin access in the local target, and compare against a secure parameterized implementation.',
    difficulty: 2,
    estimatedTimeMinutes: 45,
    format: 'hands-on',
    tags: ['web', 'sqli', 'sql-injection', 'auth-bypass', 'cybersecurity'],
    learningObjectives: [
      'Understand the mechanics of dynamic SQL query construction in authentication endpoints',
      'Detect SQL syntax sensitivity and database diagnostic feedback',
      'Use an LLM to reason about query logic manipulation and identify test payloads',
      'Safely demonstrate administrative authentication bypass in a controlled local target',
      'Understand how parameterized queries and prepared statements eliminate SQL injection'
    ],
    prerequisites: {
      knowledge: [
        'Basic HTTP POST requests and form data',
        'Fundamental SQL syntax (SELECT, WHERE, AND, OR, comments)',
        'Basic prompt engineering (system prompt and structured output)'
      ],
      system: ['Docker + docker compose', 'A local web browser'],
      keys: ['OPENAI_API_KEY, ANTHROPIC_API_KEY, or local Ollama install (optional)']
    },
    hints: [
      {
        id: 'h1',
        trigger: 'start',
        text: 'First test a normal login using the authorized analyst credentials to observe standard behavior.'
      },
      {
        id: 'h2',
        trigger: '2nd_failed_validate',
        text: "Notice what happens when you enter a single quote (') into the username field. Inspect the resulting diagnostic message."
      },
      {
        id: 'h3',
        trigger: '10m_idle',
        text: "In SQLite, the double dash (--) denotes a comment to the end of the line. Consider how admin' -- alters the WHERE clause."
      }
    ],
    references: [
      {
        title: 'PortSwigger Web Security Academy — SQL injection',
        url: 'https://portswigger.net/web-security/sql-injection'
      },
      {
        title: 'OWASP SQL Injection Prevention Cheat Sheet',
        url: 'https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html'
      }
    ],
    ports: {
      target: 9210,
      collector: 9211,
      readyz: 9212
    },
    proofToken: 'dojo-sqli-auth-bypass'
  }
};

export class LabService {
  private labsRoot: string;

  constructor(customLabsRoot?: string) {
    if (customLabsRoot) {
      this.labsRoot = customLabsRoot;
    } else {
      // Find labs root directory
      const candidates = [
        path.resolve(process.cwd(), 'labs'),
        path.resolve(__dirname, '../../../labs'),
        path.resolve(__dirname, '../../../../labs')
      ];
      this.labsRoot = candidates.find((c) => fs.existsSync(c)) || candidates[0];
    }
  }

  private getLabDir(id: string): string {
    return path.join(this.labsRoot, id);
  }

  private getComposePath(id: string): string {
    return path.join(this.getLabDir(id), 'environment', 'docker-compose.yml');
  }

  private loadInstructions(id: string): string {
    const file = path.join(this.getLabDir(id), 'instructions.md');
    if (fs.existsSync(file)) {
      return fs.readFileSync(file, 'utf-8');
    }
    return '# Lab Instructions\n\nNo instructions found for this lab.';
  }

  private async probeHealth(url: string, timeoutMs = 1500): Promise<boolean> {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(id);
      return res.ok;
    } catch {
      return false;
    }
  }

  private async fetchCollectorStatus(
    collectorUrl: string
  ): Promise<{ proved: boolean; token: string | null }> {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${collectorUrl}/status`, { signal: controller.signal });
      clearTimeout(id);
      if (res.ok) {
        return (await res.json()) as { proved: boolean; token: string | null };
      }
    } catch {
      // ignore
    }
    return { proved: false, token: null };
  }

  public async getLab(id: string): Promise<Lab | null> {
    const config = LAB_CONFIGS[id];
    if (!config) return null;

    const targetUrl = `http://localhost:${config.ports.target}`;
    const collectorUrl = `http://localhost:${config.ports.collector}`;
    const readyCheckUrl = `http://localhost:${config.ports.readyz}/health`;

    const [isReady, collectorState] = await Promise.all([
      this.probeHealth(readyCheckUrl),
      this.fetchCollectorStatus(collectorUrl)
    ]);

    let status: Lab['status'] = 'stopped';
    if (isReady) {
      status = 'ready';
    } else {
      // Check if containers exist and are starting
      try {
        const composePath = this.getComposePath(id);
        if (fs.existsSync(composePath)) {
          const { stdout } = await execAsync(
            `docker compose -f "${composePath}" ps --status running -q`
          );
          if (stdout.trim().length > 0) {
            status = 'starting';
          }
        }
      } catch {
        status = 'not_started';
      }
    }

    return {
      ...config,
      instructions: this.loadInstructions(id),
      targetUrl,
      collectorUrl,
      readyCheckUrl,
      status,
      proved: collectorState.proved === true && collectorState.token === config.proofToken
    };
  }

  public async listLabs(): Promise<Lab[]> {
    const ids = Object.keys(LAB_CONFIGS);
    const labs = await Promise.all(ids.map((id) => this.getLab(id)));
    return labs.filter((l): l is Lab => l !== null);
  }

  public async getLabStatus(
    id: string
  ): Promise<{ status: Lab['status']; proved: boolean; targetOnline: boolean }> {
    const config = LAB_CONFIGS[id];
    if (!config) {
      throw new Error(`Unknown lab '${id}'`);
    }

    const targetUrl = `http://localhost:${config.ports.target}`;
    const collectorUrl = `http://localhost:${config.ports.collector}`;
    const readyCheckUrl = `http://localhost:${config.ports.readyz}/health`;

    const [isReady, isTargetUp, collectorState] = await Promise.all([
      this.probeHealth(readyCheckUrl),
      this.probeHealth(`${targetUrl}/health`),
      this.fetchCollectorStatus(collectorUrl)
    ]);

    let status: Lab['status'] = 'stopped';
    if (isReady && isTargetUp) {
      status = 'ready';
    } else {
      try {
        const composePath = this.getComposePath(id);
        if (fs.existsSync(composePath)) {
          const { stdout } = await execAsync(
            `docker compose -f "${composePath}" ps --status running -q`
          );
          if (stdout.trim().length > 0) {
            status = 'starting';
          }
        }
      } catch {
        status = 'not_started';
      }
    }

    return {
      status,
      proved: collectorState.proved === true && collectorState.token === config.proofToken,
      targetOnline: isTargetUp
    };
  }

  public async startLab(id: string): Promise<{ ok: boolean; message: string; output?: string }> {
    const config = LAB_CONFIGS[id];
    if (!config) {
      throw new Error(`Unknown lab '${id}'`);
    }

    const composePath = this.getComposePath(id);
    if (!fs.existsSync(composePath)) {
      throw new Error(`docker-compose.yml not found at: ${composePath}`);
    }

    try {
      const { stdout, stderr } = await execAsync(
        `docker compose -f "${composePath}" up -d --build`
      );
      return {
        ok: true,
        message: `Lab ${id} started successfully.`,
        output: `${stdout}\n${stderr}`.trim()
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        message: `Failed to start lab ${id}: ${errorMsg}`
      };
    }
  }

  public async stopLab(id: string): Promise<{ ok: boolean; message: string; output?: string }> {
    const config = LAB_CONFIGS[id];
    if (!config) {
      throw new Error(`Unknown lab '${id}'`);
    }

    const composePath = this.getComposePath(id);
    if (!fs.existsSync(composePath)) {
      throw new Error(`docker-compose.yml not found at: ${composePath}`);
    }

    try {
      const { stdout, stderr } = await execAsync(`docker compose -f "${composePath}" down`);
      return {
        ok: true,
        message: `Lab ${id} stopped successfully.`,
        output: `${stdout}\n${stderr}`.trim()
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        message: `Failed to stop lab ${id}: ${errorMsg}`
      };
    }
  }

  public async resetLab(id: string): Promise<{ ok: boolean; message: string; output?: string }> {
    const config = LAB_CONFIGS[id];
    if (!config) {
      throw new Error(`Unknown lab '${id}'`);
    }

    const composePath = this.getComposePath(id);
    if (!fs.existsSync(composePath)) {
      throw new Error(`docker-compose.yml not found at: ${composePath}`);
    }

    try {
      // down -v wipes the proof volume
      await execAsync(`docker compose -f "${composePath}" down -v`);
      const { stdout, stderr } = await execAsync(`docker compose -f "${composePath}" up -d`);
      return {
        ok: true,
        message: `Lab ${id} reset successfully. Proof state cleared.`,
        output: `${stdout}\n${stderr}`.trim()
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        message: `Failed to reset lab ${id}: ${errorMsg}`
      };
    }
  }

  public async validateLab(id: string): Promise<LabValidationResult> {
    const config = LAB_CONFIGS[id];
    if (!config) {
      return {
        ok: false,
        passed: false,
        output: `Unknown lab '${id}'`
      };
    }

    const collectorUrl = `http://localhost:${config.ports.collector}`;
    const status = await this.fetchCollectorStatus(collectorUrl);

    if (status.proved === true && status.token === config.proofToken) {
      return {
        ok: true,
        passed: true,
        output: `Success! Valid local proof recorded for ${config.title}. Token: ${config.proofToken}`,
        details: status
      };
    }

    return {
      ok: true,
      passed: false,
      output: `No valid proof recorded yet. Complete the lab instructions in the local target to trigger the proof collector.`,
      details: status
    };
  }
}
