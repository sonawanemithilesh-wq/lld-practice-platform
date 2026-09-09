# 🤖 AI Usage & Engineering Decisions

This document records 4 key engineering decisions made during the design and development of the **LLD Practice Platform**, contrasting initial AI suggestions against human architectural judgement.

---

### Decision 1: Evaluation Engine — Strategy Pattern & Service Orchestrator vs Monolithic Route Handler

- **AI Initial Suggestion**:
  Place the deterministic validation, LLM API invocation, and database queries directly inside the Express controller (`POST /api/submissions`) or a single utility function `evaluateSubmission()`.
- **Human Architectural Override**:
  Reject the monolithic approach. Because this platform is specifically built to teach and test **Low-Level Object-Oriented Design (LLD)**, the backend itself must embody clean Low-Level Design principles:
  - Created an explicit `IEvaluator` Strategy interface.
  - Implemented interchangeable strategies: `LLMEvaluator` and `MockEvaluator`.
  - Introduced `EvaluationService` as a single-responsibility orchestrator that manages submission state transitions (`PENDING` -> `EVALUATING` -> `COMPLETED` / `FAILED`).
  - Separated concerns using the Repository pattern (`ProblemRepository`, `SubmissionRepository`, `FeedbackRepository`).
- **Impact / Outcome**:
  The system satisfies the **Single Responsibility Principle (SRP)** and **Open/Closed Principle (OCP)**. New evaluation strategies (e.g. static AST parsers or test runner containers) can be added by implementing `IEvaluator` without altering existing orchestration or database code.

---

### Decision 2: Two-Tier Evaluation Pipeline — Fast Deterministic Checks vs Pure LLM Prompting

- **AI Initial Suggestion**:
  Rely purely on the LLM prompt to validate whether a submission is empty, too short, or lacks code structure, and let the model return a score of 0 or validation errors in the JSON.
- **Human Architectural Override**:
  Introduced a dedicated `DeterministicValidator` class as the first phase of the evaluation pipeline before any external API is called:
  - Validates non-empty input and minimum length thresholds (>= 40 chars).
  - Checks for the presence of object-oriented structural keywords (e.g. `class`, `interface`, `enum`, `def`, `func`).
  - For text format, checks for architectural modeling terminology.
- **Impact / Outcome**:
  - **Latency**: Rejects invalid or trivial submissions in < 1ms rather than waiting 2-5 seconds for an LLM response.
  - **Cost & Quota Efficiency**: Prevents wasted LLM tokens and API quota on trivial errors or typos.
  - **Predictability**: Ensures deterministic, reproducible error messages that can be asserted in automated unit tests (`deterministicValidator.test.ts`).

---

### Decision 3: Resilient Heuristic Fallback vs Hard Dependency on External API Keys

- **AI Initial Suggestion**:
  Make `GEMINI_API_KEY` or `OPENAI_API_KEY` a strictly required environment variable and throw an unhandled error or exit process on startup if missing.
- **Human Architectural Override**:
  Implement a smart `MockEvaluator` that inspects code syntax for OOP constructs, design patterns (Strategy, State, Factory, Observer), and problem-specific entities (e.g. Vehicle/Spot for Parking Lot, Dispatcher for Elevator, State pattern for Vending Machine) to produce rich, realistic rubric scores.
  - The `LLMEvaluator` also catches upstream API timeouts or rate-limits and gracefully falls back to the heuristic evaluator rather than failing the learner's attempt.
- **Impact / Outcome**:
  The platform works **100% out of the box** for any developer, student, or CI pipeline without forcing them to acquire an external API key first. When an API key is provided, the platform automatically switches to LLM evaluation.

---

### Decision 4: Embedded SQLite with Repository Abstraction vs External Database Server

- **AI Initial Suggestion**:
  Spin up MongoDB or PostgreSQL using Docker Compose to handle relational/document storage.
- **Human Architectural Override**:
  Use embedded SQLite via `better-sqlite3` with an automatic schema bootstrap and repository interfaces (`IProblemRepository`, `ISubmissionRepository`, `IFeedbackRepository`):
  - No external Docker or database daemon required.
  - The database file (`lld.db`) is initialized automatically on startup.
  - Unit and integration tests run against isolated in-memory instances (`Database(':memory:')`) in sub-second speeds.
- **Impact / Outcome**:
  Enables a frictionless developer setup (`npm run seed && npm run dev` just works on any machine), while adhering to the **Dependency Inversion Principle (DIP)** so that storage backends can be swapped out without touching business logic.
