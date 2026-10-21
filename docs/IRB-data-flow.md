# PEACH app: data flow and privacy summary

Prepared for IRB review and for the development team. Describes the app as built on branch `feature/full-study-app`. Items marked **[TO CONFIRM]** need a decision by the research team or IRB before launch.

## In one paragraph

Participants sign in with a research-issued study ID and a password they choose. The app never asks for a name, email, phone number or location. All study data (task completion, survey answers, chat answers, goals, messages to the team) is stored in a Google Firebase project controlled by the research team, keyed only by the study ID. Percy, the coach, is fully scripted: participants' replies are not sent to OpenAI, Anthropic, Google AI or any other AI service. The app contains no analytics, advertising or crash-reporting SDKs. The key linking study IDs to real identities is kept by the research team outside the app.

## Data collected

| Data | Purpose | Stored where | Identifier | Visible to |
|---|---|---|---|---|
| Study ID + password | Sign-in | Firebase Authentication (password is hashed by Google; the team cannot see it) | Study ID | Research team (ID only) |
| Nickname | Percy greets participant by name | **Participant's phone only** | – | Nobody else |
| Start date, time zone, reminder times | Day counting, reminders | Firestore `participants/{uid}` | Study ID | Research team |
| Daily task completion + timestamps | Progress, streak, adherence | Firestore `…/days` | Study ID | Research team |
| Nightly reflection: 16 emotion ratings + "did you do the activity" | Outcome / adherence measure | Firestore `…/dailySurveys` | Study ID | Research team |
| Weekly prosociality survey responses + score | Outcome measure | Firestore `…/weeklySurveys` | Study ID | Research team |
| Weekly goal and if-then plan (free text) | Intervention component | Firestore `…/goals` | Study ID | Research team |
| Percy chat answers (button choices and short free-text replies), video starts | Intervention fidelity / engagement | Firestore `…/chatLogs` | Study ID | Research team |
| Messages to the research team (free text) | Participant support | Firestore `…/support` | Study ID | Research team |
| Media unlocked | Library | Firestore `…/unlocks` | Study ID | Research team |
| Feedback written by the team | Participation feedback | Firestore `…/feedback` | Study ID | Participant (read-only) and team |

## Not collected

Name, email, phone number, date of birth, address or GPS location, contacts, photos, microphone/camera, device or advertising identifiers, push-notification tokens, IP-based analytics, or usage analytics of any kind.

## Third parties

| Service | Role | What it receives |
|---|---|---|
| Google Firebase (Authentication, Cloud Firestore) | Data processor / hosting | Everything in the table above, encrypted in transit (TLS) and at rest. Governed by Google Cloud's data-processing terms. **[TO CONFIRM]** Firestore location (e.g. `us-east4`) and whether Georgetown requires a signed agreement. |
| YouTube (only if videos use `youtubeId`) | Video playback | When a participant taps play: the device's IP address and the video ID. Uses `youtube-nocookie.com` with no referrer and cookies disabled, and no participant data in the URL. **Recommended:** host videos in Firebase Storage instead (`url`), which removes YouTube entirely. **[TO CONFIRM]** |
| Apple App Store / Google Play / TestFlight | App distribution | Standard store account data, as for any app. Not linked to study data. |
| AI providers | **None.** Percy is scripted. | Nothing |

Reminder notifications are scheduled locally on the phone at the participant's chosen times. No push service or device token is used. Notification text is generic ("Percy has your morning check-in ready") so a lock screen does not reveal study content.

## Access control

- Firestore security rules (`firestore.rules`) let each signed-in participant read and write **only their own records**, and only read study content. Participants cannot edit submitted surveys, team feedback, or impersonate team replies. Nothing is publicly readable.
- Accounts can only be created for study IDs the team has pre-registered, and each ID can be claimed once.
- The research team accesses data through the Firebase console (Google accounts with 2-step verification) or the admin tool, which uses a service-account key kept off the repository. **[TO CONFIRM]** list of team members with project access.
- Data exports (`npm run admin -- export`) are keyed by study ID only and should be stored on approved, access-controlled institutional storage.

## On the participant's phone

The app caches progress and the nickname in app storage so it opens quickly offline. Signing out clears this cache and cancels reminders. Uninstalling the app removes it.

## Free-text responses

Goals, if-then plans, chat replies and support messages are free text, so a participant could type identifying information (for example, a friend's name). **[TO CONFIRM]** whether the consent form should mention this, and whether the team will review or redact free text before analysis.

## Safety

The Contact screen states it is not monitored around the clock and lists 988 (US) for crises. **[TO CONFIRM]** monitoring frequency, the team's response protocol, and whether Percy scripts should include safety messaging.

## Withdrawal and retention

Participants can ask to withdraw through Contact the research team. `npm run admin -- withdraw <ID>` deletes their app data and login. **[TO CONFIRM]** whether already-collected data is retained or deleted on withdrawal (must match the consent form) and the overall retention period after the study.

## Before launch checklist

- [ ] Firestore location chosen and Google Cloud terms confirmed with Georgetown
- [ ] Videos/audio hosted in Firebase Storage, or YouTube use approved
- [ ] FAQ items marked [CONFIRM] match the approved consent form
- [ ] Contact email, IRB protocol number and IRB contact set in `appConfig/study`
- [ ] Weekly survey replaced with the validated measure
- [ ] Project access limited to approved team members; service-account keys stored securely
- [ ] `npm run test:rules` passes against the deployed rules
