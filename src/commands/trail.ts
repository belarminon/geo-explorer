// @ts-ignore Node.js type declarations are not installed.
import fs from 'node:fs';
// @ts-ignore Node.js type declarations are not installed.
import path from 'node:path';

export interface TechTrail {
  id: string;
  name: string;
  levels: string[];
  modules: string[];
  challenges: Record<string, string>;
}

export function getTrails(): TechTrail[] {
  const dataPath = path.resolve('data/trails.json');
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const parsed = JSON.parse(rawData) as { technologies: TechTrail[] };
  return parsed.technologies;
}

export function getTrail(techId: string): TechTrail | null {
  const trail = getTrails().find((t) => t.id.toLowerCase() === techId.toLowerCase());
  return trail || null;
}