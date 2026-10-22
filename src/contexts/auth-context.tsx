/**
 * Study-ID authentication.
 *
 * Participants sign in with the study ID the research team gives them plus a
 * password they choose. Firebase Auth requires an email-shaped login, so the
 * study ID is mapped to a placeholder address on the reserved ".invalid" domain
 * (it can never receive mail and is not personal data).
 *
 * Account creation only succeeds for study IDs the team has pre-registered in
 * /enrollment/{STUDYID} (see scripts/admin/add-study-ids.mjs) and each ID can be
 * claimed once. Because there is no real email, password resets are done by
 * the research team (scripts/admin/reset-password.mjs).
 */
import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import { DEMO, demoSignIn, demoSignOut } from '@/utils/demo';
import { auth, db } from '@/utils/firebase';

const LOGIN_DOMAIN = 'peach-study.invalid';

export function normalizeStudyId(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
}

const toLoginEmail = (studyId: string) => `${studyId.toLowerCase()}@${LOGIN_DOMAIN}`;
const studyIdFromUser = (user: User) => user.email?.split('@')[0]?.toUpperCase() ?? '';

interface AuthContextType {
  user: User | null;
  studyId: string | null;
  isLoading: boolean;
  signIn: (studyId: string, password: string) => Promise<void>;
  signUp: (studyId: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export class AuthError extends Error {}

function friendlyError(e: unknown): AuthError {
  const code = (e as { code?: string })?.code ?? '';
  if (e instanceof AuthError) return e;
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found'))
    return new AuthError('That study ID and password do not match. Check both and try again.');
  if (code.includes('email-already-in-use'))
    return new AuthError('This study ID already has an account. Use "Sign in" instead.');
  if (code.includes('weak-password')) return new AuthError('Please choose a password of at least 8 characters.');
  if (code.includes('network')) return new AuthError('No internet connection. Please try again when you are online.');
  if (code.includes('too-many-requests'))
    return new AuthError('Too many attempts. Please wait a few minutes, or contact the research team.');
  return new AuthError('Something went wrong. Please try again or contact the research team.');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(!DEMO);
  // While an account is being created and its study ID claimed, keep the app on
  // the sign-up screen (so a failed claim can show its error there).
  const [signingUp, setSigningUp] = useState(false);

  useEffect(() => {
    if (DEMO) return;
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsLoading(false);
    });
  }, []);

  const signIn = async (rawId: string, password: string) => {
    const studyId = normalizeStudyId(rawId);
    if (!studyId) throw new AuthError('Please enter your study ID.');
    if (DEMO) {
      setUser(demoSignIn(studyId, false) as unknown as User);
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, toLoginEmail(studyId), password);
    } catch (e) {
      throw friendlyError(e);
    }
  };

  const signUp = async (rawId: string, password: string) => {
    const studyId = normalizeStudyId(rawId);
    if (!studyId) throw new AuthError('Please enter the study ID from the research team.');
    if (password.length < 8) throw new AuthError('Please choose a password of at least 8 characters.');
    if (DEMO) {
      setUser(demoSignIn(studyId, true) as unknown as User);
      return;
    }

    let created: User | null = null;
    setSigningUp(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, toLoginEmail(studyId), password);
      created = cred.user;
      const uid = created.uid;

      // Claim the pre-registered study ID and create the participant record together.
      await runTransaction(db, async (tx) => {
        const enrollRef = doc(db, 'enrollment', studyId);
        const enrollSnap = await tx.get(enrollRef);
        if (!enrollSnap.exists()) {
          throw new AuthError('We could not find that study ID. Please check it, or contact the research team.');
        }
        if (enrollSnap.data().claimedBy) {
          throw new AuthError('This study ID already has an account. Use "Sign in" instead.');
        }
        tx.update(enrollRef, { claimedBy: uid, claimedAt: serverTimestamp() });
        tx.set(doc(db, 'participants', uid), {
          studyId,
          startDate: null,
          onboarded: false,
          tutorialCompleted: false,
          reminders: null,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? null,
          createdAt: serverTimestamp(),
        });
      });
    } catch (e) {
      // Roll back the auth account so the ID isn't left half-registered.
      if (created) await deleteUser(created).catch(() => undefined);
      throw friendlyError(e);
    } finally {
      setSigningUp(false);
    }
  };

  const signOut = async () => {
    if (DEMO) {
      demoSignOut();
      setUser(null);
      return;
    }
    await fbSignOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user: signingUp ? null : user,
        studyId: user && !signingUp ? studyIdFromUser(user) : null,
        isLoading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
