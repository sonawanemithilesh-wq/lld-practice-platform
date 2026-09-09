import { Problem } from '../domain/types.js';
import { getDatabase } from '../db/connection.js';
import { SqliteProblemRepository } from '../repositories/ProblemRepository.js';

export const seededProblems: Problem[] = [
  {
    id: 'prob-parking-lot',
    slug: 'parking-lot',
    title: 'Design a Parking Lot System',
    difficulty: 'Medium',
    description: `Design a comprehensive object-oriented Low-Level Design for an automated Multi-Level Parking Lot.
The parking lot has multiple floors, and each floor contains multiple parking spots tailored for different vehicle categories (Motorcycles, Compact Cars, Large Trucks/Buses, and Electric Vehicles).
The system must handle vehicle entry with ticket issuance, automated spot allocation based on vehicle size and proximity, flexible hourly/dynamic fee calculation upon exit, and payment processing.`,
    requirements: [
      'Support multiple floors with designated spot types (Small, Compact, Large, EV).',
      'Accommodate multiple vehicle types (Motorcycle, Car, Truck/Van) with size compatibility rules.',
      'Provide an automated Spot Assignment Strategy (e.g. Nearest to entrance, Lowest floor first).',
      'Issue a digital Ticket upon entry with timestamp, assigned spot ID, and vehicle registration number.',
      'Implement dynamic or tiered Pricing Strategy (e.g., flat first hour + hourly rate + vehicle surcharge).',
      'Process payment at Exit Gate, mark ticket as paid, and free up the allocated spot.',
      'Display real-time available spot counts per floor via an Information Board / Display Board.'
    ],
    constraints: [
      'The parking lot has fixed capacity per floor.',
      'Multiple entry and exit gates operate concurrently (ensure thread-safe spot allocation).',
      'Extensible for future spot types (e.g. handicapped spots) and payment providers (Cash, Credit Card, UPI).'
    ],
    evaluationRubric: [
      {
        key: 'solidPrinciples',
        name: 'SOLID Principles',
        maxScore: 25,
        description: 'Single Responsibility for Spot/Ticket/Gate; Open/Closed for PricingStrategy and Vehicle types; Dependency Inversion in Payment.'
      },
      {
        key: 'classResponsibilities',
        name: 'Class Responsibilities & Modularity',
        maxScore: 25,
        description: 'Clear abstraction between ParkingFloor, ParkingSpot, Vehicle, Ticket, EntryGate, ExitGate, and ParkingLotController.'
      },
      {
        key: 'extensibility',
        name: 'Extensibility & Design Patterns',
        maxScore: 25,
        description: 'Strategy Pattern for spot assignment and fee calculation; Factory Pattern for spot creation; Observer Pattern for display boards.'
      },
      {
        key: 'edgeCases',
        name: 'Edge Cases & Error Handling',
        maxScore: 25,
        description: 'Lot full scenario, invalid ticket handling, vehicle size mismatch, concurrent spot acquisition race conditions.'
      }
    ],
    starterTemplates: {
      typescript: `// TypeScript Starter Template for Parking Lot System

export enum VehicleType {
  MOTORCYCLE = 'MOTORCYCLE',
  CAR = 'CAR',
  TRUCK = 'TRUCK'
}

export enum SpotType {
  SMALL = 'SMALL',
  COMPACT = 'COMPACT',
  LARGE = 'LARGE'
}

export interface Vehicle {
  getLicenseNumber(): string;
  getType(): VehicleType;
}

export class Car implements Vehicle {
  constructor(private licenseNumber: string) {}
  getLicenseNumber(): string { return this.licenseNumber; }
  getType(): VehicleType { return VehicleType.CAR; }
}

export class ParkingSpot {
  private occupiedVehicle: Vehicle | null = null;
  constructor(
    private id: string,
    private floorNumber: number,
    private spotType: SpotType
  ) {}

  public isFree(): boolean {
    return this.occupiedVehicle === null;
  }

  public assignVehicle(vehicle: Vehicle): boolean {
    if (!this.isFree()) return false;
    this.occupiedVehicle = vehicle;
    return true;
  }

  public removeVehicle(): void {
    this.occupiedVehicle = null;
  }
}

// TODO: Implement Ticket, PricingStrategy, EntryGate, ExitGate, and ParkingLot controller
`,
      java: `// Java Starter Template for Parking Lot System
import java.util.*;

enum VehicleType { MOTORCYCLE, CAR, TRUCK }
enum SpotType { SMALL, COMPACT, LARGE }

abstract class Vehicle {
    private String licenseNumber;
    private VehicleType type;
    public Vehicle(String licenseNumber, VehicleType type) {
        this.licenseNumber = licenseNumber;
        this.type = type;
    }
    public String getLicenseNumber() { return licenseNumber; }
    public VehicleType getType() { return type; }
}

class Car extends Vehicle {
    public Car(String licenseNumber) { super(licenseNumber, VehicleType.CAR); }
}

class ParkingSpot {
    private String id;
    private int floorNumber;
    private SpotType spotType;
    private Vehicle vehicle;

    public ParkingSpot(String id, int floorNumber, SpotType spotType) {
        this.id = id;
        this.floorNumber = floorNumber;
        this.spotType = spotType;
    }
    public synchronized boolean isAvailable() { return vehicle == null; }
    public synchronized boolean park(Vehicle v) {
        if (!isAvailable()) return false;
        this.vehicle = v;
        return true;
    }
    public synchronized void vacate() { this.vehicle = null; }
}

// TODO: Implement Ticket, PricingStrategy, Floor, and ParkingLot manager
`,
      python: `# Python Starter Template for Parking Lot System
from enum import Enum
from abc import ABC, abstractmethod
from typing import Optional, List
import datetime

class VehicleType(Enum):
    MOTORCYCLE = 1
    CAR = 2
    TRUCK = 3

class SpotType(Enum):
    SMALL = 1
    COMPACT = 2
    LARGE = 3

class Vehicle(ABC):
    def __init__(self, license_plate: str, vehicle_type: VehicleType):
        self.license_plate = license_plate
        self.vehicle_type = vehicle_type

class Car(Vehicle):
    def __init__(self, license_plate: str):
        super().__init__(license_plate, VehicleType.CAR)

class ParkingSpot:
    def __init__(self, spot_id: str, floor: int, spot_type: SpotType):
        self.spot_id = spot_id
        self.floor = floor
        self.spot_type = spot_type
        self.vehicle: Optional[Vehicle] = None

    def is_free(self) -> bool:
        return self.vehicle is None

    def park(self, vehicle: Vehicle) -> bool:
        if not self.is_free():
            return False
        self.vehicle = vehicle
        return True

    def vacate(self):
        self.vehicle = None

# TODO: Implement Ticket, PricingStrategy, EntryGate, ExitGate, ParkingLot
`
    }
  },
  {
    id: 'prob-elevator-system',
    slug: 'elevator-control-system',
    title: 'Design an Elevator Control System',
    difficulty: 'Hard',
    description: `Design a scalable Low-Level Object-Oriented Design for a multi-car Elevator Control System in a high-rise commercial skyscraper.
The building has N floors and M elevators operating simultaneously.
The system must optimize user wait times, service internal floor button requests (inside elevator cars) as well as external hall calls (up/down directional arrows on floors), and handle real-world operational constraints such as door cycling, capacity limits, and emergency fire alarm overrides.`,
    requirements: [
      'Model multiple Elevators with current floor, target queue, movement state (IDLE, MOVING_UP, MOVING_DOWN), and door status (OPEN, CLOSED).',
      'Distinguish between Internal Requests (destination button inside cabin) and External Hall Calls (pickup floor + desired direction).',
      'Implement an Elevator Dispatching / Scheduling Algorithm (e.g., SCAN, LOOK, or Shortest Seek Time First / Proximity heuristic).',
      'Handle door opening, closing, and automatic safety obstruction sensors.',
      'Support Emergency mode (fire alarm or power outage) where all elevators descend to ground floor and lock open.',
      'Enforce weight and capacity thresholds (prevent car from moving if overloaded).'
    ],
    constraints: [
      'Elevators must move smoothly without arbitrary direction reversal between floors.',
      'External requests must be dispatched concurrently across the elevator fleet to minimize total wait time.',
      'Clean decoupling between the user interface (Buttons/Display), Dispatcher orchestration, and physical Elevator hardware model.'
    ],
    evaluationRubric: [
      {
        key: 'solidPrinciples',
        name: 'SOLID Principles',
        maxScore: 25,
        description: 'Single responsibility separating Request dispatching from Elevator state execution; Open/Closed for pluggable dispatch algorithms.'
      },
      {
        key: 'classResponsibilities',
        name: 'Class Responsibilities & Modularity',
        maxScore: 25,
        description: 'Well-defined Elevator, ElevatorController, Dispatcher, HallCall, InternalRequest, Door, and Floor entities.'
      },
      {
        key: 'extensibility',
        name: 'Extensibility & Design Patterns',
        maxScore: 25,
        description: 'Strategy Pattern for dispatch algorithms (SCAN/LOOK); State Pattern for Elevator motion states; Observer for arrival notifications.'
      },
      {
        key: 'edgeCases',
        name: 'Edge Cases & Error Handling',
        maxScore: 25,
        description: 'Overweight condition, conflicting directional requests, requests at building boundaries (top/bottom floors), emergency shutdowns.'
      }
    ],
    starterTemplates: {
      typescript: `// TypeScript Starter Template for Elevator Control System

export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  IDLE = 'IDLE'
}

export enum ElevatorState {
  IDLE = 'IDLE',
  MOVING_UP = 'MOVING_UP',
  MOVING_DOWN = 'MOVING_DOWN',
  EMERGENCY = 'EMERGENCY'
}

export interface IDispatchStrategy {
  selectElevator(elevators: Elevator[], floor: number, direction: Direction): Elevator | null;
}

export class Elevator {
  private currentFloor: number = 1;
  private state: ElevatorState = ElevatorState.IDLE;
  private targetFloors: Set<number> = new Set();

  constructor(public readonly id: number, private capacityWeight: number) {}

  public getCurrentFloor(): number { return this.currentFloor; }
  public getState(): ElevatorState { return this.state; }

  public addDestination(floor: number): void {
    this.targetFloors.add(floor);
  }

  public step(): void {
    // Process single tick of elevator movement
  }
}

// TODO: Implement Dispatcher, ExternalRequest, InternalRequest, and BuildingElevatorManager
`,
      java: `// Java Starter Template for Elevator Control System
import java.util.*;

enum Direction { UP, DOWN, IDLE }
enum ElevatorStatus { IDLE, MOVING_UP, MOVING_DOWN, EMERGENCY }

class Request {
    int floor;
    Direction direction;
    public Request(int floor, Direction direction) {
        this.floor = floor;
        this.direction = direction;
    }
}

interface DispatchStrategy {
    Elevator selectBestElevator(List<Elevator> elevators, Request request);
}

class Elevator {
    private int id;
    private int currentFloor = 1;
    private ElevatorStatus status = ElevatorStatus.IDLE;
    private TreeSet<Integer> upStops = new TreeSet<>();
    private TreeSet<Integer> downStops = new TreeSet<>(Collections.reverseOrder());

    public Elevator(int id) { this.id = id; }
    public int getCurrentFloor() { return currentFloor; }
    public ElevatorStatus getStatus() { return status; }
}

// TODO: Implement SCAN strategy, ElevatorSystem dispatcher, and Cabin controls
`
    }
  },
  {
    id: 'prob-vending-machine',
    slug: 'vending-machine',
    title: 'Design a Vending Machine',
    difficulty: 'Medium',
    description: `Design a classic Object-Oriented Low-Level Design for an automated Vending Machine using the Gang of Four State Pattern.
The machine dispenses snacks, beverages, and cold drinks.
It accepts various denominations of coins and notes, tracks user inserted balance, validates stock levels, dispenses items upon selection, calculates optimal change, and handles transaction cancellations and refunds.`,
    requirements: [
      'Maintain an Inventory of items organized in slots with code, price, and available count.',
      'Support multiple currency denominations (e.g. 1, 5, 10, 20 coins/notes).',
      'Implement explicit State Transitions: IdleState -> HasMoneyState -> DispensingState -> SoldOutState.',
      'Allow user to insert money, select an item code, request a cancel/refund, and collect change.',
      'Ensure accurate change computation using the machine\'s available coin register.',
      'Handle maintenance mode (inventory restocking, cash collection by admin).'
    ],
    constraints: [
      'State transitions must be encapsulated in State objects rather than long if-else or switch ladders.',
      'If an item is out of stock or balance is insufficient, prevent dispensing and prompt user.',
      'All transactions must be atomic: either product and change are dispensed, or money is completely refunded.'
    ],
    evaluationRubric: [
      {
        key: 'solidPrinciples',
        name: 'SOLID Principles',
        maxScore: 25,
        description: 'Single Responsibility for State, Inventory, and Payment; Open/Closed for new product types or payment methods.'
      },
      {
        key: 'classResponsibilities',
        name: 'Class Responsibilities & Modularity',
        maxScore: 25,
        description: 'Clean segregation between VendingMachine context, State interface/classes, Inventory, Item, and CashRegister.'
      },
      {
        key: 'extensibility',
        name: 'Extensibility & Design Patterns',
        maxScore: 25,
        description: 'Exemplary usage of State Pattern for machine states; Strategy Pattern for change calculation algorithms.'
      },
      {
        key: 'edgeCases',
        name: 'Edge Cases & Error Handling',
        maxScore: 25,
        description: 'Exact change unavailable, out of stock selection, premature cancel after insertion, concurrent insert operations.'
      }
    ],
    starterTemplates: {
      typescript: `// TypeScript Starter Template for Vending Machine

export interface Item {
  code: string;
  name: string;
  price: number;
}

export interface IVendingMachineState {
  insertMoney(amount: number): void;
  selectProduct(code: string): void;
  dispense(): void;
  cancel(): void;
}

export class VendingMachine {
  private currentState: IVendingMachineState;
  private balance: number = 0;
  private inventory: Map<string, { item: Item; count: number }> = new Map();

  constructor() {
    // Initial state: IdleState
  }

  public setState(state: IVendingMachineState): void {
    this.currentState = state;
  }

  public getBalance(): number { return this.balance; }
  public addBalance(amount: number): void { this.balance += amount; }
  public resetBalance(): void { this.balance = 0; }
}

// TODO: Implement IdleState, HasMoneyState, DispenseState, SoldOutState, and CashRegister
`,
      java: `// Java Starter Template for Vending Machine
import java.util.*;

interface VendingMachineState {
    void insertCoin(int amount);
    void selectItem(String code);
    void dispense();
    void refund();
}

class Product {
    private String code;
    private String name;
    private int price;
    public Product(String code, String name, int price) {
        this.code = code;
        this.name = name;
        this.price = price;
    }
    public int getPrice() { return price; }
    public String getName() { return name; }
}

class VendingMachine {
    private VendingMachineState state;
    private int currentBalance = 0;
    private Map<String, Product> inventory = new HashMap<>();

    public void setState(VendingMachineState state) { this.state = state; }
}

// TODO: Implement State pattern concrete classes (IdleState, HasMoneyState, DispenseState)
`
    }
  }
];

export function seedDatabase(): void {
  const db = getDatabase();
  const repo = new SqliteProblemRepository(db);

  console.log('Seeding LLD problems into database...');
  for (const problem of seededProblems) {
    repo.save(problem);
    console.log(`- Seeded problem: "${problem.title}" (${problem.slug})`);
  }
  console.log('Successfully seeded all 3 LLD problems!');
}

// Execute if run directly
if (process.argv[1]?.endsWith('seedProblems.ts') || process.argv[1]?.endsWith('seedProblems.js')) {
  seedDatabase();
}
