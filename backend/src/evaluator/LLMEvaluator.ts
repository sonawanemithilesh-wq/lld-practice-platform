import { IEvaluator } from './IEvaluator.js';
import { Problem, Submission, EvaluationResult } from '../domain/types.js';
import { MockEvaluator } from './MockEvaluator.js';

export class LLMEvaluator implements IEvaluator {
  private fallbackEvaluator: MockEvaluator;

  constructor() {
    this.fallbackEvaluator = new MockEvaluator();
  }

  public async evaluate(submission: Submission, problem: Problem): Promise<EvaluationResult> {
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    // If no external LLM API key configured, use our intelligent heuristic evaluator
    if (!geminiKey && !openaiKey) {
      return this.fallbackEvaluator.evaluate(submission, problem);
    }

    try {
      if (geminiKey) {
        return await this.evaluateWithGemini(submission, problem, geminiKey);
      } else if (openaiKey) {
        return await this.evaluateWithOpenAI(submission, problem, openaiKey);
      }
    } catch (error) {
      console.error('LLM Evaluation failed, falling back to heuristic evaluator:', error);
      return await this.fallbackEvaluator.evaluate(submission, problem);
    }

    return this.fallbackEvaluator.evaluate(submission, problem);
  }

  private async evaluateWithGemini(
    submission: Submission,
    problem: Problem,
    apiKey: string
  ): Promise<EvaluationResult> {
    const prompt = this.buildPrompt(submission, problem);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const payload = {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API returned HTTP ${response.status}: ${errText}`);
    }

    const data: any = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('Gemini API returned an empty response');
    }

    return this.parseAndValidateResponse(candidateText);
  }

  private async evaluateWithOpenAI(
    submission: Submission,
    problem: Problem,
    apiKey: string
  ): Promise<EvaluationResult> {
    const prompt = this.buildPrompt(submission, problem);

    const url = 'https://api.openai.com/v1/chat/completions';
    const payload = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert Principal Software Engineer and Low-Level System Design (LLD) interviewer. Evaluate the candidate submission strictly and return JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API returned HTTP ${response.status}: ${errText}`);
    }

    const data: any = await response.json();
    const contentText = data?.choices?.[0]?.message?.content;
    if (!contentText) {
      throw new Error('OpenAI API returned an empty response');
    }

    return this.parseAndValidateResponse(contentText);
  }

  private buildPrompt(submission: Submission, problem: Problem): string {
    return `
You are a Principal Software Engineer evaluating a candidate's Low-Level Object-Oriented Design (LLD) submission.

PROBLEM SPECIFICATION:
Title: ${problem.title}
Difficulty: ${problem.difficulty}
Description:
${problem.description}

Requirements:
${problem.requirements.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Constraints:
${problem.constraints.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Expected Rubric:
${JSON.stringify(problem.evaluationRubric, null, 2)}

CANDIDATE SUBMISSION:
Format: ${submission.format} (${submission.language || 'generic'})
Content:
\`\`\`
${submission.solutionContent}
\`\`\`

EVALUATION INSTRUCTIONS:
Assess the submission across the 4 key criteria:
1. solidPrinciples (score 0 to 25): Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.
2. classResponsibilities (score 0 to 25): Clean class boundaries, appropriate encapsulation, avoiding God classes.
3. extensibility (score 0 to 25): Use of design patterns (Strategy, State, Factory, Observer, etc.) to allow future expansion.
4. edgeCases (score 0 to 25): Handling concurrency, boundary conditions, error validation, capacity limits.

Overall Score must be the sum of the 4 criteria scores (0 to 100).

You MUST return pure JSON matching this exact structure:
{
  "overallScore": number,
  "criteriaScores": {
    "solidPrinciples": number,
    "classResponsibilities": number,
    "extensibility": number,
    "edgeCases": number
  },
  "strengths": ["string", "string", ...],
  "concerns": ["string", "string", ...],
  "actionableSuggestions": ["string", "string", ...],
  "summary": "string"
}
`;
  }

  private parseAndValidateResponse(jsonStr: string): EvaluationResult {
    const parsed = JSON.parse(jsonStr);

    const solid = Number(parsed.criteriaScores?.solidPrinciples ?? 15);
    const classResp = Number(parsed.criteriaScores?.classResponsibilities ?? 15);
    const extensibility = Number(parsed.criteriaScores?.extensibility ?? 15);
    const edgeCases = Number(parsed.criteriaScores?.edgeCases ?? 15);
    const overall = solid + classResp + extensibility + edgeCases;

    return {
      overallScore: Math.min(100, Math.max(0, overall)),
      criteriaScores: {
        solidPrinciples: Math.min(25, Math.max(0, solid)),
        classResponsibilities: Math.min(25, Math.max(0, classResp)),
        extensibility: Math.min(25, Math.max(0, extensibility)),
        edgeCases: Math.min(25, Math.max(0, edgeCases))
      },
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['Cohesive class structure'],
      concerns: Array.isArray(parsed.concerns) ? parsed.concerns : ['Consider interface decoupling'],
      actionableSuggestions: Array.isArray(parsed.actionableSuggestions)
        ? parsed.actionableSuggestions
        : ['Apply Strategy pattern for variable behaviors'],
      summary: typeof parsed.summary === 'string' ? parsed.summary : 'Evaluation complete.'
    };
  }
}
