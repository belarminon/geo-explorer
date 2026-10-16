// @ts-ignore Node.js typings may not be installed in the project.
import crypto from 'node:crypto';
// @ts-ignore Node.js typings are not enabled in this project.
import { Buffer } from 'node:buffer';
import { getTrail } from './trail.js';
import { getTrailProgress } from './progress.js';

export interface Certificate {
  id: string;
  username: string;
  technologyId: string;
  technology: string;
  issuedAt: string;
  verificationCode: string;
  hashValidation: string;
}

export function generateCertificate(username: string, techId: string, progressPath?: string): Certificate {
  const trail = getTrail(techId);

  if (!trail) {
    throw new Error(`Tecnologia '${techId}' não encontrada para emissão de certificado.`);
  }

  if (!username.trim()) {
    throw new Error('Informe o nome do usuário para emissão do certificado.');
  }

  const progress = getTrailProgress(trail.id, progressPath);
  if (!progress.isComplete) {
    throw new Error(`Trilha incompleta. Conclua os desafios: ${progress.remaining.join(', ')}.`);
  }

  const issuedAt = new Date().toISOString();
  const certId = `CERT-${crypto.randomInt(36 ** 7).toString(36).toUpperCase().padStart(7, '0')}`;
  const hashValidation = createCertificateHash(certId, username, trail.id, issuedAt);

  return {
    id: certId,
    username,
    technologyId: trail.id,
    technology: trail.name,
    issuedAt,
    verificationCode: `GEO-${hashValidation.slice(0, 12).toUpperCase()}`,
    hashValidation
  };
}

function createCertificateHash(id: string, username: string, technologyId: string, issuedAt: string): string {
  return crypto.createHash('sha256').update(`${id}-${username}-${technologyId}-${issuedAt}`).digest('hex');
}

export function verifyCertificate(certificate: Certificate): boolean {
  if (!/^[a-f0-9]{64}$/i.test(certificate.hashValidation)) return false;

  const expectedHash = createCertificateHash(
    certificate.id,
    certificate.username,
    certificate.technologyId,
    certificate.issuedAt
  );
  const expected = Buffer.from(expectedHash, 'hex');
  const actual = Buffer.from(certificate.hashValidation, 'hex');
  return expected.length === actual.length &&
    crypto.timingSafeEqual(expected, actual) &&
    certificate.verificationCode === `GEO-${expectedHash.slice(0, 12).toUpperCase()}`;
}