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

- [ ] **Voice recording flow is untested**
  Microphone capture, transcription, and the `parse-voice` edge function all need a real browser with mic access and a live backend — neither was available from this sandbox.
  Files: `src/components/VoiceInputModal.tsx`, `supabase/functions/parse-voice`

- [ ] **Google sign-in is untested**
  Same story — needs live network access to Supabase and a real OAuth round-trip.
  Files: `src/pages/Auth.tsx`

## Fixed this session (for reference)

- [x] **Desktop-width pass: header email overflow**
  A desktop-width audit found the header's `user.email` span (unlike its mobile counterpart) had no `truncate`/`min-w-0`, so a long email could push the announcement/purpose/tutorial/theme/sign-out buttons off-screen. Fixed to match the mobile pattern. `PieChart.tsx` and `HoverInfo.tsx`'s breadcrumb row were also audited and found already safe.
  `src/pages/Index.tsx`

- [x] **Hover info card: long titles overflowed the card**
  Section/subsection/task titles in the pie-chart hover card had no `min-w-0`/`truncate`, so a long title could spill past the card and push the level badge or close button off-edge/out of reach. Now truncates with an ellipsis, consistent with the rest of the app.
  `src/components/HoverInfo.tsx`

- [x] **Dialog spot-check: workspace Add/Rename dialogs missing viewport gutter**
  Unlike every other dialog in the app, these two only set `max-w-sm` with no `w-[calc(100%-2rem)]` gutter, so on phones under 384px wide they sat flush against both screen edges; their Input+Button row also had no `min-w-0`, so a long typed workspace name could overflow the dialog. Fixed to match the pattern used elsewhere. `TaskEditDialog`, `OnboardingModal`, and `PurposeModeSettings` were also spot-checked and found already correct.
  `src/components/WorkspaceTabs.tsx`

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
