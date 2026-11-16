# Crushwave

A dating, friends and study-partner app for verified university students in Ghana. It's for Android and iOS, built with Expo (React Native) and Supabase.

Only students with an email address from an enabled school can join. At launch that means UPSA only (`@upsamail.edu.gh`).

## What's in the app (MVP)

- **Sign-in with a 6-digit email code.** There's no password. Gmail and other non-school emails are blocked by the database itself, not just by the app.
- **18+ check, community rules and privacy consent** before anyone can make a profile.
- **Profile:** 3 to 6 photos, first name only, age (never the birthday), programme, level, hall, bio, up to 10 interests and up to 3 prompts.
- **Here for:** dating, new friends or a study partner.
- **Discover:** like or pass, with filters for level, programme, hall and "here for". A match happens only when both people like each other.
- **Chat** opens only after a match. It updates live and warns people about money requests and phone numbers.
- **Safety:**
  - Report, block and unmatch on every profile and chat. Reporting also blocks the person.
  - Reports of someone under 18 or of threats suspend the account until it's reviewed.
- **Privacy controls:**
  - Pause your profile.
  - Hide from people in your programme or your level.
  - Set an age range.
- **Selfie verification** (blue tick). A moderator approves it.
- **Push notifications** for new matches and messages. These need a real build, not Expo Go.
- **Delete my account**, which removes the profile, photos, matches and chats.
- **Safety Centre** with Ghana emergency numbers (Police 191, Ambulance 193, DOVVSU 055 100 0900).

## Security model

- **Row-level security is on for every table.** People can only read and change their own rows. Other students' profiles are only available through `get_discovery` and `get_my_matches`, which return public fields only (no email, no birthday).
- **Column-level grants.** Users can't change their school, verification badge, account status or date of birth.
- **Photos are in a private bucket.** They're served through 1-hour signed links, only to signed-in students of the same school who aren't blocked. Photos are re-encoded on the phone before upload, which strips GPS and other hidden data.
- **The app only holds the publishable key.** Service keys never go in the app or this repo.
- **Rate limits:** 300 swipes a day, 20 messages a minute, 10 reports a day.
- **Sign-in sessions** are stored in the phone's secure keychain or keystore.
- **No location, contacts or microphone permissions** are requested. They're blocked in `app.json`.

The database is defined in `supabase/migrations/`. The small website (home, privacy and the email-confirmed page) is in `web/` and is hosted on Vercel.

## Supabase project

- Project: **Crushwave**, ref `ccefprnjkgdpbqbwjlso`, region eu-west-2 (London).
- Dashboard: https://supabase.com/dashboard/project/ccefprnjkgdpbqbwjlso

### One-time dashboard settings (needed before sign-in works)

1. **Show the code in the email.** Go to Authentication → Emails → Templates. In **both** "Confirm signup" (the first email a new student gets) and "Magic Link" (every sign-in after that), replace the body with:

   ```html
   <h2>Your Crushwave code</h2>
   <p>Enter this code in the app: <strong style="font-size:24px">{{ .Token }}</strong></p>
   <p>It expires in 10 minutes. If you didn't ask for it, ignore this email.</p>
   ```

2. **Make codes short-lived.** Go to Authentication → Providers → Email. Set "Email OTP Expiration" to `600` seconds and "Email OTP Length" to `6`.
3. **Set up a real email sender.** Go to Authentication → Emails → SMTP Settings. Supabase's built-in sender only delivers to your own team's addresses and only a few per hour, so students won't get codes until you connect an email sender. Brevo (free, 300 emails a day) or Resend both work.
4. **Point links at the website.** Go to Authentication → URL Configuration and set "Site URL" to `https://crushwave.vercel.app/confirmed`. Without this, any link in an email opens `localhost`.
5. **Turn off sign-in methods you don't use.** Under Authentication → Providers, keep only Email on. Phone and anonymous sign-ins should stay off.

## Moderation (until there's an admin screen)

Use the Supabase Table Editor.

- **Reports:** open the `reports` table and filter `status = open`. After reviewing a report, set its status to `actioned` or `dismissed`.
- **Suspend or ban:** in `profiles`, set `status` to `suspended` or `banned`. To stop a banned person from signing up again, add their email to `banned_emails`.
- **Selfie verification:** open `verification_requests` and view the selfie in Storage → `verifications`. Set `status` to `approved` to give the blue tick automatically, or to `rejected`.
- **Add another school:** insert a row in `schools` with its email domains and set `enabled = true`. You don't need to rebuild the app.
- **App store reviewer account:** add their exact email to `email_exceptions`, linked to a school.
- **Demo profiles:** 9 demo men and 10 demo women (marked `is_demo` in `profiles`, seeded by `supabase/demo/seed_demo_profiles.sql`) are there for testing. Liking one matches straight away and they send the first message. Their photos are AI-generated. Remove them before launch by running `supabase/demo/remove_demo_profiles.sql` in the SQL Editor.

## Running the app

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go. Push notifications need a real build:

```bash
npx eas-cli@latest build --profile preview --platform android
```

## Before public launch

- [ ] Register with Ghana's Data Protection Commission.
- [ ] Have a lawyer review the privacy page (`web/privacy.html`, live on the Vercel site) and set `SUPPORT_EMAIL` in `src/lib/constants.ts`.
- [ ] Set up a real email sender (SMTP) and the code email template.
- [ ] Upgrade to Supabase Pro for daily backups.
- [ ] Create Google Play and Apple developer accounts.
- [ ] Add the reviewer demo account.
- [ ] Turn on automatic photo scanning for nudity.
- [ ] Remove the demo profiles (`supabase/demo/remove_demo_profiles.sql`).
