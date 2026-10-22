# Authoring study content

All participant-facing content lives in Firestore and can be changed without a new app release. The easiest way to edit it is one JSON file uploaded with:

```bash
npm run admin -- seed-content path/to/content.json
```

`scripts/admin/sample-content.json` shows every format.

## Percy scripts (`/scripts/{id}`)

One document per session. The app shows the script whose `studyDay` (1–63) and `slot` (`morning` / `evening`) match the participant's current day and the session they open.

Each script has an ordered list of **segments**:

| `type` | What happens | Fields |
|---|---|---|
| `message` (default) | Percy says `content` | `content` |
| `video` / `audio` | Percy says `content` (optional), then shows a player. The item is added to the participant's Library. Starting the video ticks off "Watch today's video". | `content`, `mediaId` |
| `choice` | Percy asks `content`; participant taps one of `options`. Percy then says `replies[option]`, or `reply`, if given. | `content`, `options`, `replies`, `reply` |
| `input` | Percy asks `content`; participant types a short answer (max 1,000 characters). Percy then says `reply`. | `content`, `placeholder`, `reply` |

`{name}` in any Percy line is replaced with the nickname the participant chose (stored only on their phone).

A session is marked complete when its last segment has been shown. Every answer is saved to `participants/{uid}/chatLogs/d{day}-{slot}` with a timestamp.

Branching beyond per-option replies is not supported yet; tell the developer if a script needs it.

## Media library (`/media/{id}`)

Each Library week holds **two videos and two flashcards** (plus, from week 2, the participant's if-then plan at the top). Give each item its `week` and an `order` so videos and cards alternate.

| Field | Notes |
|---|---|
| `title`, `type` | `video`, `audio` or `text` |
| `youtubeId` **or** `url` | `url` should be an https link to a file in Firebase Storage (recommended: no third party involved) |
| `body` | Text for `text` items (informational messages) |
| `week` | Which Library week (1–9) the item is listed under |
| `psychoed` | `true` for the week's psychoeducation video; listed right after the participant's if-then plan unless other items have a lower `order` |
| `day`, `order` | Day label shown on the row ("Monday") and position in the week (lower comes first; the psychoed video counts as 0, so use negative numbers to place something before it); flashcards share the same `order` numbers so videos and cards interleave |
| `durationLabel`, `description` | Display only |
| `availableFromDay` | Optional: unlock automatically on that study day, without Percy sending it |

## Weekly survey (`/surveys/weekly`)

`version`, `instructions`, `scaleMin`, `scaleMax`, `minLabel`, `maxLabel`, and `items: [{ id, text, reverse? }]`. The score shown to participants is the item mean with `reverse` items flipped. Raw responses and `version` are saved with each submission, so you can rescore later. The survey opens every Sunday for `appConfig/study.weeklySurveyOpenDays` days (default 3).

## FAQ (`/faq/{id}`)

`question`, `answer`, `order`. If the collection is empty, the built-in defaults in `src/constants/content-defaults.ts` are shown.

## Study settings (`/appConfig/study`)

`studyLengthDays`, `weeklySurveyOpenDays`, `contactEmail`, `contactPhone`, `irbProtocol`, `irbContact`.

## Flashcards (`/flashcards/{weekId}/cards/{cardId}`)

`front`, `back`, `type`, and optional `order` (position among that week's videos). Each Library week unlocks on the Sunday the participant reaches it.
