import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createGeoExplorerMcpServer } from '../src/mcp/server.js';

const testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'geo-explorer-mcp-'));
const progressPath = path.join(testDirectory, 'progress.json');

afterAll(() => fs.rmSync(testDirectory, { recursive: true, force: true }));

beforeEach(() => {
  if (fs.existsSync(progressPath)) fs.unlinkSync(progressPath);
});

async function withMcpClient<T>(run: (client: Client) => Promise<T>): Promise<T> {
  const server = createGeoExplorerMcpServer(progressPath);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'geo-explorer-test-client', version: '1.0.0' });

  await server.connect(serverTransport);
  await client.connect(clientTransport);

  try {
    return await run(client);
  } finally {
    await Promise.all([client.close(), server.close()]);
  }
}

function resultText(result: { content: Array<{ type: string; text?: string }> }): string {
  const text = result.content.find((item) => item.type === 'text')?.text;
  if (text === undefined) throw new Error('A resposta MCP não contém texto.');
  return text;
}

describe('Geo-Explorer MCP server', () => {
  it('exposes trail resource and tools for the learning commands', async () => {
    await withMcpClient(async (client) => {
      const tools = await client.listTools();
      expect(tools.tools.map((tool) => tool.name)).toEqual([
        'list_trails',
        'get_trail',
        'generate_challenge',
        'complete_challenge',
        'get_progress',
        'generate_certificate'
      ]);

      const resources = await client.listResources();
      expect(resources.resources.map((resource) => resource.uri)).toContain('geo-explorer://trails');
      const trailData = await client.readResource({ uri: 'geo-explorer://trails' });
      expect(trailData.contents[0]?.text).toContain('.NET / C#');

      const challenge = await client.callTool({
        name: 'generate_challenge',
        arguments: { technology: 'dotnet', level: 'iniciante' }
      });
      expect(resultText(challenge)).toContain('Crie uma API RESTful');
    });
  });

  it('tracks completions, issues a certificate, and reports invalid tool input', async () => {
    await withMcpClient(async (client) => {
      const blocked = await client.callTool({
        name: 'generate_certificate',
        arguments: { username: 'Ada', technology: 'python' }
      });
      expect(blocked.isError).toBe(true);
      expect(resultText(blocked)).toContain('Trilha incompleta.');

      for (const level of ['iniciante', 'intermediario', 'avancado']) {
        const completion = await client.callTool({
          name: 'complete_challenge',
          arguments: { technology: 'python', level }
        });
        expect(completion.isError).not.toBe(true);
      }

      const certificate = await client.callTool({
        name: 'generate_certificate',
        arguments: { username: 'Ada Lovelace', technology: 'python' }
      });
      expect(certificate.isError).not.toBe(true);
      expect(JSON.parse(resultText(certificate))).toMatchObject({
        username: 'Ada Lovelace',
        technologyId: 'python'
      });

      const invalidChallenge = await client.callTool({
        name: 'generate_challenge',
        arguments: { technology: 'unknown', level: 'iniciante' }
      });
      expect(invalidChallenge.isError).toBe(true);
      expect(resultText(invalidChallenge)).toContain("Tecnologia 'unknown' não encontrada");
    });
  });
});
