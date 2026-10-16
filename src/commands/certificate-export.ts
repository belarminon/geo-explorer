// @ts-ignore Node.js typings are not enabled in this project.
import fs from 'node:fs';
// @ts-ignore Node.js typings are not enabled in this project.
import path from 'node:path';
// @ts-ignore Node.js typings are not enabled in this project.
import { Buffer } from 'node:buffer';
import type { Certificate } from './certificate.js';
import { verifyCertificate } from './certificate.js';

export type CertificateFormat = 'html' | 'pdf';

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character] ?? character);
}

export function renderCertificateHtml(certificate: Certificate): string {
  if (!verifyCertificate(certificate)) throw new Error('Certificado inválido: o hash SHA-256 não confere.');
  const date = new Date(certificate.issuedAt).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Certificado ${escapeHtml(certificate.id)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 32px; background: #eef3f8; color: #17324d; font-family: Georgia, serif; }
    .certificate { max-width: 1000px; min-height: 680px; margin: auto; padding: 64px; border: 12px double #178b83; background: #fff; text-align: center; display: flex; flex-direction: column; justify-content: center; }
    .brand { color: #178b83; font: 700 16px Arial, sans-serif; letter-spacing: .24em; text-transform: uppercase; }
    h1 { margin: 36px 0 8px; font-size: 46px; }
    .subtitle { font: 18px Arial, sans-serif; }
    .name { margin: 24px 0; color: #178b83; font-size: 38px; }
    .trail { font-size: 25px; }
    .details { margin-top: 52px; font: 13px/1.8 Arial, sans-serif; color: #526579; overflow-wrap: anywhere; }
    button { margin: 24px auto; padding: 12px 20px; border: 0; border-radius: 6px; background: #17324d; color: white; font-size: 15px; cursor: pointer; }
    @media print { body { padding: 0; background: white; } .certificate { min-height: 100vh; } button { display: none; } }
  </style>
</head>
<body>
  <main class="certificate">
    <div class="brand">Geo-Explorer</div>
    <h1>Certificado de Conclusão</h1>
    <p class="subtitle">Certificamos que</p>
    <div class="name">${escapeHtml(certificate.username)}</div>
    <p class="subtitle">concluiu todos os desafios da trilha</p>
    <div class="trail">${escapeHtml(certificate.technology)}</div>
    <div class="details">
      Emitido em ${escapeHtml(date)} · ${escapeHtml(certificate.id)}<br>
      Código de verificação: ${escapeHtml(certificate.verificationCode)}<br>
      SHA-256: ${escapeHtml(certificate.hashValidation)}
    </div>
    <button onclick="window.print()">Imprimir / Salvar como PDF</button>
  </main>
</body>
</html>
`;
}

function pdfText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7e]/g, '?')
    .replace(/([\\()])/g, '\\$1');
}

function createCertificatePdf(certificate: Certificate): Uint8Array {
  const date = new Date(certificate.issuedAt).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  const textLines = [
    ['Geo-Explorer', 24, 485],
    ['CERTIFICADO DE CONCLUSAO', 24, 420],
    ['Certificamos que', 14, 370],
    [certificate.username, 28, 320],
    ['concluiu todos os desafios da trilha', 14, 275],
    [certificate.technology, 22, 235],
    [`Emitido em ${date} - ${certificate.id}`, 11, 150],
    [`Codigo: ${certificate.verificationCode}`, 11, 128],
    [`SHA-256: ${certificate.hashValidation}`, 9, 105]
  ] as const;

  const commands = [
    '0.09 0.55 0.51 RG 8 w 35 35 525 772 re S',
    '0.09 0.55 0.51 rg'
  ];
  for (const [text, size, y] of textLines) {
    const font = size >= 22 ? 'F2' : 'F1';
    const x = Math.round((595 - text.length * size * 0.52) / 2);
    commands.push(`BT /${font} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${pdfText(text)}) Tj ET`);
  }
  const stream = commands.join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    `<< /Length ${Buffer.byteLength(stream, 'ascii')} >>\nstream\n${stream}\nendstream`
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (let index = 0; index < objects.length; index++) {
    offsets.push(Buffer.byteLength(pdf, 'ascii'));
    pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf, 'ascii');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, 'ascii');
}

export function exportCertificate(
  certificate: Certificate,
  format: CertificateFormat = 'html',
  outputPath?: string
): string {
  if (!verifyCertificate(certificate)) throw new Error('Certificado inválido: o hash SHA-256 não confere.');
  const extension = format === 'html' ? 'html' : 'pdf';
  const destination = path.resolve(outputPath ?? path.join('certificates', `${certificate.id}.${extension}`));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  if (format === 'html') fs.writeFileSync(destination, renderCertificateHtml(certificate), 'utf-8');
  else fs.writeFileSync(destination, createCertificatePdf(certificate));
  return destination;
}
