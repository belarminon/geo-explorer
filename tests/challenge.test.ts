// @ts-ignore Node.js typings are not enabled in this project.
import fs from 'node:fs';
// @ts-ignore Node.js typings are not enabled in this project.
import os from 'node:os';
// @ts-ignore Node.js typings are not enabled in this project.
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { generateChallenge } from '../src/commands/challenge.js';
import { getTrailProgress, markChallengeCompleted, readProgress } from '../src/commands/progress.js';

const testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'geo-explorer-progress-'));
const progressPath = path.join(testDirectory, 'progress.json');

afterAll(() => fs.rmSync(testDirectory, { recursive: true, force: true }));

describe('challenge and progress', () => {
  it('generates a challenge and persists validated completions between reads', () => {
    expect(generateChallenge('dotnet', 'iniciante')).toContain('Crie uma API RESTful');
    expect(() => markChallengeCompleted('dotnet', 'expert', progressPath))
      .toThrow("Nível 'expert' inválido.");

    markChallengeCompleted('dotnet', 'iniciante', progressPath);
    expect(readProgress(progressPath).dotnet?.iniciante).toBeTruthy();
    expect(getTrailProgress('dotnet', progressPath)).toEqual({
      completed: ['iniciante'],
      remaining: ['intermediario', 'avancado'],
      isComplete: false
    });
  });

  it('reports corrupt progress data instead of silently resetting it', () => {
    fs.writeFileSync(progressPath, '{invalid json', 'utf-8');
    expect(() => readProgress(progressPath)).toThrow();
  });
});