#!/usr/bin/env node
/**
 * Generate a batch of brand-mark candidates via Replicate's Recraft v3 model.
 * Used during Axis H PR-3 (brand mark exploration).
 *
 * Env (loaded from <repo-root>/.env.local):
 *   REPLICATE_API_TOKEN    required
 *
 * Optional process.env overrides:
 *   PROMPT     — full prompt string (defaults to the spec's seed prompt)
 *   STYLE      — Recraft v3 style: vector_illustration | digital_illustration | any
 *   COUNT      — number of images in the batch (default 6)
 *   BATCH      — batch label, used to name the output directory (default 01)
 *
 * Output:
 *   <repo-root>/.replicate-session/batch-<BATCH>/01.png ... NN.png
 *   <repo-root>/.replicate-session/batch-<BATCH>/prompt.txt — the prompt + params used
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');

// ── Load token from .env.local
const envContent = readFileSync(resolve(repoRoot, '.env.local'), 'utf8');
const tokenMatch = envContent.match(/^REPLICATE_API_TOKEN=(.+)$/m);
if (!tokenMatch) {
  console.error('REPLICATE_API_TOKEN not found in .env.local');
  process.exit(1);
}
const token = tokenMatch[1].trim().replace(/^["']|["']$/g, '');

const DEFAULT_PROMPT = `Minimal hand-illustrated saguaro cactus glyph. Single sage-green color #1f6f4a on cream background #faf5ec. Organic, slightly rounded forms, no text, no shadow, no gradient, no realism. Vector-friendly flat illustration with strong silhouette. Inspired by the visual language of botanical illustration but distilled to a single confident shape. Square composition centered.`;

const PROMPT = process.env.PROMPT || DEFAULT_PROMPT;
const STYLE = process.env.STYLE || 'digital_illustration/hand_drawn';
const COUNT = Number(process.env.COUNT) || 6;
const BATCH = process.env.BATCH || '01';
const MODEL = process.env.MODEL || 'recraft'; // 'recraft' or 'flux'

const outputDir = resolve(repoRoot, '.replicate-session', `batch-${BATCH}`);
mkdirSync(outputDir, { recursive: true });

writeFileSync(
  resolve(outputDir, 'prompt.txt'),
  `Model: ${MODEL}\nPrompt:\n${PROMPT}\n\nStyle: ${STYLE}\nCount: ${COUNT}\nTimestamp: ${new Date().toISOString()}\n`,
);

const MODEL_CONFIG = {
  recraft: {
    endpoint: 'https://api.replicate.com/v1/models/recraft-ai/recraft-v3/predictions',
    input: () => ({ prompt: PROMPT, size: '1024x1024', style: STYLE }),
  },
  flux: {
    endpoint: 'https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions',
    input: () => ({
      prompt: PROMPT,
      aspect_ratio: '1:1',
      output_format: 'png',
      output_quality: 90,
      safety_tolerance: 2,
    }),
  },
};

const config = MODEL_CONFIG[MODEL];
if (!config) {
  console.error(`Unknown MODEL "${MODEL}". Use 'recraft' or 'flux'.`);
  process.exit(1);
}

async function generateOne(index) {
  const startResponse = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'wait',
    },
    body: JSON.stringify({ input: config.input() }),
  });

  if (!startResponse.ok) {
    const err = await startResponse.text();
    throw new Error(`API error for image ${index}: ${startResponse.status} ${err}`);
  }

  let prediction = await startResponse.json();

  while (prediction.status !== 'succeeded' && prediction.status !== 'failed' && prediction.status !== 'canceled') {
    await new Promise((r) => setTimeout(r, 1500));
    const pollResponse = await fetch(prediction.urls.get, {
      headers: { Authorization: `Bearer ${token}` },
    });
    prediction = await pollResponse.json();
  }

  if (prediction.status !== 'succeeded') {
    throw new Error(`Generation failed for image ${index}: ${prediction.error || prediction.status}`);
  }

  const imageUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
  const imageResponse = await fetch(imageUrl);
  const buffer = Buffer.from(await imageResponse.arrayBuffer());
  const filename = resolve(outputDir, `${String(index).padStart(2, '0')}.png`);
  writeFileSync(filename, buffer);
  console.log(`  ✓ saved ${filename}`);
}

console.log(`Generating ${COUNT} images via ${MODEL} (style="${STYLE}", batch="${BATCH}")`);
console.log(`Prompt: ${PROMPT.slice(0, 120)}${PROMPT.length > 120 ? '…' : ''}\n`);

const results = await Promise.allSettled(
  Array.from({ length: COUNT }, (_, i) => generateOne(i + 1)),
);

const succeeded = results.filter((r) => r.status === 'fulfilled').length;
console.log(`\nDone: ${succeeded}/${COUNT} succeeded. Output: ${outputDir}`);

const failures = results.filter((r) => r.status === 'rejected');
if (failures.length > 0) {
  console.error('\nFailures:');
  failures.forEach((r) => console.error(`  ${r.reason.message}`));
  process.exit(failures.length === COUNT ? 1 : 0);
}
