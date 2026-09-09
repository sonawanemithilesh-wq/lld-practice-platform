import { IEvaluator } from './IEvaluator.js';
import { Problem, Submission, EvaluationResult } from '../domain/types.js';

export class MockEvaluator implements IEvaluator {
  public async evaluate(submission: Submission, problem: Problem): Promise<EvaluationResult> {
    const code = submission.solutionContent;
    const lower = code.toLowerCase();

    // Heuristics for analysis
    const hasInterface = /\b(interface|abstract\s+class|protocol|trait)\b/i.test(code);
    const hasEnum = /\b(enum)\b/i.test(code);
    const classMatches = code.match(/\bclass\s+([A-Za-z0-9_]+)/g) || [];
    const classCount = classMatches.length;

    // Pattern recognition
    const hasStrategy = /(strategy|algorithm|policy|calculator)/i.test(code);
    const hasState = /(state|status|idle|moving|dispens)/i.test(code);
    const hasFactory = /(factory|builder|creator|create)/i.test(code);
    const hasObserver = /(observer|listener|event|notify)/i.test(code);
    const hasSingleton = /(singleton|instance|getinstance)/i.test(code);

    // Problem-specific checks
    const problemSlug = problem.slug;
    let domainSpecificPoints = 0;
    const domainStrengths: string[] = [];
    const domainConcerns: string[] = [];
    const domainSuggestions: string[] = [];

    if (problemSlug === 'parking-lot') {
      const hasVehicleTypes = /(car|bike|truck|motorcycle|vehicle)/i.test(code);
      const hasParkingSpot = /(parkingspot|spot|slot)/i.test(code);
      const hasTicket = /(ticket|receipt|entry|exit)/i.test(code);
      const hasPricing = /(pricing|fee|rate|cost|pay)/i.test(code);

      if (hasVehicleTypes) {
        domainSpecificPoints += 5;
        domainStrengths.push('Clean abstraction for different Vehicle types with polymorphism.');
      } else {
        domainConcerns.push('Missing explicit vehicle hierarchy or spot dimension differentiation.');
        domainSuggestions.push('Model a Vehicle abstract base class or interface with Car, Motorcycle, and Truck specializations.');
      }

      if (hasParkingSpot) {
        domainSpecificPoints += 5;
        domainStrengths.push('Dedicated ParkingSpot entity handling occupancy state.');
      }

      if (hasPricing && hasStrategy) {
        domainSpecificPoints += 5;
        domainStrengths.push('Leveraged Strategy pattern for dynamic hourly/vehicle-based fee calculation.');
      } else {
        domainSuggestions.push('Extract pricing logic into a PricingStrategy interface to satisfy the Open-Closed Principle.');
      }

      if (hasTicket) {
        domainSpecificPoints += 4;
        domainStrengths.push('Ticket entity encapsulates entry timestamp and assigned spot tracking.');
      }
    } else if (problemSlug === 'elevator-control-system') {
      const hasElevator = /(elevator|car|lift)/i.test(code);
      const hasDispatcher = /(dispatch|controller|manager|scheduler)/i.test(code);
      const hasDirection = /(direction|up|down|idle)/i.test(code);
      const hasRequest = /(request|call|button|floor)/i.test(code);

      if (hasElevator && hasDispatcher) {
        domainSpecificPoints += 8;
        domainStrengths.push('Proper separation between the Elevator hardware/cabin model and the Dispatcher/Controller orchestration.');
      } else {
        domainConcerns.push('Elevator cabin entity is coupled with scheduling or dispatching logic.');
        domainSuggestions.push('Introduce a dedicated ElevatorController/Dispatcher to decouple floor request assignment from the individual Elevator state.');
      }

      if (hasDirection && hasState) {
        domainSpecificPoints += 6;
        domainStrengths.push('Explicit representation of Elevator movement state and direction vector.');
      }

      if (hasRequest) {
        domainSpecificPoints += 5;
        domainStrengths.push('Request model cleanly encapsulates source floor, destination floor, and direction.');
      }
    } else if (problemSlug === 'vending-machine') {
      const hasStatePattern = /(state|hasmoney|dispens|soldout|idle)/i.test(code);
      const hasInventory = /(inventory|item|product|stock)/i.test(code);
      const hasPayment = /(coin|cash|money|payment|balance|change)/i.test(code);

      if (hasStatePattern && hasInterface) {
        domainSpecificPoints += 10;
        domainStrengths.push('Exemplary usage of the State Pattern for vending machine state transitions (NoMoney, HasMoney, Dispensing).');
      } else {
        domainConcerns.push('State management relies on procedural conditionals/switches rather than the State Pattern.');
        domainSuggestions.push('Refactor state handling into state objects conforming to a VendingMachineState interface.');
      }

      if (hasInventory) {
        domainSpecificPoints += 5;
        domainStrengths.push('Inventory manager isolates item shelf slots, pricing, and stock decrement logic.');
      }

      if (hasPayment) {
        domainSpecificPoints += 4;
        domainStrengths.push('Clean accounting for inserted currency and change calculation.');
      }
    } else {
      domainSpecificPoints += 10;
    }

    // Score calculations (out of 25 each)
    let solidScore = 15;
    if (hasInterface) solidScore += 5;
    if (classCount >= 3) solidScore += 3;
    if (hasStrategy || hasFactory) solidScore += 2;
    solidScore = Math.min(25, solidScore);

    let classRespScore = 14;
    if (classCount >= 3 && classCount <= 12) classRespScore += 6;
    if (hasEnum) classRespScore += 3;
    classRespScore = Math.min(25, classRespScore);

    let extensibilityScore = 13;
    if (hasStrategy || hasState || hasObserver) extensibilityScore += 7;
    if (hasInterface) extensibilityScore += 4;
    extensibilityScore = Math.min(25, extensibilityScore);

    let edgeCasesScore = 12 + Math.floor(domainSpecificPoints / 2);
    if (/try|catch|throw|exception|error|validate|check|assert/i.test(code)) edgeCasesScore += 4;
    if (/sync|lock|mutex|atomic|thread/i.test(code)) edgeCasesScore += 3;
    edgeCasesScore = Math.min(25, edgeCasesScore);

    const overallScore = solidScore + classRespScore + extensibilityScore + edgeCasesScore;

    const strengths: string[] = [
      ...domainStrengths,
      classCount >= 3 ? `Defined ${classCount} distinct domain classes with cohesive boundaries.` : 'Clear initial domain entity identification.',
      hasInterface ? 'Good usage of interfaces/abstractions promoting low coupling and testability.' : 'Logical separation of state and behavior.'
    ];

    const concerns: string[] = [
      ...domainConcerns,
      !hasInterface ? 'Lacks interfaces or abstractions, which makes unit testing and future extensions harder.' : 'Consider validating edge cases for concurrent mutations.',
      classCount < 3 ? 'Too few classes identified; consider decomposing composite entities into focused collaborators.' : 'Watch out for potential God-Class tendencies in the central controller.'
    ];

    const actionableSuggestions: string[] = [
      ...domainSuggestions,
      'Apply Dependency Inversion: Inject service interfaces into controllers/managers rather than instantiating concretions.',
      'Add concurrency guards (e.g. locks or thread-safe collections) for critical shared state operations.',
      'Define domain-specific custom exceptions (e.g. CapacityExceededException, InsufficientFundsException) for clearer failure modes.'
    ];

    return {
      overallScore,
      criteriaScores: {
        solidPrinciples: solidScore,
        classResponsibilities: classRespScore,
        extensibility: extensibilityScore,
        edgeCases: edgeCasesScore
      },
      strengths: Array.from(new Set(strengths)).slice(0, 4),
      concerns: Array.from(new Set(concerns)).slice(0, 4),
      actionableSuggestions: Array.from(new Set(actionableSuggestions)).slice(0, 4),
      summary: `The solution demonstrates a solid understanding of object-oriented design with an overall score of ${overallScore}/100. Key entities are established, with good opportunities to elevate modularity and extensibility via standard design patterns.`
    };
  }
}
