// @ts-ignore Node.js typings are not enabled in this project.
import fs from 'node:fs';
// @ts-ignore Node.js typings are not enabled in this project.
import os from 'node:os';
// @ts-ignore Node.js typings are not enabled in this project.
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { generateCertificate, verifyCertificate } from '../src/commands/certificate.js';
import { exportCertificate, renderCertificateHtml } from '../src/commands/certificate-export.js';
import { markChallengeCompleted } from '../src/commands/progress.js';

const testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'geo-explorer-certificate-'));
const progressPath = path.join(testDirectory, 'progress.json');

afterAll(() => fs.rmSync(testDirectory, { recursive: true, force: true }));

describe('certificate', () => {
  it('requires every challenge and generates a verifiable SHA-256 code', () => {
    expect(() => generateCertificate('Ada', 'dotnet', progressPath))
      .toThrow('Trilha incompleta. Conclua os desafios: iniciante, intermediario, avancado.');

    for (const level of ['iniciante', 'intermediario', 'avancado']) {
      markChallengeCompleted('dotnet', level, progressPath);
    }
    const certificate = generateCertificate('<Ada & Grace>', 'dotnet', progressPath);
    expect(certificate.hashValidation).toMatch(/^[a-f0-9]{64}$/);
    expect(certificate.verificationCode).toBe(`GEO-${certificate.hashValidation.slice(0, 12).toUpperCase()}`);
    expect(verifyCertificate(certificate)).toBe(true);
    expect(verifyCertificate({ ...certificate, username: 'Mallory' })).toBe(false);
    expect(renderCertificateHtml(certificate)).toContain('&lt;Ada &amp; Grace&gt;');
  });

  it('exports a printable HTML document and a valid PDF file', () => {
    for (const level of ['iniciante', 'intermediario', 'avancado']) {
      markChallengeCompleted('python', level, progressPath);
    }
    const certificate = generateCertificate('Ada Lovelace', 'python', progressPath);
    const htmlPath = exportCertificate(certificate, 'html', path.join(testDirectory, 'certificate.html'));
    const pdfPath = exportCertificate(certificate, 'pdf', path.join(testDirectory, 'certificate.pdf'));

    expect(fs.readFileSync(htmlPath, 'utf-8')).toContain('window.print()');
    expect(fs.readFileSync(pdfPath, 'ascii').slice(0, 8)).toBe('%PDF-1.4');
    expect(() => exportCertificate({ ...certificate, hashValidation: 'invalid' }, 'html'))
      .toThrow('Certificado inválido: o hash SHA-256 não confere.');
  });
});