import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
// @ts-ignore Node.js typings are not enabled in this project.
import process from 'node:process';
// @ts-ignore Node.js typings are not enabled in this project.
import { pathToFileURL } from 'node:url';
// @ts-ignore Node.js typings are not enabled in this project.
import { resolve } from 'node:path';
import { generateCertificate } from '../commands/certificate.js';
import { generateChallenge } from '../commands/challenge.js';
import { getTrailProgress, markChallengeCompleted } from '../commands/progress.js';
import { getTrail, getTrails } from '../commands/trail.js';

declare const process: { argv: string[]; exitCode?: number };

function toTextResult(value: unknown) {
  return {
    content: [{
      type: 'text' as const,
      text: typeof value === 'string' ? value : JSON.stringify(value, null, 2)
    }]
  };
}

async function handleToolCall(operation: () => unknown | Promise<unknown>) {
  try {
    return toTextResult(await operation());
  } catch (error) {
    return {
      ...toTextResult(error instanceof Error ? error.message : String(error)),
      isError: true
    };
  }
}

export function createGeoExplorerMcpServer(progressPath?: string): McpServer {
  const server = new McpServer({
    name: 'geo-explorer',
    version: '1.0.0'
  });

  server.registerResource(
    'trilhas-de-aprendizagem',
    'geo-explorer://trails',
    {
      description: 'Base fictícia de trilhas, níveis, módulos e desafios do Geo-Explorer.',
      mimeType: 'application/json'
    },
    async (uri) => ({
      contents: [{
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify({ technologies: getTrails() }, null, 2)
      }]
    })
  );

  server.registerTool(
    'list_trails',
    { description: 'Lista todas as trilhas de aprendizagem disponíveis.' },
    () => handleToolCall(() => getTrails())
  );

  server.registerTool(
    'get_trail',
    {
      description: 'Consulta uma trilha pelo identificador da tecnologia.',
      inputSchema: { technology: z.string().min(1) }
    },
    ({ technology }) => handleToolCall(() => {
      const trail = getTrail(technology);
      if (!trail) throw new Error(`Trilha '${technology}' não encontrada.`);
      return trail;
    })
  );

  server.registerTool(
    'generate_challenge',
    {
      description: 'Gera o desafio de código de uma tecnologia e nível.',
      inputSchema: {
        technology: z.string().min(1),
        level: z.string().min(1)
      }
    },
    ({ technology, level }) => handleToolCall(() => generateChallenge(technology, level))
  );

  server.registerTool(
    'complete_challenge',
    {
      description: 'Registra localmente a conclusão de um nível da trilha.',
      inputSchema: {
        technology: z.string().min(1),
        level: z.string().min(1)
      }
    },
    ({ technology, level }) => handleToolCall(() => {
      markChallengeCompleted(technology, level, progressPath);
      return getTrailProgress(technology, progressPath);
    })
  );

  server.registerTool(
    'get_progress',
    {
      description: 'Consulta os níveis concluídos e pendentes de uma trilha.',
      inputSchema: { technology: z.string().min(1) }
    },
    ({ technology }) => handleToolCall(() => getTrailProgress(technology, progressPath))
  );

  server.registerTool(
    'generate_certificate',
    {
      description: 'Emite um certificado fictício após a conclusão de todos os níveis.',
      inputSchema: {
        username: z.string().trim().min(1),
        technology: z.string().min(1)
      }
    },
    ({ username, technology }) => handleToolCall(() =>
      generateCertificate(username, technology, progressPath)
    )
  );

  return server;
}

export async function runMcpServer(): Promise<void> {
  const server = createGeoExplorerMcpServer();
  await server.connect(new StdioServerTransport());
}

const executedFile = process.argv[1];
if (executedFile && pathToFileURL(resolve(executedFile)).href === import.meta.url) {
  try {
    await runMcpServer();
  } catch (error) {
    console.error('Falha ao iniciar o servidor MCP Geo-Explorer:', error);
    process.exitCode = 1;
  }
}