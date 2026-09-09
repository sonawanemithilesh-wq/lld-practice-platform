import { describe, it, expect } from 'vitest';
import { DeterministicValidator } from '../evaluator/DeterministicValidator.js';
import { Problem, Submission } from '../domain/types.js';

describe('DeterministicValidator', () => {
  const validator = new DeterministicValidator();

  const mockProblem: Problem = {
    id: 'prob-test',
    slug: 'test-problem',
    title: 'Test Problem',
    difficulty: 'Medium',
    description: 'Test description',
    requirements: ['Requirement 1'],
    constraints: ['Constraint 1'],
    evaluationRubric: []
  };

  it('rejects empty submission content', () => {
    const submission: Submission = {
      id: 'sub-1',
      problemId: mockProblem.id,
      solutionContent: '   ',
      format: 'CODE',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = validator.validate(submission, mockProblem);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Submission content cannot be empty.');
  });

  it('rejects submission content that is too short', () => {
    const submission: Submission = {
      id: 'sub-2',
      problemId: mockProblem.id,
      solutionContent: 'class Short {}',
      format: 'CODE',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = validator.validate(submission, mockProblem);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('too brief'))).toBe(true);
  });

  it('rejects code submissions without object-oriented structural keywords', () => {
    const submission: Submission = {
      id: 'sub-3',
      problemId: mockProblem.id,
      solutionContent: 'This is just a long text that has no structural keywords and does not define any classes or functions at all.',
      format: 'CODE',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = validator.validate(submission, mockProblem);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('structural declarations'))).toBe(true);
  });

  it('accepts valid code submission with classes and methods', () => {
    const submission: Submission = {
      id: 'sub-4',
      problemId: mockProblem.id,
      solutionContent: `
        public class ParkingLot {
          private List<ParkingSpot> spots = new ArrayList<>();
          public Ticket parkVehicle(Vehicle vehicle) {
            return new Ticket();
          }
        }
      `,
      format: 'CODE',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = validator.validate(submission, mockProblem);
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('accepts valid text architectural design with domain entities', () => {
    const submission: Submission = {
      id: 'sub-5',
      problemId: mockProblem.id,
      solutionContent: `
        ### Architectural Design Document
        - Entity: ParkingLot contains multiple ParkingFloor entities.
        - Class ParkingSpot tracks occupancy state and Vehicle type.
        - Strategy Pattern: PricingStrategy computes parking fees dynamically.
      `,
      format: 'TEXT',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = validator.validate(submission, mockProblem);
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });
});
