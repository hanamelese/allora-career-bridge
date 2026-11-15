#!/usr/bin/env node
/**
 * An example delivery receiver: the organisation's side of a submission.
 *
 * Allora Accessibility Bridge never receives learners' answers. When a
 * learner sends a form, their browser posts the answers straight to the
 * organisation's delivery address. This is a minimal receiver for trying
 * that out on your own computer - not a production server.
 *
 * It:
 *   1. answers the browser's CORS check, for the websites you list;
 *   2. checks the delivery token (signature, expiry, form, used once);
 *   3. appends each accepted submission to a JSON-lines file you choose,
 *      and replies { receiptId }.
 *
 * Run (no dependencies):
 *   DELIVERY_SECRET=dsec_… ALLOWED_ORIGINS=http://localhost:8080 \
 *     node tools/delivery-receiver/receiver.mjs
 *
 * Then, in the dashboard, set Your organisation → Where submitted forms go
 * to http://localhost:4000/submissions and copy the signing secret here.
 *
 *   PORT              default 4000
 *   DELIVERY_SECRET   the signing secret shown in the dashboard (required)
 *   ALLOWED_ORIGINS   comma-separated websites that show your forms
 *   OUT_FILE          default tools/delivery-receiver/received/submissions.jsonl
 */
import { createServer } from 'node:http';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.PORT ?? 4000);
const SECRET = process.env.DELIVERY_SECRET;
const ALLOWED = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:8080').split(',').map((s) => s.trim()).filter(Boolean);
const OUT_FILE = process.env.OUT_FILE ?? join(dirname(fileURLToPath(import.meta.url)), 'received', 'submissions.jsonl');
const MAX_BODY = 256 * 1024;

if (!SECRET) {
  console.error('Set DELIVERY_SECRET to the signing secret shown in the dashboard.');
  process.exit(1);
}

const usedNonces = new Map(); // nonce -> expiry (ms)

/** The token's claims if it is genuine and current, else null. */
function verify(token) {
  const [version, payload, signature] = String(token ?? '').split('.');
  if (version !== 'v1' || !payload || !signature) return null;

  const expected = Buffer.from(createHmac('sha256', SECRET).update(payload).digest('base64url'));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return claims.exp * 1000 > Date.now() ? claims : null;
  } catch {
    return null;
  }
}

function send(response, status, body, origin) {
  if (origin && ALLOWED.includes(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Vary', 'Origin');
  }
  response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(body));
}

createServer((request, response) => {
  const origin = request.headers.origin;

  if (request.method === 'OPTIONS') {
    if (!ALLOWED.includes(origin)) return send(response, 403, { error: 'origin_not_allowed' });
    response.writeHead(204, {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '600',
      Vary: 'Origin',
    });
    return response.end();
  }

  if (request.method !== 'POST') return send(response, 405, { error: 'method_not_allowed' }, origin);
  if (origin && !ALLOWED.includes(origin)) return send(response, 403, { error: 'origin_not_allowed' });

  let size = 0;
  const chunks = [];
  request.on('data', (chunk) => {
    size += chunk.length;
    if (size > MAX_BODY) request.destroy();
    else chunks.push(chunk);
  });

  request.on('end', () => {
    let body;
    try {
      body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
      return send(response, 400, { error: 'invalid_json' }, origin);
    }

    const claims = verify(body.token);
    if (!claims || claims.formId !== body.formId || claims.version !== body.version) {
      return send(response, 401, { error: 'invalid_token' }, origin);
    }

    /* Each token is accepted once. */
    const now = Date.now();
    for (const [nonce, expiry] of usedNonces) if (expiry < now) usedNonces.delete(nonce);
    if (usedNonces.has(claims.nonce)) return send(response, 409, { error: 'token_already_used' }, origin);
    usedNonces.set(claims.nonce, claims.exp * 1000);

    const receiptId = randomUUID();
    mkdirSync(dirname(OUT_FILE), { recursive: true });
    appendFileSync(
      OUT_FILE,
      `${JSON.stringify({
        receiptId,
        receivedAt: new Date().toISOString(),
        formId: body.formId,
        version: body.version,
        type: body.type,
        language: body.language,
        submittedAt: body.submittedAt,
        answers: body.answers,
      })}\n`,
    );

    /* Only that it arrived - never the answers - goes to the console. */
    console.log(`${new Date().toISOString()}  received ${body.type ?? 'form'} ${body.formId} v${body.version}  receipt ${receiptId}`);
    return send(response, 201, { receiptId }, origin);
  });
}).listen(PORT, () => {
  console.log(`Delivery receiver on http://localhost:${PORT}/submissions`);
  console.log(`Accepting deliveries from: ${ALLOWED.join(', ')}`);
  console.log(`Saving to: ${OUT_FILE}`);
});
