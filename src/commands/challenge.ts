import { getTrail } from './trail.js';

export function generateChallenge(techId: string, level: string): string {
  const trail = getTrail(techId);

  if (!trail) {
    throw new Error(`Tecnologia '${techId}' não encontrada na base de dados.`);
  }

  const normalizedLevel = level.toLowerCase();
  const challenge = trail.challenges[normalizedLevel];

  if (!challenge) {
    throw new Error(`Nível '${level}' inválido. Níveis disponíveis: ${trail.levels.join(', ')}`);
  }

  return `[DESAFIO - ${trail.name.toUpperCase()} (${level.toUpperCase()})]\n${challenge}`;
}