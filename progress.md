I want to add an optional effort-based interaction to my task management app inspired by the idea of “I worked on this” (process-focused progress), without changing how task completion works.
Concept & Intent
* This feature represents effort, presence, or right action, not task completion.
* Marking a task as “worked on today” should not complete the task, remove it from the chart, or affect due dates.
* It should coexist with the existing completion-based workflow.
UI / UX Requirements
* Add a subtle secondary action next to each task (near “High Priority”), labeled something like:
    * “Worked on today”
    * or “Mark effort”
* This should be a soft button or icon, not a radio button and not mutually exclusive with other task states.
* Clicking it:
    1. Triggers a lightweight animation (e.g., a small flower or star flying toward a purpose anchor).
    2. Increments a daily effort counter (separate from completed tasks).
    3. Provides brief, non-intrusive feedback (e.g., “Effort recorded”).
Karma Yoga / Purpose Overlay
* If a user has “Purpose Mode” enabled:
    * Display a small anchor in the UI in the center of the header bar, between the title on the left and the username, Updates, Target Completion, etc on the right(allow users to upload a 256x256px image of their choice e.g. Ishta Devata or “Best Self” icon).
    * The animation should visually move from the task to this anchor.
* This overlay is purely visual and motivational.
* It should be optional and scoped per user, not global.
Data & State Handling
* Track effort separately from completion.
* Effort is day-scoped, not permanent task state.
* Prevent multiple effort increments for the same task on the same day.
* Suggested data shape (conceptual, not prescriptive):
    * task_id
    * date
    * user_id
Analytics
* Add support for:
    * Daily effort count
    * Effort streak (days with ≥1 effort action)
* Do NOT mix effort metrics with completion metrics.
Constraints (Important)
* Do not alter existing task completion logic.
* Do not auto-complete tasks.
* Do not inflate task analytics.
* Keep the interaction lightweight and optional.
Technical Expectations
* React + TypeScript
* Clean separation between “completion” and “effort”
* Easy to disable - toggle on/off
* Designed to scale later (e.g., reflections, notes, or purpose-based analytics)
Implement this feature in a way that feels calm, intentional, and non-gamified, while still reinforcing a sense of continuous progress.
