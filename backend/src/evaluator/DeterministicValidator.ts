import { Problem, Submission, ValidationResult } from '../domain/types.js';

export class DeterministicValidator {
  private static readonly MIN_LENGTH = 40;

  /**
   * Performs instant deterministic checks on a submission before invoking LLM evaluators.
   */
  public validate(submission: Submission, problem: Problem): ValidationResult {
    const errors: string[] = [];
    const content = submission.solutionContent?.trim() || '';

    if (!content) {
      errors.push('Submission content cannot be empty.');
      return { isValid: false, errors };
    }

    if (content.length < DeterministicValidator.MIN_LENGTH) {
      errors.push(
        `Submission is too brief (${content.length} chars). A viable LLD design requires at least ${DeterministicValidator.MIN_LENGTH} characters of structural design or code.`
      );
    }

    if (submission.format === 'CODE') {
      const codeStructuralKeywords = [
        /\bclass\b/i,
        /\binterface\b/i,
        /\benum\b/i,
        /\bstruct\b/i,
        /\btype\b/i,
        /\bdef\b/i,
        /\bfunction\b/i,
        /\bpublic\b/i,
        /\bprivate\b/i,
        /\bprotected\b/i
      ];

      const hasStructuralKeyword = codeStructuralKeywords.some((regex) => regex.test(content));

      if (!hasStructuralKeyword) {
        errors.push(
          'Code submission must contain object-oriented structural declarations (e.g., classes, interfaces, enums, or functions).'
        );
      }
    } else if (submission.format === 'TEXT') {
      const textStructuralIndicators = [
        /class/i,
        /entity/i,
        /component/i,
        /interface/i,
        /responsibilit/i,
        /method/i,
        /attribute/i,
        /pattern/i,
        /state/i,
        /model/i,
        /design/i,
        /actor/i
      ];

      const hasStructuralKeywords = textStructuralIndicators.some((regex) => regex.test(content));

      if (!hasStructuralKeywords) {
        errors.push(
          'Text submission lacks design terminology (mention entities, classes, attributes, methods, or responsibilities).'
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
