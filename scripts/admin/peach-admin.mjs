#!/usr/bin/env node
/**
 * Research-team command line tool for the PEACH / Percy study app.
 *
 * Uses the Firebase Admin SDK, which bypasses security rules, so run it only on a
 * study-team computer. Authenticate with a service-account key:
 *
 *   Firebase console → Project settings → Service accounts → Generate new private key
 *   export GOOGLE_APPLICATION_CREDENTIALS=/secure/path/service-account.json
 *
 * Never commit the key (it is git-ignored).
 *
 * Commands:
 *   node scripts/admin/peach-admin.mjs add-ids P-0001 P-0002 ...     pre-register study IDs
 *   node scripts/admin/peach-admin.mjs add-ids --range P- 1 300      registers P-0001 … P-0300
 *   node scripts/admin/peach-admin.mjs reset-password P-0042 NewPass123
 *   node scripts/admin/peach-admin.mjs reply P-0042 "Thanks, we fixed it!"   reply in Contact chat
 *   node scripts/admin/peach-admin.mjs feedback P-0042 3 "Great consistency this week…"
 *   node scripts/admin/peach-admin.mjs unread                         list unanswered participant messages
 *   node scripts/admin/peach-admin.mjs export                         export all participant data (JSON + CSVs)
 *   node scripts/admin/peach-admin.mjs seed-content [file.json]       upload scripts/media/FAQ/surveys
 *   node scripts/admin/peach-admin.mjs withdraw P-0042                delete a participant's data + account
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGIN_DOMAIN = 'peach-study.invalid';
const SUBCOLLECTIONS = ['days', 'dailySurveys', 'weeklySurveys', 'goals', 'chatLogs', 'unlocks', 'support', 'feedback'];

initializeApp({ credential: applicationDefault(), projectId: process.env.FIREBASE_PROJECT_ID ?? 'marsh-prosocial-intervention' });
const db = getFirestore();
const auth = getAuth();

const norm = (id) => String(id).trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');

async function uidFor(studyId) {
  const snap = await db.doc(`enrollment/${norm(studyId)}`).get();
  const uid = snap.exists ? snap.get('claimedBy') : null;
  if (!uid) throw new Error(`Study ID ${norm(studyId)} has no account yet.`);
  return uid;
}

function plain(value) {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(plain);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, plain(v)]));
  return value;
}

function toCsv(rows) {
  if (!rows.length) return '';
  const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const esc = (v) => {
    if (v == null) return '';
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
}

const commands = {
  async 'add-ids'(args) {
    let ids = args;
    if (args[0] === '--range') {
      const [, prefix, from, to] = args;
      ids = [];
      for (let n = Number(from); n <= Number(to); n++) ids.push(`${prefix}${String(n).padStart(4, '0')}`);
    }
    const batch = db.batch();
    for (const id of ids.map(norm)) {
      batch.set(db.doc(`enrollment/${id}`), { createdAt: FieldValue.serverTimestamp(), claimedBy: null }, { merge: true });
    }
    await batch.commit();
    console.log(`Registered ${ids.length} study IDs.`);
  },

  async 'reset-password'([studyId, password]) {
    if (!password || password.length < 8) throw new Error('Give a new password of at least 8 characters.');
    await auth.updateUser(await uidFor(studyId), { password });
    console.log(`Password reset for ${norm(studyId)}. Share it with the participant through your approved channel.`);
  },

  async reply([studyId, ...words]) {
    const uid = await uidFor(studyId);
    await db.collection(`participants/${uid}/support`).add({
      from: 'team',
      text: words.join(' '),
      createdAt: FieldValue.serverTimestamp(),
    });
    console.log(`Replied to ${norm(studyId)}.`);
  },

  async feedback([studyId, week, ...words]) {
    const uid = await uidFor(studyId);
    await db.doc(`participants/${uid}/feedback/${Number(week)}`).set({
      week: Number(week),
      message: words.join(' '),
      createdAt: FieldValue.serverTimestamp(),
    });
    console.log(`Saved week ${week} feedback for ${norm(studyId)}.`);
  },

  async unread() {
    const people = await db.collection('participants').get();
    for (const p of people.docs) {
      const msgs = await p.ref.collection('support').orderBy('createdAt', 'asc').get();
      const last = msgs.docs.at(-1);
      if (last && last.get('from') === 'participant') {
        console.log(`${p.get('studyId')}: "${last.get('text')}" (${plain(last.get('createdAt'))})`);
      }
    }
  },

  async export() {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outDir = path.join(__dirname, 'exports', stamp);
    fs.mkdirSync(outDir, { recursive: true });
    const all = [];
    const flat = Object.fromEntries(SUBCOLLECTIONS.map((c) => [c, []]));
    const people = await db.collection('participants').get();
    for (const p of people.docs) {
      const studyId = p.get('studyId');
      const record = { studyId, profile: plain(p.data()) };
      for (const c of SUBCOLLECTIONS) {
        const snap = await p.ref.collection(c).get();
        record[c] = snap.docs.map((d) => ({ id: d.id, ...plain(d.data()) }));
        // Flatten for CSV; nested values (ratings, events) are JSON-encoded in their cell.
        flat[c].push(...record[c].map((row) => ({ studyId, ...row })));
      }
      all.push(record);
    }
    fs.writeFileSync(path.join(outDir, 'all-participants.json'), JSON.stringify(all, null, 2));
    fs.writeFileSync(path.join(outDir, 'participants.csv'), toCsv(all.map((r) => ({ studyId: r.studyId, ...r.profile }))));
    for (const c of SUBCOLLECTIONS) fs.writeFileSync(path.join(outDir, `${c}.csv`), toCsv(flat[c]));
    console.log(`Exported ${all.length} participants to ${outDir}`);
    console.log('Note: exports are keyed by study ID only. Store them on approved, access-controlled storage.');
  },

  async 'seed-content'([file]) {
    const src = file ?? path.join(__dirname, 'sample-content.json');
    const content = JSON.parse(fs.readFileSync(src, 'utf8'));
    for (const [id, script] of Object.entries(content.scripts ?? {})) {
      const { segments = [], ...meta } = script;
      await db.doc(`scripts/${id}`).set({ ...meta, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      const existing = await db.collection(`scripts/${id}/segments`).get();
      await Promise.all(existing.docs.map((d) => d.ref.delete()));
      await Promise.all(segments.map((seg, i) => db.doc(`scripts/${id}/segments/${String(i).padStart(3, '0')}`).set({ order: i, ...seg })));
    }
    for (const coll of ['media', 'faq', 'surveys', 'appConfig']) {
      for (const [id, data] of Object.entries(content[coll] ?? {})) await db.doc(`${coll}/${id}`).set(data);
    }
    console.log(`Uploaded content from ${src}`);
  },

  async withdraw([studyId]) {
    const uid = await uidFor(studyId);
    await db.recursiveDelete(db.doc(`participants/${uid}`));
    await auth.deleteUser(uid).catch(() => undefined);
    await db.doc(`enrollment/${norm(studyId)}`).set({ claimedBy: null, withdrawnAt: FieldValue.serverTimestamp() }, { merge: true });
    console.log(`Deleted all app data and the login for ${norm(studyId)}.`);
  },
};

const [cmd, ...args] = process.argv.slice(2);
if (!commands[cmd]) {
  console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0]);
  process.exit(cmd ? 1 : 0);
}
commands[cmd](args).catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
