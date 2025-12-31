# PriorityManager

<!-- Additions:

EASY --------------------------------------------
- delete Baba's old data
    user_id = 'fcca47ad-56ff-48fe-a6d6-5baec2db2bf0';
    user_id = '7836f34c-275b-46fa-aa92-7d18edf1fcc2';

karma yoga toggle

MEDIUM --------------------------------------------
* In Add Priorities, replace section/subsection tabs with dropdowns (to reduce form length?) - in progress
* Password Recovery - nvery difficult, needs Lovable
* perform analytics on completed tasks from Supabase -- use full data for better stats
    * d3.js
    - how many days been using, total tasks completed, grouped bar chart of monthly tasks added and completed
* add text/email reminders 
    * create signup for who wants reminders
    * may need to charge for key usage

HARD --------------------------------------------
* How should I add a tutorial? Ideally, I want it to be an interactive "follow-along" tutorial where differnt parts of the website are highlighted and explained, but I'm open to making a tutorial video as a backup.
--:
Here’s a single Cursor prompt you can copy-paste and run in your codebase to set up the tutorial with **React Joyride**.

---

### Cursor Prompt (for React Joyride onboarding tour)

> You are working on a React + TypeScript app called **Priority Visualizer**. I want you to integrate **react-joyride** to create a guided onboarding tour.
>
> **Tech context**
>
> * The app is a single-page dashboard with:
>
>   * A header/top bar with logo and app name (“Priority Vizualizer”), menu button, theme toggle, and target completion date bar.
>   * A metrics row (cards for Tasks, Sections, Overdue, Due Today, Due Soon, Completed Today, Total).
>   * A large **Priority Display** sunburst chart in the center/left.
>   * A right-hand panel labeled **“Add Priorities”** with tabs (Section / Subsection / Task) and a form.
>   * A tooltip/placeholder card above the Add Priorities panel that shows instructions when no slice is selected.
>   * A Menu that will have a **“Take a Quick Tour”** entry.
> * The design uses dark mode, React, and TypeScript. Assume functional components and hooks.
>
> ---
>
> ### 1. Install and wire react-joyride
>
> 1. Add `react-joyride` as a dependency.
> 2. Create a new file `src/tutorial/TourProvider.tsx` that:
>
>    * Exports a React context/hook pair, e.g. `TourContext` and `useTour()`.
>    * Manages:
>
>      * `run` (boolean, whether the tour is running)
>      * `stepIndex` (current step index)
>      * `startTour(tourId?: string)` – begins the main “overview” tour
>      * `stopTour()` – stops and resets
>      * `hasCompletedTour` – boolean from `localStorage` key like `"priorityviz_tour_completed"`.
>    * Renders a `<Joyride />` component configured in **controlled mode** using the context state.
>
>      * Use these recommended options:
>
>        * `continuous: true`
>        * `showSkipButton: true`
>        * `showProgress: true`
>        * `disableOverlayClose: true`
>        * `spotlightPadding` on steps (we will set per-step later).
>        * `styles` tuned for dark mode (no need to match exact colors, just make it readable on a dark background).
>    * Handles Joyride callbacks (`callback` prop) to:
>
>      * Advance `stepIndex` on “next”.
>      * Go back on “prev”.
>      * Mark `hasCompletedTour` in localStorage when the tour finishes or when the user hits Skip on the last step.
> 3. Wrap the root of the app (e.g. `<App />` or main layout component) in `<TourProvider>` so the tour is available everywhere.
>
> ---
>
> ### 2. Add stable targets for each step
>
> In the relevant components, add **data attributes** or refs that we can target from Joyride.
>
> Add `data-tour` attributes with these exact values:
>
> 1. Header logo/app name: `data-tour="app-logo"`
> 2. Metrics row container: `data-tour="metrics-row"`
> 3. Priority Display chart container: `data-tour="priority-display"`
> 4. The “Hover over the pie chart to see details / Click to select a slice” card: `data-tour="chart-helper-card"`
> 5. Add Priorities panel container: `data-tour="add-priorities"`
> 6. The Task form inside the Add Priorities panel (where user types title/description): `data-tour="task-form"`
> 7. The Menu button in the header: `data-tour="menu-button"`
> 8. (Optional) The target completion date range bar: `data-tour="target-date-bar"`
>
> Make sure these attributes are on elements that are always rendered and big enough for Joyride’s spotlight to look good.
>
> ---
>
> ### 3. Define the “Overview” tour steps
>
> Create a new file `src/tutorial/steps.ts` and export an array `overviewSteps` of Joyride step configuration objects.
>
> Implement the steps with roughly this content (feel free to adjust wording to be concise and friendly):
>
> 1. Target `data-tour="app-logo"`
>
>    * Title: “Welcome to Priority Visualizer”
>    * Content: Short sentence explaining that this app helps visualize and manage priorities across all areas of life.
>    * Placement: bottom.
> 2. Target `data-tour="metrics-row"`
>
>    * Title: “At-a-glance stats”
>    * Content: Explain that these cards show counts of tasks, sections, overdue items, and progress for today.
>    * Placement: bottom.
> 3. Target `data-tour="priority-display"`
>
>    * Title: “Your priority map”
>    * Content: Explain the sunburst: inner rings are high-level life sections, outer rings are subsections and tasks; colors correspond to section colors.
>    * Placement: right.
> 4. Target `data-tour="chart-helper-card"`
>
>    * Title: “Interact with the chart”
>    * Content: Explain hover to see details, click to select a slice, and that selecting a slice will show its details and make it easier to add tasks.
>    * Placement: left or bottom.
> 5. Target `data-tour="add-priorities"`
>
>    * Title: “Add priorities and tasks”
>    * Content: Explain this side panel is where you add sections, subsections, and tasks, and that tasks drive what appears in the chart.
>    * Placement: left.
> 6. Target `data-tour="task-form"`
>
>    * Title: “Describe your task”
>    * Content: Explain that users can name the task, optionally add a description, due date, and mark it high priority.
>    * Placement: left.
> 7. Target `data-tour="target-date-bar"`
>
>    * Title: “Set your target completion date”
>    * Content: Explain that this bar helps them anchor their goals to a timeline.
>    * Placement: bottom.
> 8. Target `data-tour="menu-button"`
>
>    * Title: “Need help later?”
>    * Content: Mention that they can always reopen this tour and view updates from the Menu.
>    * Placement: bottom-left.
>
> For each step, set:
>
> * `disableBeacon: true` (we will start the tour programmatically, no beacons for now).
> * `spotlightPadding` so the highlighted region doesn’t feel cramped (e.g. a medium padding value).
>
> Import `overviewSteps` into `TourProvider` and pass it to Joyride.
>
> ---
>
> ### 4. Auto-start tour for first-time users
>
> In `TourProvider`:
>
> * On mount, read `localStorage` for the `priorityviz_tour_completed` flag.
> * If not completed, automatically start the `overview` tour the first time the app loads.
> * Make sure this only runs after the main layout has rendered, so all `data-tour` targets are in the DOM. If needed, wait for one tick (e.g. using `setTimeout` or an effect that depends on a “layout ready” state).
>
> ---
>
> ### 5. Expose a Menu item to restart the tour
>
> In the Menu component:
>
> * Use the `useTour()` hook from `TourProvider`.
> * Add a menu entry labeled **“Take a Quick Tour”**.
> * On click, call `startTour('overview')` and close the Menu.
>
> Make sure this works even after the tour has been completed once; the completion flag should only control auto-start, not manual restart.
>
> ---
>
> ### 6. Dark mode styling
>
> Style Joyride so it blends with the existing dark layout:
>
> * Popover background: use a dark gray close to your card background.
> * Text: light gray, not pure white.
> * Buttons: use your existing primary accent color and a low-contrast outline for the secondary button.
> * Remove overly large drop-shadows or neon glows; keep it subtle.
>
> Configure these styles through the `styles` prop on Joyride, using your existing design tokens / tailwind classes as a guide.
>
> ---
>
> ### 7. Basic resilience and a11y
>
> * Handle the case where a step’s target isn’t found (e.g. during loading): skip that step gracefully instead of breaking the tour.
> * Ensure the popover traps keyboard focus while the tour is active and allows Escape to exit.
>
> After implementing all of the above, clean up types, ensure no TypeScript errors, and run the app to verify:
>
> * First-time load → tour auto-starts.
> * Steps are correctly positioned on top of the relevant components.
> * Menu → “Take a Quick Tour” restarts the tour.
> * `localStorage` correctly tracks completion and prevents auto-start after the first run.

---

You can tweak any wording above, but if you paste this whole thing into Cursor, it should have enough context to set up a solid Joyride-based tutorial for your app.




* multiple projects under 1 account
* maybe add RLS back for Supabase tables (since all the content is shared in the section, subsection, tasks)




* The tasks completed today still don't show the actual tasks:
    - I tested this by completing a task from Job Apps > Aai > 1-5 and although the full total got incremented to show 1, the daily total remains 0 and clicking on that tab opens what I've shown in the image
    


 -->

[![Netlify Status](https://api.netlify.com/api/v1/badges/f82ec177-3285-41d2-a908-16504cb41a30/deploy-status)](https://app.netlify.com/projects/priorityviz/deploys)

A modern, interactive priority management application that helps you visualize and organize your tasks across different areas of life using an intuitive pie chart interface.

## 🎯 Use Cases

- **Academic Planning**: Organize courses, assignments, and deadlines
- **Job Search Management**: Track applications, interviews, and networking
- **Personal Projects**: Manage hobby projects and personal goals
- **Work Task Management**: Organize professional responsibilities
- **Fitness Planning**: Track workout routines and health goals

## ✨ Features

### **Interactive Pie Chart Visualization**
- Multi-level hierarchical pie chart showing Sections → Subsections → Tasks
- Real-time visual feedback with hover effects and color-coded segments
- Dynamic sizing based on task counts and priority levels

### **Hierarchical Task Organization**
- **Sections**: High-level categories (e.g., Academic, Work, Personal)
- **Subsections**: Specific areas within sections (e.g., DATA 255, Project Alpha)
- **Tasks**: Individual actionable items with due dates

### **Dual Storage Options**
- **Save to Supabase**: Cloud-based storage with user authentication
- **Save to Computer**: Export data as timestamped JSON files

### **Task Management**
- Due date tracking with urgency indicators
- Upcoming tasks dashboard (next 3 days)
- Task completion status tracking

## 🎓 How to Use Priority Manager

Priority Manager uses a simple 3-level hierarchy: **Sections** → **Subsections** → **Tasks**

**Key Interface Areas:**
- **Statistics Bar** (top): Shows sections, total tasks, due soon, and completed today
- **Interactive Pie Chart** (center): Visual representation of your priorities
- **Add Priorities Form** (right): Create new sections, subsections, and tasks

### Building Your Priority Structure

1. **Add a Section**: Use the "Add Priorities" form, select "Section" tab, enter title (e.g., "Academic")
2. **Add Subsections**: Select "Subsection" tab, choose section, add title (e.g., "DATA 255")
3. **Add Tasks**: Select "Task" tab, choose section/subsection, add title and due date

### Using the Pie Chart

- **Hover**: Move mouse over slices to see details
- **Click**: Click any slice to "pin" information in details panel
- **Colors**: Each section has unique colors (customizable)
- **Size**: Larger slices = more tasks in that area

### Saving Your Data

- **To Computer**: Downloads JSON file (no account needed)
- **To Supabase**: Cloud storage with user authentication
- **Load**: Upload JSON files or sign in for cloud sync

### Customization
- **Change Colors**: Click on any section in the chart to change its color
- **Edit Items**: Double-click on sections, subsections, or tasks to edit
- **Delete Items**: Use the delete buttons in the interface

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Auth)
- **Charts**: Custom SVG-based pie chart implementation
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod validation
- **State Management**: React hooks
- **Routing**: React Router DOM

## 🗄️ Database Schema

The application uses a hierarchical database structure:

```sql
sections (id, user_id, title, color, created_at, updated_at)
├── subsections (id, section_id, title, created_at, updated_at)
    └── tasks (id, subsection_id, title, due_date, completed, created_at, updated_at)
```

## 🔒 Authentication & Security

- User authentication via Supabase Auth
- Row Level Security (RLS) ensures users only see their own data
- Secure API endpoints with proper authorization
- Client-side and server-side data validation

## 📢 User Communication System

The app includes a built-in announcement system for communicating with users:

- **One-time alerts**: Show important messages to users on their next login
- **Severity levels**: Info, Success, Warning, Error with appropriate visual styling
- **Smart tracking**: Each user sees announcements only once
- **Easy management**: CLI tool for creating and managing announcements

**For administrators**: See [`ANNOUNCEMENTS-GUIDE.md`](./ANNOUNCEMENTS-GUIDE.md) for detailed documentation or [`QUICK-ANNOUNCEMENTS.md`](./QUICK-ANNOUNCEMENTS.md) for quick reference.

**Quick example**:
```bash
node create-announcement.mjs
# Follow prompts to create announcements
```


