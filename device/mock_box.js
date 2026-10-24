#!/usr/bin/env node
/**
 * CareBox Hardware Simulator — Node.js CLI
 * Simulates the physical CareBox device sending button-press events
 * to the Supabase Edge Function (box-event).
 *
 * Usage:
 *   node device/mock_box.js --slot morning
 *   node device/mock_box.js --slot afternoon --parent-id <uuid>
 *   node device/mock_box.js --interactive
 *   node device/mock_box.js --schedule  # auto-press at simulated dose times
 *
 * Environment (create device/.env or pass via shell):
 *   BOX_API_URL=https://<project>.supabase.co/functions/v1/box-event
 *   BOX_DEVICE_TOKEN=CB-8842-PUNE
 *   BOX_API_KEY=<supabase_anon_key>
 *   PARENT_ID=<uuid_of_parent_user>
 */

'use strict';

const https = require('https');
const http = require('http');
const readline = require('readline');
const path = require('path');
const fs = require('fs');

// ─── Load .env ───────────────────────────────────────────────────────────────
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const [k, ...v] = line.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim();
  }
}

// ─── Config ──────────────────────────────────────────────────────────────────
const CONFIG = {
  apiUrl: process.env.BOX_API_URL || 'http://localhost:54321/functions/v1/box-event',
  deviceToken: process.env.BOX_DEVICE_TOKEN || 'CB-8842-PUNE',
  apiKey: process.env.BOX_API_KEY || '',
  parentId: process.env.PARENT_ID || '',
};

const SLOTS = ['morning', 'afternoon', 'night'];

// Simulated dose times (IST, 24h format)
const DOSE_SCHEDULE = {
  morning: { hour: 8, minute: 0, label: '8:00 AM' },
  afternoon: { hour: 13, minute: 30, label: '1:30 PM' },
  night: { hour: 20, minute: 0, label: '8:00 PM' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function colorize(text, code) {
  return `\x1b[${code}m${text}\x1b[0m`;
}
const green = (t) => colorize(t, '32');
const amber = (t) => colorize(t, '33');
const teal = (t) => colorize(t, '36');
const bold = (t) => colorize(t, '1');
const dim = (t) => colorize(t, '2');

function log(level, msg) {
  const ts = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
  const prefix = {
    info: teal('[BOX]'),
    ok: green('[✓]  '),
    warn: amber('[⚠]  '),
    error: colorize('[✗]  ', '31'),
  }[level] || '[   ]';
  console.log(`${dim(ts)} ${prefix} ${msg}`);
}

// ─── Core: Send Event to Edge Function ──────────────────────────────────────
async function sendBoxEvent(slot, parentId, retries = 3) {
  const payload = JSON.stringify({
    box_id: CONFIG.deviceToken,
    parent_id: parentId || CONFIG.parentId,
    slot,
    taken_at: new Date().toISOString(),
    source: 'physical_box',
  });

  const targetUrl = CONFIG.apiUrl;
  const parsedUrl = new URL(targetUrl);
  const transport = parsedUrl.protocol === 'https:' ? https : http;

  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
    path: parsedUrl.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'Authorization': `Bearer ${CONFIG.apiKey}`,
      'x-box-token': CONFIG.deviceToken,
    },
  };

  return new Promise((resolve) => {
    const req = transport.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            log('ok', `Slot '${bold(slot)}' confirmed. Response: ${JSON.stringify(json)}`);
            resolve({ ok: true, status: res.statusCode, data: json });
          } else {
            log('warn', `HTTP ${res.statusCode}: ${JSON.stringify(json)}`);
            resolve({ ok: false, status: res.statusCode, data: json });
          }
        } catch {
          log('warn', `HTTP ${res.statusCode} (non-JSON): ${body.slice(0, 100)}`);
          resolve({ ok: false, status: res.statusCode });
        }
      });
    });

    req.on('error', async (err) => {
      log('warn', `Network error: ${err.message}`);
      if (retries > 0) {
        const delay = (4 - retries) * 2000; // 2s, 4s, 6s backoff
        log('info', `Retrying in ${delay / 1000}s... (${retries} attempts left)`);
        await new Promise((r) => setTimeout(r, delay));
        resolve(sendBoxEvent(slot, parentId, retries - 1));
      } else {
        log('error', 'All retries exhausted. Event not delivered.');
        resolve({ ok: false, error: err.message });
      }
    });

    req.write(payload);
    req.end();
  });
}

// ─── Interactive Mode ────────────────────────────────────────────────────────
async function interactiveMode() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((r) => rl.question(q, r));

  console.log('\n' + bold('══════════════════════════════════════════════'));
  console.log(bold('  CareBox Hardware Simulator — Interactive Mode'));
  console.log(bold('══════════════════════════════════════════════') + '\n');
  console.log(`  Device Token : ${teal(CONFIG.deviceToken)}`);
  console.log(`  API Endpoint : ${dim(CONFIG.apiUrl)}`);
  console.log(`  Parent ID    : ${CONFIG.parentId ? teal(CONFIG.parentId) : amber('(not set — using edge fn default)')}`);
  console.log('\n  ' + dim('Commands: [m]orning  [a]fternoon  [n]ight  [q]uit\n'));

  while (true) {
    const input = (await ask(teal('  Press button > '))).trim().toLowerCase();
    if (input === 'q' || input === 'quit' || input === 'exit') break;

    const slotMap = { m: 'morning', a: 'afternoon', n: 'night',
      morning: 'morning', afternoon: 'afternoon', night: 'night' };
    const slot = slotMap[input];

    if (!slot) {
      log('warn', `Unknown input '${input}'. Use m, a, n, or quit.`);
      continue;
    }

    log('info', `Sending ${bold(slot)} dose event → ${dim(CONFIG.apiUrl)}`);
    await sendBoxEvent(slot);
  }

  rl.close();
  console.log('\n' + dim('  Simulator shut down. Goodbye.') + '\n');
}

// ─── Scheduled Mode ──────────────────────────────────────────────────────────
async function scheduledMode() {
  console.log('\n' + bold('CareBox — Schedule Mode (auto-presses at dose times IST)'));
  console.log(dim('  Press Ctrl+C to stop.\n'));

  const timeouts = [];
  const now = new Date();
  const todayIST = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

  for (const [slot, schedule] of Object.entries(DOSE_SCHEDULE)) {
    const triggerTime = new Date(todayIST);
    triggerTime.setHours(schedule.hour, schedule.minute, 0, 0);

    const diff = triggerTime - todayIST;
    if (diff > 0) {
      log('info', `Scheduled '${bold(slot)}' → fires at ${schedule.label} IST in ${Math.round(diff / 60000)}m`);
      const t = setTimeout(async () => {
        log('info', `⏰ Auto-pressing ${bold(slot)} compartment...`);
        await sendBoxEvent(slot);
      }, diff);
      timeouts.push(t);
    } else {
      log('warn', `Slot '${slot}' scheduled time (${schedule.label}) has already passed today.`);
    }
  }

  if (!timeouts.length) {
    log('warn', 'All dose times have passed for today. Run tomorrow, or use --interactive.');
    process.exit(0);
  }

  // Keep process alive
  process.on('SIGINT', () => {
    timeouts.forEach(clearTimeout);
    log('info', 'Scheduler stopped.');
    process.exit(0);
  });
}

// ─── CLI Argument Parsing ────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      flags[key] = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
    }
  }

  // Validate slot
  if (flags.slot && !SLOTS.includes(flags.slot)) {
    log('error', `Invalid slot '${flags.slot}'. Must be: morning | afternoon | night`);
    process.exit(1);
  }

  if (!CONFIG.apiKey && !flags.interactive && !flags.schedule) {
    log('warn', 'BOX_API_KEY not set. Requests may fail authentication.');
  }

  if (flags.interactive) {
    await interactiveMode();
  } else if (flags.schedule) {
    await scheduledMode();
  } else if (flags.slot) {
    const pid = flags['parent-id'] || CONFIG.parentId;
    log('info', `Sending ${bold(flags.slot)} dose event → ${dim(CONFIG.apiUrl)}`);
    const result = await sendBoxEvent(flags.slot, pid);
    process.exit(result.ok ? 0 : 1);
  } else {
    console.log(`
${bold('CareBox Hardware Simulator')} — Node.js CLI

${bold('Usage:')}
  node device/mock_box.js --slot <morning|afternoon|night>
  node device/mock_box.js --slot morning --parent-id <uuid>
  node device/mock_box.js --interactive
  node device/mock_box.js --schedule

${bold('Environment (.env file or shell exports):')}
  BOX_API_URL=https://<project>.supabase.co/functions/v1/box-event
  BOX_DEVICE_TOKEN=CB-8842-PUNE
  BOX_API_KEY=<supabase_anon_key>
  PARENT_ID=<uuid_of_parent_user>

${bold('Examples:')}
  # Single press (simulates box button for afternoon)
  node device/mock_box.js --slot afternoon

  # Interactive REPL (great for demos)
  node device/mock_box.js --interactive

  # Auto-fire at dose times (schedule mode)
  node device/mock_box.js --schedule
`);
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
