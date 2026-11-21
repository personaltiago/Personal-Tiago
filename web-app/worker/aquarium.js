import { AQ_MEDIA, AQ_RUNTIME, AQ_PREVIEW } from './aquarium-payload.js';

const AQUARIUM_ROUTES = new Map([
  ['/api/aquarium/v1/media.json', { body: AQ_MEDIA, type: 'application/json; charset=utf-8', immutable: true }],
  ['/api/aquarium/v1/runtime.js', { body: AQ_RUNTIME, type: 'text/javascript; charset=utf-8' }],
  ['/aquario', { body: AQ_PREVIEW, type: 'text/html; charset=utf-8' }],
]);

export function aquariumResponse(request) {
  const route = AQUARIUM_ROUTES.get(new URL(request.url).pathname);
  if (!route) return null;

  const headers = new Headers({
    'Content-Type': route.type,
    'X-Content-Type-Options': 'nosniff',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Cache-Control': route.immutable ? 'public, max-age=31536000, immutable' : 'public, max-age=60',
  });
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    headers.set('Allow', 'GET, HEAD, OPTIONS');
    return new Response(null, { status: 405, headers });
  }
  if (route.immutable) headers.set('Content-Disposition', 'inline; filename="AgendaPersonal-Aquario-1.aquarium.json"');
  return new Response(request.method === 'HEAD' ? null : route.body, { headers });
}
