// @ts-ignore Node.js typings are not enabled in this project.
import fs from 'node:fs';
// @ts-ignore Node.js typings are not enabled in this project.
import path from 'node:path';
import { getTrail } from './trail.js';

export type Progress = Record<string, Record<string, string>>;

function getProgressPath(filePath?: string): string {
  return filePath ?? path.resolve('.geo-explorer', 'progress.json');
}

export function readProgress(filePath?: string): Progress {
  const resolvedPath = getProgressPath(filePath);
  if (!fs.existsSync(resolvedPath)) return {};

  const parsed: unknown = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error(`Arquivo de progresso inválido: ${resolvedPath}`);
  }

  const progress: Progress = {};
  for (const [technology, levels] of Object.entries(parsed)) {
    if (
      technology === '__proto__' ||
      typeof levels !== 'object' ||
      levels === null ||
      Array.isArray(levels)
    ) {
      throw new Error(`Arquivo de progresso inválido: ${resolvedPath}`);
    }
    const completedLevels: Record<string, string> = {};
    for (const [level, completedAt] of Object.entries(levels)) {
      if (typeof completedAt !== 'string') {
        throw new Error(`Arquivo de progresso inválido: ${resolvedPath}`);
      }
      completedLevels[level] = completedAt;
    }
    progress[technology] = completedLevels;
  }
  return progress;
}

export function markChallengeCompleted(techId: string, level: string, filePath?: string): Progress {
  const trail = getTrail(techId);
  if (!trail) throw new Error(`Tecnologia '${techId}' não encontrada.`);

  const normalizedLevel = level.toLowerCase();
  if (!trail.levels.includes(normalizedLevel)) {
    throw new Error(`Nível '${level}' inválido. Níveis disponíveis: ${trail.levels.join(', ')}`);
  }

  const resolvedPath = getProgressPath(filePath);
  const progress = readProgress(resolvedPath);
  const technologyProgress = progress[trail.id] ?? {};
  technologyProgress[normalizedLevel] = new Date().toISOString();
  progress[trail.id] = technologyProgress;
  fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
  fs.writeFileSync(resolvedPath, `${JSON.stringify(progress, null, 2)}\n`, 'utf-8');
  return progress;
}

export function getTrailProgress(techId: string, filePath?: string): {
  completed: string[];
  remaining: string[];
  isComplete: boolean;
} {
  const trail = getTrail(techId);
  if (!trail) throw new Error(`Tecnologia '${techId}' não encontrada.`);

  const progress = readProgress(filePath);
  const completed = trail.levels.filter((level) => Boolean(progress[trail.id]?.[level]));
  const remaining = trail.levels.filter((level) => !completed.includes(level));
  return { completed, remaining, isComplete: remaining.length === 0 };
}
