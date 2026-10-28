export const COLLABORATOR_COLORS = [
  '#f43f5e', // rose-500
  '#06b6d4', // cyan-500
  '#10b981', // emerald-500
  '#8b5cf6', // violet-500
  '#f59e0b', // amber-500
  '#ec4899', // pink-500
  '#3b82f6', // blue-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
  '#6366f1', // indigo-500
];

export const COLLABORATOR_NAMES = [
  'Alex Chen',
  'Jordan Lee',
  'Taylor Swift',
  'Morgan Rivera',
  'Casey Novak',
  'Riley Vance',
  'Avery Wright',
  'Quinn Brooks',
  'Devon Patel',
  'Samira Khan',
];

export function getRandomColor(): string {
  return COLLABORATOR_COLORS[Math.floor(Math.random() * COLLABORATOR_COLORS.length)];
}

export function getRandomName(): string {
  return COLLABORATOR_NAMES[Math.floor(Math.random() * COLLABORATOR_NAMES.length)];
}
