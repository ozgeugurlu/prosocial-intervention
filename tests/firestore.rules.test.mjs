/**
 * Security-rules tests. Run with:  npm run test:rules
 * (starts the Firestore emulator, which needs Java 11+).
 */
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import fs from 'node:fs';
import test from 'node:test';

const env = await initializeTestEnvironment({
  projectId: 'peach-rules-test',
  firestore: { rules: fs.readFileSync('firestore.rules', 'utf8') },
});

const asUser = (uid, studyId) => env.authenticatedContext(uid, { email: `${studyId.toLowerCase()}@peach-study.invalid` }).firestore();

test.beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'enrollment/P-0001'), { claimedBy: null });
    await setDoc(doc(db, 'enrollment/P-0002'), { claimedBy: 'someone-else' });
    await setDoc(doc(db, 'participants/bob'), { studyId: 'P-0009' });
    await setDoc(doc(db, 'participants/bob/feedback/1'), { week: 1, message: 'hi' });
    await setDoc(doc(db, 'scripts/s1'), { name: 'x' });
  });
});

test('unauthenticated users can read nothing', async () => {
  const db = env.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(db, 'scripts/s1')));
  await assertFails(getDoc(doc(db, 'enrollment/P-0001')));
});

test('participant can claim their own unclaimed study ID', async () => {
  const db = asUser('alice', 'P-0001');
  await assertSucceeds(updateDoc(doc(db, 'enrollment/P-0001'), { claimedBy: 'alice', claimedAt: serverTimestamp() }));
});

test('cannot claim an already-claimed ID or someone else\'s ID', async () => {
  await assertFails(updateDoc(doc(asUser('alice', 'P-0002'), 'enrollment/P-0002'), { claimedBy: 'alice' }));
  await assertFails(updateDoc(doc(asUser('alice', 'P-0003'), 'enrollment/P-0001'), { claimedBy: 'alice' }));
});

test('cannot list enrollment IDs', async () => {
  await assertFails(getDocs(collection(asUser('alice', 'P-0001'), 'enrollment')));
});

test('participant record must carry their own study ID', async () => {
  const db = asUser('alice', 'P-0001');
  await assertFails(setDoc(doc(db, 'participants/alice'), { studyId: 'P-0002' }));
  await assertSucceeds(setDoc(doc(db, 'participants/alice'), { studyId: 'P-0001', onboarded: false }));
  await assertFails(updateDoc(doc(db, 'participants/alice'), { studyId: 'P-0005' }));
});

test('participants cannot read or write each other\'s data', async () => {
  const db = asUser('alice', 'P-0001');
  await assertFails(getDoc(doc(db, 'participants/bob')));
  await assertFails(setDoc(doc(db, 'participants/bob/days/1'), { 'morning chat': true }));
});

test('own daily data: create allowed, survey edits blocked', async () => {
  const db = asUser('bob', 'P-0009');
  await assertSucceeds(setDoc(doc(db, 'participants/bob/days/1'), { 'morning chat': true }));
  await assertSucceeds(setDoc(doc(db, 'participants/bob/dailySurveys/1'), { day: 1, average: 3 }));
  await assertFails(setDoc(doc(db, 'participants/bob/dailySurveys/1'), { day: 1, average: 5 }));
});

test('feedback is read-only; support messages must be from the participant', async () => {
  const db = asUser('bob', 'P-0009');
  await assertSucceeds(getDoc(doc(db, 'participants/bob/feedback/1')));
  await assertFails(setDoc(doc(db, 'participants/bob/feedback/2'), { message: 'self-praise' }));
  await assertSucceeds(addDoc(collection(db, 'participants/bob/support'), { from: 'participant', text: 'help', createdAt: serverTimestamp() }));
  await assertFails(addDoc(collection(db, 'participants/bob/support'), { from: 'team', text: 'fake reply', createdAt: serverTimestamp() }));
});

test('content is readable when signed in but not writable', async () => {
  const db = asUser('bob', 'P-0009');
  await assertSucceeds(getDoc(doc(db, 'scripts/s1')));
  await assertFails(setDoc(doc(db, 'scripts/s2'), { name: 'mine' }));
});

test.after(() => env.cleanup());
