#!/usr/bin/env node
/**
 * Regression guard: every Cairo entrypoint invoked through the ChipiPay
 * session-key-signed execution pipeline (useChipiTransaction.executeTransaction)
 * must be listed in use-session-key.ts's `allowedEntrypoints`, or the call
 * silently reverts at the ChipiPay paymaster (TRANSACTION_EXECUTION_ERROR).
 * Two real incidents were caused by a missing entry: safe_transfer_from
 * (PR #45), deploy_collection (PR #53). This automates the manual
 * "grep + diff by eye" audit documented in CLAUDE.md.
 *
 * Run: node scripts/guard-entrypoint-whitelist.mjs
 * Self-test: node scripts/guard-entrypoint-whitelist.mjs --selftest
 */
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const SESSION_KEY_FILE = "src/hooks/use-session-key.ts";

// ── Extract the whitelist from use-session-key.ts ───────────────────────────

function extractWhitelist(content) {
  const startMarker = "allowedEntrypoints: [";
  const startIdx = content.indexOf(startMarker);
  if (startIdx === -1) {
    throw new Error(`Could not find "${startMarker}" in ${SESSION_KEY_FILE}`);
  }
  const arrayStart = startIdx + startMarker.length - 1; // index of the "["
  let depth = 0;
  let endIdx = -1;
  for (let i = arrayStart; i < content.length; i++) {
    if (content[i] === "[") depth++;
    else if (content[i] === "]") {
      depth--;
      if (depth === 0) {
        endIdx = i;
        break;
      }
    }
  }
  if (endIdx === -1) {
    throw new Error(`Unterminated allowedEntrypoints array in ${SESSION_KEY_FILE}`);
  }
  const arrayBody = content.slice(arrayStart, endIdx + 1);
  const whitelist = new Set();
  const re = /getSelectorFromName\("([a-zA-Z_]+)"\)/g;
  let m;
  while ((m = re.exec(arrayBody))) {
    whitelist.add(m[1]);
  }
  return whitelist;
}

// ── Find the nearest enclosing function call for a given position ──────────

function findEnclosingCallName(content, pos) {
  let depth = 0;
  for (let i = pos; i >= 0; i--) {
    const c = content[i];
    if (c === ")") {
      depth++;
    } else if (c === "(") {
      if (depth === 0) {
        let j = i - 1;
        while (j >= 0 && /\s/.test(content[j])) j--;
        const end = j + 1;
        while (j >= 0 && /[A-Za-z0-9_.]/.test(content[j])) j--;
        return content.slice(j + 1, end);
      }
      depth--;
    }
  }
  return null;
}

// ── Collect write-candidate entrypoint names in a file's content ───────────

function findWriteCandidates(content) {
  const candidates = [];

  const entrypointRe = /entrypoint:\s*"([a-zA-Z_]+)"/g;
  let m;
  while ((m = entrypointRe.exec(content))) {
    const name = m[1];
    const quoteOffset = m[0].indexOf('"');
    const matchPos = m.index + quoteOffset;
    const enclosing = findEnclosingCallName(content, matchPos);
    const isRead = enclosing != null && enclosing.endsWith(".callContract");
    if (!isRead) {
      const line = content.slice(0, m.index).split("\n").length;
      candidates.push({ name, line });
    }
  }

  const populateRe = /\.populate\(\s*"([a-zA-Z_]+)"/g;
  while ((m = populateRe.exec(content))) {
    const line = content.slice(0, m.index).split("\n").length;
    candidates.push({ name: m[1], line });
  }

  return candidates;
}

// ── Self-test ────────────────────────────────────────────────────────────────

function assertTrue(cond, msg) {
  if (!cond) {
    console.error("✗ self-test failed: " + msg);
    process.exit(1);
  }
}

function runSelfTest() {
  const readSample = `
async function read() {
  const res = await starknetProvider.callContract({
    contractAddress: "0x1",
    entrypoint: "balanceOf",
    calldata: [],
  });
}
`;

  const writeSample = `
async function write() {
  return action.executeTransaction({
    pin: secret,
    calls: [
      { contractAddress: "0x1", entrypoint: "totally_fake_write_entrypoint", calldata: [] },
    ],
  });
}
`;

  const populateSample = `
const call = contract.populate("another_fake_write_entrypoint", [1, 2]);
`;

  const readCandidates = findWriteCandidates(readSample);
  assertTrue(
    readCandidates.length === 0,
    `expected read sample to yield 0 write candidates, got ${JSON.stringify(readCandidates)}`
  );

  const writeCandidates = findWriteCandidates(writeSample);
  assertTrue(
    writeCandidates.some((c) => c.name === "totally_fake_write_entrypoint"),
    `expected write sample to flag totally_fake_write_entrypoint, got ${JSON.stringify(writeCandidates)}`
  );

  const populateCandidates = findWriteCandidates(populateSample);
  assertTrue(
    populateCandidates.some((c) => c.name === "another_fake_write_entrypoint"),
    `expected populate sample to flag another_fake_write_entrypoint, got ${JSON.stringify(populateCandidates)}`
  );

  console.log("✓ guard-entrypoint-whitelist self-test: read/write/populate classification correct.");
}

// ── main ─────────────────────────────────────────────────────────────────────

if (process.argv.includes("--selftest")) {
  runSelfTest();
  process.exit(0);
}

const sessionKeySrc = readFileSync(SESSION_KEY_FILE, "utf8");
const whitelist = extractWhitelist(sessionKeySrc);

const files = execSync(
  `grep -rlE 'entrypoint:\\s*"|\\.populate\\(' src --include='*.ts' --include='*.tsx' || true`,
  { encoding: "utf8" }
)
  .split("\n")
  .map((s) => s.trim())
  .filter(Boolean);

const offenders = [];
let checked = 0;

for (const file of files) {
  const content = readFileSync(file, "utf8");
  const candidates = findWriteCandidates(content);
  for (const { name, line } of candidates) {
    checked++;
    if (!whitelist.has(name)) {
      offenders.push(`${file}:${line} — "${name}"`);
    }
  }
}

if (offenders.length) {
  console.error("✗ Entrypoint called but not in use-session-key.ts's allowedEntrypoints:");
  for (const o of offenders) console.error("  - " + o);
  console.error(
    '\nAdd hash.getSelectorFromName("...") to allowedEntrypoints, or if this is a genuine' +
    " read-only call, make sure it goes through .callContract(...)."
  );
  process.exit(1);
}

console.log(`✓ guard-entrypoint-whitelist: ${checked} write entrypoint call sites, all whitelisted.`);
