# PEACH: Percy prosocial intervention app

Expo / React Native app for a 63-day (9-week) prosociality intervention. Participants check in with **Percy**, a fully scripted coach, every morning and evening; complete a nightly emotion reflection and a weekly prosociality survey; set a weekly goal and if-then plan; and see their streak, scores and participation feedback.

All participant data is stored in the study's own Firebase project (`marsh-prosocial-intervention`) under a research-issued **study ID**. No names, emails or phone numbers are collected, and nothing is sent to an AI provider. See [`docs/IRB-data-flow.md`](docs/IRB-data-flow.md).

## Setup

```bash
npm install
cp .env.example .env.local      # fill in the Firebase web-app config
npx expo start
```

In Firebase console:

1. **Authentication → Sign-in method:** enable *Email/Password* (study IDs are mapped to placeholder `@peach-study.invalid` logins).
2. **Firestore rules:** `npm run deploy:rules` (uses `firestore.rules`).
3. **Study content:** edit `scripts/admin/sample-content.json` (or your own file) and upload with
   `npm run admin -- seed-content path/to/content.json`. See [`docs/content-guide.md`](docs/content-guide.md).
4. **Study IDs:** `npm run admin -- add-ids --range P- 1 300` pre-registers P-0001 … P-0300. Accounts can only be created for registered, unclaimed IDs.

The admin tool needs a service-account key: Firebase console → Project settings → Service accounts → *Generate new private key*, then `export GOOGLE_APPLICATION_CREDENTIALS=/secure/path/key.json`. Never commit the key.

## Research-team commands

| Command | What it does |
|---|---|
| `npm run admin -- add-ids P-0001 P-0002` | Pre-register study IDs |
| `npm run admin -- reset-password P-0042 NewPass123` | Reset a participant's password (no email exists) |
| `npm run admin -- unread` | List participant messages awaiting a reply |
| `npm run admin -- reply P-0042 "Thanks, fixed!"` | Reply in the participant's Contact chat |
| `npm run admin -- feedback P-0042 3 "Great week!"` | Write week-3 feedback shown in *My participation* |
| `npm run admin -- export` | Export all data (JSON + one CSV per collection), keyed by study ID |
| `npm run admin -- withdraw P-0042` | Delete a participant's data and login |

## App structure

| Area | Files |
|---|---|
| Login (study ID + password) | `src/contexts/auth-context.tsx`, `src/components/auth-screen.tsx` |
| Percy intro → app tour → reminders | `src/components/onboarding-flow.tsx`, `src/components/tutorial.tsx` |
| Scripted Percy chat with in-chat video/audio | `src/app/chat.tsx`, `src/utils/script-engine.ts`, `src/components/media-player.tsx` |
| Home: tasks, reminder board, scores | `src/app/home/index.tsx`, `src/components/goal-board.tsx`, `src/components/prosociality-card.tsx` |
| Weekly goal + if-then | `src/app/home/goal.tsx` |
| Nightly reflection / weekly survey | `src/app/home/survey.tsx`, `src/app/home/weekly-survey.tsx` |
| Streak + activity calendar | `src/app/calendar.tsx` |
| Media library (unlocked items + flashcards) | `src/app/explore.tsx` |
| Me: participation feedback, reminders, FAQ, contact, tour | `src/app/profile/*` |
| Reminder notifications (local, on device) | `src/utils/notifications.ts` |
| Firestore access | `src/utils/participant-data.ts`, `src/utils/firestore.ts` |
| Metrics, streaks, evaluation logic | `src/utils/participation.ts` (`evaluateParticipation` is a placeholder for the team's design) |

## Checks

```bash
npm run typecheck
npm run lint
npm run test:rules    # Firestore security-rules tests (needs Java for the emulator)
```

## Before launch

- Replace the placeholder weekly survey items with the validated measure (`/surveys/weekly`).
- Replace `evaluateParticipation` thresholds and wording with the team's feedback design.
- Confirm FAQ items marked `[CONFIRM]` match the approved consent form; set contact/IRB details in `/appConfig/study`.
- Host videos/audio in Firebase Storage (`url`) rather than YouTube if the IRB prefers no third-party video service.
- Choose the Firestore region/location and confirm the Google Cloud data-processing terms with your institution.
