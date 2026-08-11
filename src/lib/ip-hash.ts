import { createHash } from 'crypto';

// RGPD: se guarda el hash, nunca la IP en claro (docs/architecture.md
// «Protección del flujo público»). Sirve igual para contar peticiones por IP
// y deja de ser un dato personal identificable.
export function hashearIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex');
}

export function obtenerIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'desconocida';
}
