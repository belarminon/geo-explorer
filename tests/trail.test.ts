import { describe, expect, it } from 'vitest';
import { getTrail, getTrails } from '../src/commands/trail.js';

describe('trails', () => {
  it('lists available trails and resolves technology ids case-insensitively', () => {
    expect(getTrails().map((trail) => trail.id)).toEqual(['dotnet', 'python']);
    expect(getTrail('DOTNET')?.name).toBe('.NET / C#');
    expect(getTrail('missing')).toBeNull();
  });
});