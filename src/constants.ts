import { User, UserRole, StoreArea, SparePart } from './types';

export const USERS: User[] = [
  { id: 'u1', name: 'Admin', role: UserRole.ADMIN, canApprove: true, password: '123' },
  { id: 'u2', name: 'KraiwitN', role: UserRole.APPROVER, canApprove: true, password: '123' },
  { id: 'u3', name: 'SaicholS', role: UserRole.OPERATOR, canApprove: false, password: '123' },
  { id: 'u4', name: 'PraliwatS', role: UserRole.OPERATOR, canApprove: false, password: '123' },
  { id: 'u5', name: 'ChatchaiC', role: UserRole.OPERATOR, canApprove: false, password: '123' },
  { id: 'u6', name: 'DangS', role: UserRole.OPERATOR, canApprove: false, password: '123' },
];

export const STORE_LAYOUT: StoreArea[] = [
  { id: 'A1', name: 'Positioner', row: 1, col: 1 },
  { id: 'A2', name: 'Solenoid', row: 1, col: 2 },
  { id: 'B1', name: 'Pressure Gauge', row: 2, col: 1 },
  { id: 'B2', name: 'Valve part', row: 2, col: 2 },
  { id: 'C1', name: 'Accessories', row: 3, col: 1 },
  { id: 'C2', name: 'Transmitter', row: 3, col: 2 },
];

export const MOCK_PARTS: SparePart[] = [
  {
    id: 'P001',
    name: 'Electro-Pneumatic Positioner',
    model: 'EP-1000-Smart',
    spec: '4-20mA Input, Double Acting, Explosion Proof',
    area: 'A1', // Positioner
    quantity: 5,
    minLevel: 2,
    imageUrl: 'https://picsum.photos/200/200?random=101',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'P002',
    name: 'Solenoid Valve 24VDC',
    model: 'SV-3/2-WAY',
    spec: '3/2 Way, 1/4" NPT, Brass Body',
    area: 'A2', // Solenoid
    quantity: 15,
    minLevel: 8,
    imageUrl: 'https://picsum.photos/200/200?random=102',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'P003',
    name: 'WIKA Pressure Gauge',
    model: '232.50.100',
    spec: '0-10 Bar, 1/2" NPT Bottom, SS316L',
    area: 'B1', // Pressure Gauge
    quantity: 8,
    minLevel: 3,
    imageUrl: 'https://picsum.photos/200/200?random=103',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'P004',
    name: 'Globe Valve Seat Ring',
    model: 'SR-DN50-Cl600',
    spec: 'Stellite 6 Overlay, For 2" Valve',
    area: 'B2', // Valve part
    quantity: 4,
    minLevel: 2,
    imageUrl: 'https://picsum.photos/200/200?random=104',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'P005',
    name: 'Air Filter Regulator',
    model: 'AFR-2000',
    spec: 'Includes Gauge and Mounting Bracket',
    area: 'C1', // Accessories
    quantity: 20,
    minLevel: 5,
    imageUrl: 'https://picsum.photos/200/200?random=105',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'P006',
    name: 'Pressure Transmitter',
    model: 'PT-3051-CD',
    spec: 'Differential Pressure, HART Protocol',
    area: 'C2', // Transmitter
    quantity: 3,
    minLevel: 2,
    imageUrl: 'https://picsum.photos/200/200?random=106',
    lastUpdated: new Date().toISOString()
  }
];