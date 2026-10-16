// @ts-ignore Node.js typings are not enabled in this project.
import { createInterface } from 'node:readline/promises';
import { getTrail } from './commands/trail.js';
import { generateChallenge } from './commands/challenge.js';
import { generateCertificate } from './commands/certificate.js';
import { exportCertificate, type CertificateFormat } from './commands/certificate-export.js';
import { getTrailProgress, markChallengeCompleted } from './commands/progress.js';

declare const process: { argv: string[]; stdin: any; stdout: any; exitCode?: number };

const colors = {
  cyan: '\u001b[36m',
  green: '\u001b[32m',
  yellow: '\u001b[33m',
  red: '\u001b[31m',
  reset: '\u001b[0m'
};

function color(value: string, tone: keyof typeof colors): string {
  return `${colors[tone]}${value}${colors.reset}`;
}

function showHelp(): void {
  console.log(`
🌍 Geo-Explorer CLI

Uso:
  npm start                                      Abre o menu interativo
  npm start -- trail <tecnologia>
  npm start -- challenge <tecnologia> <nível>
  npm start -- complete <tecnologia> <nível>
  npm start -- progress <tecnologia>
  npm start -- certificate <usuário> <tecnologia> [html|pdf] [arquivo]

Exemplos:
  npm start -- trail dotnet
  npm start -- challenge dotnet iniciante
  npm start -- complete dotnet iniciante
  npm start -- certificate "Seu Nome" dotnet pdf
`);
}

function printCertificate(username: string, tech: string, format: CertificateFormat, outputPath?: string): void {
  const certificate = generateCertificate(username, tech);
  const filePath = exportCertificate(certificate, format, outputPath);
  console.log(`\n${color('Certificado emitido e verificado com SHA-256.', 'green')}`);
  console.log(` ID: ${certificate.id}`);
  console.log(` Aluno(a): ${certificate.username}`);
  console.log(` Trilha: ${certificate.technology}`);
  console.log(` Data: ${certificate.issuedAt}`);
  console.log(` Código de verificação: ${certificate.verificationCode}`);
  console.log(` Hash SHA-256: ${certificate.hashValidation}`);
  console.log(` Arquivo ${format.toUpperCase()}: ${filePath}\n`);
  if (format === 'html') console.log('Dica: abra o HTML no navegador e escolha Imprimir > Salvar como PDF.');
}

type InteractiveAsk = (question: string) => Promise<string>;

async function exploreTrail(ask: InteractiveAsk): Promise<void> {
  const tech = await ask('Tecnologia (dotnet/python): ');
  const trail = getTrail(tech);
  if (!trail) throw new Error(`Trilha '${tech}' não encontrada.`);
  console.log(`\n📚 ${trail.name}\nNíveis: ${trail.levels.join(', ')}\nMódulos:\n - ${trail.modules.join('\n - ')}\n`);
}

async function showChallenge(ask: InteractiveAsk): Promise<void> {
  const tech = await ask('Tecnologia: ');
  const level = await ask('Nível: ');
  console.log(`\n🎯 ${generateChallenge(tech, level)}\n`);
}

async function completeChallenge(ask: InteractiveAsk): Promise<void> {
  const tech = await ask('Tecnologia: ');
  const level = await ask('Nível concluído: ');
  markChallengeCompleted(tech, level);
  console.log(color('Conclusão registrada no progresso local.', 'green'));
}

async function showProgress(ask: InteractiveAsk): Promise<void> {
  const tech = await ask('Tecnologia: ');
  const progress = getTrailProgress(tech);
  console.log(`\nConcluídos: ${progress.completed.join(', ') || 'nenhum'}`);
  console.log(`Pendentes: ${progress.remaining.join(', ') || 'nenhum'}\n`);
}

async function issueInteractiveCertificate(ask: InteractiveAsk): Promise<void> {
  const username = await ask('Nome do(a) aluno(a): ');
  const tech = await ask('Tecnologia: ');
  const selectedFormat = (await ask('Formato (html/pdf, padrão html): ')).toLowerCase() || 'html';
  if (selectedFormat !== 'html' && selectedFormat !== 'pdf') {
    throw new Error('Formato inválido. Escolha html ou pdf.');
  }
  printCertificate(username, tech, selectedFormat);
}

async function handleInteractiveChoice(choice: string, ask: InteractiveAsk): Promise<boolean> {
  switch (choice) {
    case '0': return false;
    case '1': await exploreTrail(ask); break;
    case '2': await showChallenge(ask); break;
    case '3': await completeChallenge(ask); break;
    case '4': await showProgress(ask); break;
    case '5': await issueInteractiveCertificate(ask); break;
    default: console.log(color('Opção inválida.', 'yellow'));
  }
  return true;
}

function showInteractiveMenu(): void {
  console.log(color('1.', 'cyan'), 'Explorar trilha');
  console.log(color('2.', 'cyan'), 'Ver desafio');
  console.log(color('3.', 'cyan'), 'Registrar desafio concluído');
  console.log(color('4.', 'cyan'), 'Ver progresso');
  console.log(color('5.', 'cyan'), 'Emitir certificado HTML/PDF');
  console.log(color('0.', 'cyan'), 'Sair');
}

async function runInteractive(): Promise<void> {
  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  const ask: InteractiveAsk = async (question) => (await terminal.question(question)).trim();
  try {
    console.log(color('\n🌍 Geo-Explorer | trilhas, desafios e certificados\n', 'cyan'));
    while (true) {
      showInteractiveMenu();
      const choice = await ask('\nEscolha uma opção: ');
      try {
        if (!(await handleInteractiveChoice(choice, ask))) break;
      } catch (error) {
        console.log(color(`Erro: ${error instanceof Error ? error.message : String(error)}`, 'red'));
      }
      console.log('');
    }
  } finally {
    terminal.close();
  }
}

function handleTrail(args: string[]): void {
  const tech = args[1];
  if (!tech) throw new Error('Informe a tecnologia.');
  const trail = getTrail(tech);
  if (!trail) throw new Error('Trilha não encontrada.');
  console.log(`\n📚 Trilha: ${trail.name}`);
  console.log(`Níveis: ${trail.levels.join(', ')}`);
  console.log(`Módulos:\n - ${trail.modules.join('\n - ')}\n`);
}

function handleChallenge(args: string[]): void {
  if (!args[1] || !args[2]) throw new Error('Informe a tecnologia e o nível.');
  console.log(`\n🎯 ${generateChallenge(args[1], args[2])}\n`);
}

function handleComplete(args: string[]): void {
  if (!args[1] || !args[2]) throw new Error('Informe a tecnologia e o nível concluído.');
  markChallengeCompleted(args[1], args[2]);
  console.log(color('Conclusão registrada no progresso local.', 'green'));
}

function handleProgress(args: string[]): void {
  if (!args[1]) throw new Error('Informe a tecnologia.');
  const progress = getTrailProgress(args[1]);
  console.log(`Concluídos: ${progress.completed.join(', ') || 'nenhum'}`);
  console.log(`Pendentes: ${progress.remaining.join(', ') || 'nenhum'}`);
}

function handleCertificate(args: string[]): void {
  if (!args[1] || !args[2]) throw new Error('Informe o nome do usuário e a tecnologia.');
  const format = (args[3] ?? 'html').toLowerCase();
  if (format !== 'html' && format !== 'pdf') throw new Error('Formato inválido. Escolha html ou pdf.');
  printCertificate(args[1], args[2], format, args[4]);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0]?.toLowerCase();
  if (!command) {
    await runInteractive();
    return;
  }

  const handlers: Record<string, () => void> = {
    help: showHelp,
    '--help': showHelp,
    '-h': showHelp,
    trail: () => handleTrail(args),
    challenge: () => handleChallenge(args),
    complete: () => handleComplete(args),
    progress: () => handleProgress(args),
    certificate: () => handleCertificate(args)
  };

  try {
    (handlers[command] ?? showHelp)();
  } catch (error) {
    console.error(color(`Erro: ${error instanceof Error ? error.message : String(error)}`, 'red'));
    process.exitCode = 1;
  }
}

await main();
