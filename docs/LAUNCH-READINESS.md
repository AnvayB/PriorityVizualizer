# Priority Viz — Launch Readiness Punch List

Findings from a Product Hunt readiness pass on the Quick Add, mobile task list, and sign-in flows. One blocker needs Supabase dashboard access; everything else fixed is already committed on `claude/section-boundaries-overflow-8rcwyj`.

## Blocker (must fix before launch)

- [ ] **Guest login fails on the live site**
  "Continue as Guest" signs in as a fixed `guest@example.com` account. Sign-up on this project requires email confirmation, so if that account was ever created the normal way, it's likely stuck unconfirmed forever — nobody can click a link sent to a fake inbox.
  **Fix:** In Supabase Dashboard → Authentication → Users, search for `guest@example.com`. If missing, add it manually with "Auto Confirm User" checked, password `guestuser`. If it exists but unconfirmed, confirm it manually or recreate it with auto-confirm.
  Files: `src/pages/Auth.tsx` (`handleGuestLogin`)

## To verify before launch

- [ ] **Re-check every fix below on a real phone**
  Everything fixed this session was verified in headless Chromium at fixed viewport sizes, not a real device. iOS Safari in particular handles the keyboard and viewport resize differently.
  Areas: iOS Safari, Android Chrome

- [ ] **No desktop-width pass yet**
  This audit only covered the mobile view (`MobileView.tsx`). The desktop layout — the pie chart panel, hover info, wide-screen dialogs — hasn't been looked at.
  Files: `src/pages/Index.tsx`, `src/components/HoverInfo.tsx`, `src/components/PieChart.tsx`

- [ ] **Several dialogs were never opened this pass**
  Task edit, workspace add/rename/delete, onboarding, announcements, and purpose-mode settings all use the same dialog primitive that had the overflow bug — worth a quick look now that it's fixed at the source.
  Files: `TaskEditDialog` (in `MobileView.tsx`), `src/components/WorkspaceTabs.tsx`, `src/components/OnboardingModal.tsx`, `src/components/PurposeModeSettings.tsx`

- [ ] **Voice recording flow is untested**
  Microphone capture, transcription, and the `parse-voice` edge function all need a real browser with mic access and a live backend — neither was available from this sandbox.
  Files: `src/components/VoiceInputModal.tsx`, `supabase/functions/parse-voice`

- [ ] **Google sign-in is untested**
  Same story — needs live network access to Supabase and a real OAuth round-trip.
  Files: `src/pages/Auth.tsx`

## Fixed this session (for reference)

- [x] **Quick Add breadcrumb ran off the screen**
  Section/Subsection pills used `flex-1` with no minimum width, so a long title couldn't shrink and pushed the row past the edge.
  `src/components/PriorityForm.tsx`

- [x] **Every dialog could overflow its own box**
  The shared dialog had no explicit grid column, so CSS sized it to fit its widest child instead of the screen — a classic grid-blowout bug affecting every modal in the app.
  `src/components/ui/dialog.tsx`

- [x] **Enter submitted the "Type to add tasks" box (twice)**
  Fixed once, then reintroduced by a parallel branch that merged in before the fix landed. Removed again — Enter now just makes a new line.
  `src/components/VoiceInputModal.tsx`

- [x] **Typing modal popped the keyboard open on mobile**
  Radix auto-focuses the first focusable element in a dialog; on mobile that opened the keyboard instantly and scrolled the title off-screen. Focus now stays put until the user taps in.
  `src/components/VoiceInputModal.tsx`

- [x] **Tasks due today didn't read as high priority**
  Added a rule so a task counts as high priority if it's manually flagged *or* due today — wired into the task icon, the pie chart glow, and the status badges.
  `src/utils/taskPriority.ts`, `src/components/PieChart.tsx`, `src/components/MobileView.tsx`

- [x] **Status pill row overflowed on every load**
  Due Today / Overdue / Due Soon had the exact same missing-min-width bug as the breadcrumb, just never caught until this pass.
  `src/components/MobileView.tsx`

- [x] **Quick Add showed blank pills with nothing selected**
  Radix's `Select.Value` only renders its children once a value exists; with nothing picked yet it silently shows nothing instead of a hint. Moved the hint text into the `placeholder` prop.
  `src/components/PriorityForm.tsx`

- [x] **Sign-up password hint clipped mid-word**
  "Create a password (min 6 characters)" didn't fit a narrow input and cut off as "…min 6 cha". Shortened it.
  `src/pages/Auth.tsx`

- [x] **Guest-login failure hid the real error**
  Swapped the hardcoded message for the actual Supabase error, so the blocker above is diagnosable from the toast instead of guessed at.
  `src/pages/Auth.tsx`
