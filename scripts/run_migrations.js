/**
 * run_migrations.js — Runs all CareBox SQL migrations against Supabase
 * Uses the Supabase Management API (no psql or CLI needed)
 * 
 * Usage: node scripts/run_migrations.js
 */
'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');

// ─── Config ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://oulrorvbzlacsbjuoabb.supabase.co';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY || '';

// project ref extracted from URL
const PROJECT_REF = SUPABASE_URL.replace('https://', '').split('.')[0];

const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations');

// ─── HTTP helper ─────────────────────────────────────────────────────────────
function post(url, body, headers) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const payload = JSON.stringify(body);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...headers,
      },
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ─── Run SQL via Supabase pg-meta (REST) ─────────────────────────────────────
async function runSQL(sql, label) {
  if (!SERVICE_KEY) {
    console.error('❌  SUPABASE_SERVICE_KEY is not set. Cannot run migrations.');
    console.error('    Set it: set SUPABASE_SERVICE_KEY=your_service_role_key');
    process.exit(1);
  }

  // Supabase Management API: POST /v1/projects/{ref}/database/query
  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

  const result = await post(url, { query: sql }, {
    'Authorization': `Bearer ${SERVICE_KEY}`,
  });

  if (result.status >= 200 && result.status < 300) {
    console.log(`  ✅  ${label}`);
    return true;
  } else {
    console.error(`  ❌  ${label} — HTTP ${result.status}`);
    console.error('     ', JSON.stringify(result.body).slice(0, 200));
    return false;
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🚀  CareBox Migration Runner');
  console.log(`📡  Project: ${SUPABASE_URL}`);
  console.log(`📂  Migrations: ${MIGRATIONS_DIR}\n`);

  // Read migration files in order
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  if (!files.length) {
    console.error('No .sql files found in migrations/');
    process.exit(1);
  }

  let passed = 0;
  let failed = 0;

  for (const file of files) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    const ok = await runSQL(sql, file);
    if (ok) passed++;
    else failed++;
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`✅  ${passed} passed   ❌  ${failed} failed`);

  if (failed === 0) {
    console.log('\n🎉  All migrations applied! Your Supabase database is ready.\n');
  } else {
    console.log('\n⚠️   Some migrations failed. Check the errors above.\n');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
