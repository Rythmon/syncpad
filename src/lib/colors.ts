export interface CollaboratorProfile {
  name: string;
  role: string;
  color: string;
}

export const COLLABORATOR_PALETTE = [
  '#6366f1', // Indigo
  '#0284c7', // Sky
  '#059669', // Emerald
  '#d97706', // Amber
  '#e11d48', // Rose
  '#7c3aed', // Violet
  '#0891b2', // Cyan
  '#ea580c', // Orange
  '#4f46e5', // Deep Indigo
  '#2563eb', // Blue
];

// Alias for backwards compatibility
export const COLLABORATOR_COLORS = COLLABORATOR_PALETTE;

export const MOCK_COLLABORATORS: CollaboratorProfile[] = [
  { name: 'Marcus Vance', role: 'Staff Distributed Systems Engineer', color: '#6366f1' },
  { name: 'Elena Rostova', role: 'Principal Architect', color: '#059669' },
  { name: 'David Chen', role: 'Frontend Infrastructure Lead', color: '#0284c7' },
  { name: 'Sarah Lin', role: 'Product Designer', color: '#e11d48' },
  { name: 'Maya Patel', role: 'Real-Time Protocols Engineer', color: '#7c3aed' },
  { name: 'Julian Hayes', role: 'Site Reliability Engineer', color: '#d97706' },
  { name: 'Chloe Zhang', role: 'Engineering Manager', color: '#0891b2' },
  { name: 'Liam O’Connor', role: 'Database Systems Specialist', color: '#ea580c' },
];

export const COLLABORATOR_NAMES = MOCK_COLLABORATORS.map((c) => c.name);

export function getRandomColor(): string {
  return COLLABORATOR_PALETTE[Math.floor(Math.random() * COLLABORATOR_PALETTE.length)];
}

export function getRandomProfile(): CollaboratorProfile {
  return MOCK_COLLABORATORS[Math.floor(Math.random() * MOCK_COLLABORATORS.length)];
}

export function getRandomName(): string {
  return getRandomProfile().name;
}
