# Priority Visualizer - User Tutorial & Documentation

Welcome to Priority Visualizer! This comprehensive guide will help you get started and make the most of all the features available in this powerful priority management application.


<!-- 

main page:


 -->


## Table of Contents

1. [Getting Started](#getting-started)
2. [Understanding the Interface](#understanding-the-interface)
3. [Building Your Priority Structure](#building-your-priority-structure)
4. [Working with Tasks](#working-with-tasks)
5. [Using the Interactive Chart](#using-the-interactive-chart)
6. [Progress Mode (Purpose Anchor)](#progress-mode-purpose-anchor)
7. [Tracking Your Progress](#tracking-your-progress)
8. [Managing Deadlines](#managing-deadlines)
9. [Customization Options](#customization-options)
10. [Data Management](#data-management)
11. [Tips & Best Practices](#tips--best-practices)
12. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Signing In

When you first visit Priority Visualizer, you'll need to create an account or sign in:

1. Click the **Sign In** button
2. Enter your email address
3. Enter a secure password
4. Click **Sign In** (or **Sign Up** if it's your first time)

> **Note**: Your data is automatically saved to the cloud, so you can access it from any device once signed in.

### First Steps After Signing In

Once you're signed in, you'll see the main dashboard. Here's what to do first:

<!-- 1. **Set Your Target Completion Date** (optional but recommended)
   - Look for the "Target Completion" date in the header
   - Click it to set your overall goal deadline
   - This helps you visualize progress toward your goals -->

1. **Add Your First Sections**
   - Use the "Add Priorities" panel on the right
   - Start with a high-level category (e.g., "Academic", "Work", "Personal")

2. **Explore the Interface**
   - Hover over different areas to see tooltips
   - Click on cards to see detailed views
   - Familiarize yourself with the layout

---

## Understanding the Interface

### Main Layout

The Priority Visualizer interface consists of several key areas:

#### 1. Header Bar
Located at the top of the screen, the header contains 4 toggle buttons:
- **Announcement History**: View past announcements from the app
- **Progress Mode Settings**: Configure your [Purpose Anchor](#progress-mode-purpose-anchor)
- **Theme Toggle**: Switch between Light, Dark, and System themes
- **Sign Out**: Log out of your account

#### 2. Statistics Dashboard
A row of cards showing key metrics:
- **Tasks**: Total number of tasks across all sections
- **Sections**: Number of high-level categories
- **Due Today**: Tasks due today (click for details)
- **Overdue**: Tasks past their due date (click for details)
- **Due Soon**: Tasks due in the next 5 days (click for details)
- **Completed Today**: Tasks completed today with total count (click for analytics)

#### 3. Priority Display (Sunburst Chart)
The large interactive chart in the center-left showing your priorities:
- **Inner Ring**: Sections (high-level categories)
- **Middle Ring**: Subsections (specific areas within sections)
- **Outer Ring**: Tasks (individual actionable items)
- **Colors**: Each section has its own color
- **Size**: Larger slices indicate more tasks

#### 4. Details Panel
When you click or hover over a part of the chart, a Details panel appears above the "Add Priorities" area to show more about what you selected.
- Shows information about hovered or selected chart slices
- Displays Section/Subsection/Task details
- Provides action buttons (Edit, Delete, Complete, etc.)

#### 5. Add Priorities Form
The right sidebar panel for creating new items:
- **Three Tabs**: Section, Subsection, and Task
- **Form Fields**: Title, due dates, descriptions, priorities
- **Quick Actions**: Pre-filled forms when clicking chart slices

---

## Building Your Priority Structure

Priority Visualizer uses a **three-level hierarchy**:

```
Section → Subsection → Task
```

### Understanding the Hierarchy

- **Section**: High-level life category (e.g., "Academic", "Job Search", "Personal")
- **Subsection**: Specific area within a section (e.g., "DATA 255", "Resume Updates", "Gym Routine")
- **Task**: Individual actionable item (e.g., "Complete homework 3", "Apply to Company X", "Leg day workout")

### Adding a Section

1. In the "Add Priorities" panel, ensure the **Section** tab is selected
2. Enter a title for your section (e.g., "Academic")
3. Click **Add Section**
4. The section will appear in the pie chart immediately

**Tips**:
- Use broad categories that encompass multiple areas
- Examples: "Academic", "Work", "Personal", "Health", "Financial"

### Adding a Subsection

1. Select the **Subsection** tab in the "Add Priorities" panel
2. Choose the parent **Section** from the dropdown
3. Enter a subsection title (e.g., "DATA 255")
4. Click **Add Subsection**

**Tips**:
- Subsections help organize tasks within a section
- Examples: Course names, project names, specific goals

### Adding a Task

1. Select the **Task** tab
2. Choose the parent **Section** from the first dropdown
3. Choose the parent **Subsection** from the second dropdown
4. Enter a task title
5. (Optional) Add a due date using the date picker
6. (Optional) Add a description
7. Click **Add Task**

**Tips**:
- Be specific with task titles
- Use due dates for time-sensitive tasks
- Descriptions help add context

### Quick Add Method

You can quickly add subsections or tasks by clicking on chart slices:
- **Click a Section** → Opens Subsection form with that section pre-filled
- **Click a Subsection** → Opens Task form with section and subsection pre-filled

---

## Working with Tasks

### Task Properties

Each task can have:
- **Title**: The task name
- **Due Date**: When the task should be completed
- **Description**: Additional details (optional)
- **High Priority**: Flag for urgent/important tasks
- **Effort Tracking**: Mark when you've worked on the task

### Editing Tasks

1. **Hover** over a task slice in the chart, or **click** to pin it
2. In the details panel, click the **Edit** button
3. Modify the title, due date, or description
4. Click **Save**

### Marking Tasks as High Priority

1. Select a task in the chart
2. In the details panel, check the **High Priority** checkbox
3. High priority tasks display with a distinctive border in the chart

### Recording Effort on Tasks

Effort tracking helps you visualize daily progress:

1. Select a task in the chart
2. In the details panel, find the **"Worked on today"** button
3. Click it to record effort for today
4. The button will change to "Worked on" (disabled) after recording
5. If Progress Mode is enabled, an icon will appear around your purpose anchor

**Note**: You can only record effort once per task per day. The count resets at midnight PST.

### Completing Tasks

1. Select a task (or section/subsection)
2. Click the **Complete** button in the details panel
3. Confirm the action
4. The task is removed and added to your completion statistics

**Important**: 
- Completing a section or subsection will complete ALL tasks within it
- This action cannot be undone
- Completed tasks are permanently deleted but counted in your statistics

### Viewing Task Details

Click on any of the statistics cards to see detailed views:
- **Due Today**: Shows all tasks due today
- **Due Soon**: Shows tasks due in the next 5 days
- **Overdue**: Shows tasks past their due date
- **Completed Today**: Opens analytics dashboard with completion history

---

## Using the Interactive Chart

### Chart Interactions

#### Hovering
- **Hover** over any slice to see a tooltip with basic information
- The details panel updates automatically

#### Clicking
- **Click** any slice to "pin" it in the details panel
- Pinned slices remain visible even when you move your mouse away
- Click the **X** button in the details panel to unpin

#### Understanding Chart Colors
- Each section has a unique color
- Subsections inherit their section's color
- Tasks inherit their subsection's color
- High priority items have distinctive borders

#### Understanding Chart Sizes
- Larger slices indicate more tasks
- The chart automatically adjusts proportions
- Empty sections/subsections won't appear

### Chart Navigation Tips

- **Zoom**: The chart is responsive and adjusts to your screen size
- **Selection**: Clicking a slice makes it easier to add related items
- **Visual Feedback**: Hover effects help identify interactive elements

---

## Progress Mode (Purpose Anchor)

Progress Mode is a motivational feature that displays a purpose anchor in the header with effort icons around it.

### Enabling Progress Mode

1. Click the **Settings** (gear) icon in the header
2. Check **"Enable purpose anchor"**
3. The purpose anchor will appear in the center of the header

### Uploading a Purpose Image

1. With Progress Mode enabled, click **"Upload Image"**
2. Select a square image file (recommended: 256x256px)
3. The image will appear as a circular anchor in the header

**Tips**:
- Use a meaningful image (goal, motivation, personal photo)
- Square images work best
- The image is stored securely in the cloud

### Choosing Effort Icons

When you mark effort on tasks, icons appear around your purpose anchor. Choose your preferred icon:

1. Open Progress Mode settings
2. Select an icon from the dropdown:
   - **Flower** 🌸: Gentle, growth-focused
   - **Star** ⭐: Achievement-oriented
   - **Sparkle** ✨: Energetic, dynamic

### How Effort Icons Work

- Each time you mark "Worked on today" for a task, an icon appears around your anchor
- Icons are positioned in a circle around the anchor
- Maximum of 20 icons displayed (even if you have more effort records)
- Icons automatically reset at midnight PST each day
- You can manually clear all icons using the "Clear All Icons" button

### Clearing Icons

To manually remove all effort icons for today:
1. Open Progress Mode settings
2. Click **"Clear All Icons"**
3. All icons will be removed immediately

---

## Tracking Your Progress

### Completion Statistics

The **Completed Today** card shows:
- **Daily Count**: Tasks completed today
- **Total Count**: All-time completed tasks

### Analytics Dashboard

Click the **Completed Today** card to open the analytics dashboard, which shows:
- **Completion History**: Tasks completed over time
- **Daily Breakdown**: See what you completed each day
- **Task Details**: View completed task names and their sections

### Effort Tracking

The **Effort Today** card (if visible) shows:
- **Daily Effort**: Number of tasks you've marked effort on today
- **Effort Streak**: Consecutive days with recorded effort

### Understanding Progress

- **Visual Feedback**: The pie chart shows your active priorities
- **Statistics Cards**: Quick overview of your progress
- **Completion History**: Track long-term progress in analytics

---

## Managing Deadlines

### Setting Your Target Completion Date

Your target completion date is your overall goal deadline:

1. Find **"Target Completion"** in the header
2. Click the date to open the calendar
3. Select your target date
4. A progress bar appears showing your progress toward the deadline

### Understanding the Progress Bar

The progress bar shows:
- **Visual Progress**: Filled portion indicates time elapsed
- **Month Markers**: Key months (Jan, Jul, current month, Dec)
- **Remaining Days**: Hover to see days remaining
- **Automatic Updates**: Progress updates daily

### Task Due Dates

Individual tasks can have their own due dates:

1. When adding/editing a task, use the date picker
2. Due dates appear in:
   - Task details panel
   - "Due Today" card
   - "Due Soon" card
   - "Overdue" card

### Due Date Indicators

Tasks are color-coded by urgency:
- **Red**: Overdue
- **Orange**: Due today or tomorrow
- **Blue**: Due within 5 days
- **Gray**: No due date or far in the future

---

## Customization Options

### Changing Section Colors

1. Click on a section slice in the chart
2. In the details panel, click **Color**
3. Choose from 16 available colors
4. The section and all its subsections/tasks update immediately

### Editing Items

All items (sections, subsections, tasks) can be edited:
1. Select the item in the chart
2. Click **Edit** in the details panel
3. Modify the title, due date (tasks), or description (tasks)
4. Click **Save**

### Deleting Items

1. Select the item in the chart
2. Click the **Delete** (trash) icon
3. Confirm the deletion

**Warning**: Deleting a section or subsection will delete ALL nested items!

### Theme Toggle

Switch between light and dark modes:
- Click the **Theme Toggle** button in the header
- Your preference is saved automatically
- The entire interface updates immediately

---

## Data Management

### Automatic Cloud Saving

When signed in, your data is automatically saved to the cloud:
- Changes are saved in real-time
- Access your data from any device
- No manual saving required

### Data Export (Future Feature)

You can export your data as JSON files:
- Useful for backups
- Can be imported later
- Preserves all your priorities and settings

### Data Recovery

If you encounter issues:
- Your data is stored securely in the cloud
- Sign in from any device to access it
- Contact support if you need assistance

---

## Tips & Best Practices

### Organizing Your Priorities

1. **Start Broad**: Create 3-5 main sections covering major life areas
2. **Be Specific**: Use clear, actionable task titles
3. **Use Due Dates**: Set deadlines for time-sensitive tasks
4. **Prioritize**: Mark high-priority tasks for important items
5. **Review Regularly**: Check "Due Soon" and "Overdue" cards daily

### Making the Most of Progress Mode

1. **Choose Meaningful Images**: Use images that motivate you
2. **Track Daily Effort**: Mark effort on tasks as you work
3. **Watch Icons Grow**: See your daily progress visually
4. **Set Goals**: Use the purpose anchor as a visual reminder

### Task Management Best Practices

1. **Break Down Large Tasks**: Create subsections for complex projects
2. **Be Realistic**: Don't overload sections with too many tasks
3. **Update Regularly**: Complete tasks and add new ones as needed
4. **Use Descriptions**: Add context for complex tasks
5. **Set Deadlines**: Use due dates to stay on track

### Chart Navigation Tips

1. **Click to Pin**: Pin slices when you want to focus on one area
2. **Use Quick Add**: Click sections/subsections to pre-fill forms
3. **Check Colors**: Use colors to visually distinguish sections
4. **Monitor Size**: Larger slices indicate areas needing attention

---

## Troubleshooting

### Icons Not Appearing Around Purpose Anchor

- **Check Progress Mode**: Ensure Progress Mode is enabled
- **Verify Effort Recording**: Make sure you've clicked "Worked on today" on tasks
- **Check Date**: Icons reset at midnight PST - if it's a new day, you'll need to record new effort
- **Clear and Retry**: Use "Clear All Icons" and record effort again

### Tasks Not Showing in Chart

- **Check Hierarchy**: Ensure tasks are added to existing subsections
- **Verify Sections**: Make sure parent sections exist
- **Refresh Page**: Try refreshing if data seems out of sync

### Due Dates Not Working Correctly

- **Check Timezone**: The app uses PST (Pacific Standard Time)
- **Verify Format**: Dates should be in YYYY-MM-DD format
- **Check Calendar**: Ensure you're selecting dates correctly

### Can't Sign In

- **Check Email**: Verify you're using the correct email address
- **Password Reset**: Use password reset if needed
- **Browser Issues**: Try a different browser or clear cache

### Data Not Saving

- **Check Connection**: Ensure you have internet connectivity
- **Verify Sign-In**: Make sure you're signed in
- **Refresh Page**: Try refreshing to sync data

### Chart Not Loading

- **Check Browser**: Ensure you're using a modern browser
- **JavaScript Enabled**: Verify JavaScript is enabled
- **Clear Cache**: Try clearing browser cache

---

## Screenshot Guide

To help illustrate this tutorial, here are the recommended screenshots to capture:

### Essential Screenshots

1. **main-interface-overview.png**
   - Full application window showing all components
   - Should include header, statistics cards, pie chart, and sidebar
   - Use a populated interface with sample data

2. **statistics-dashboard.png**
   - Close-up of all statistics cards
   - Show Tasks, Sections, Due Today, Overdue, Due Soon, Completed Today
   - Highlight the clickable nature of cards

3. **add-section-form.png**
   - Right sidebar with "Section" tab selected
   - Show the form with a section name being entered
   - Include the "Add Section" button

4. **add-subsection-form.png**
   - Right sidebar with "Subsection" tab selected
   - Show the dropdown with available sections
   - Include form fields and "Add Subsection" button

5. **add-task-form.png**
   - Right sidebar with "Task" tab selected
   - Show section/subsection dropdowns
   - Include title field, date picker, description field
   - Show "Add Task" button

6. **interactive-pie-chart.png**
   - The pie chart with multiple sections visible
   - Show hover state on one slice
   - Include the details panel showing slice information

7. **chart-details-panel.png**
   - Details panel showing a selected task
   - Include all action buttons (Edit, Color, Complete, Delete)
   - Show task properties (due date, description, priority checkbox)

8. **due-soon-modal.png**
   - Modal dialog opened from "Due Soon" card
   - Show list of upcoming tasks
   - Include task details and badges

9. **overdue-modal.png**
   - Modal dialog opened from "Overdue" card
   - Show list of overdue tasks
   - Include overdue badges and task information

10. **completed-tasks-analytics.png**
    - Analytics dashboard opened from "Completed Today" card
    - Show completion history chart
    - Include daily breakdown and task list

### Feature-Specific Screenshots

11. **purpose-anchor-header.png**
    - Header showing purpose anchor with effort icons around it
    - Show multiple icons (flowers/stars/sparkles) positioned around the circular image
    - Include the settings button nearby

12. **progress-mode-settings.png**
    - Progress Mode settings popover
    - Show toggle, image upload button, icon selector dropdown
    - Include "Clear All Icons" button

13. **purpose-image-upload.png**
    - Image upload interface
    - Show file selection dialog or upload button
    - Include preview of uploaded image

14. **effort-button-task.png**
    - Task details panel showing "Worked on today" button
    - Show button in both states (enabled and disabled "Worked on")
    - Include the icon (flower/star/sparkle)

15. **target-completion-date.png**
    - Header showing target completion date
    - Include the progress bar below it
    - Show month markers on progress bar

16. **deadline-editor-calendar.png**
    - Calendar popover for setting target completion date
    - Show date selection interface

17. **color-picker-dialog.png**
    - Color selection dialog
    - Show grid of 16 color options
    - Include section being edited

18. **edit-task-dialog.png**
    - Edit dialog for a task
    - Show all form fields (title, date, description)
    - Include Save and Cancel buttons

19. **high-priority-task.png**
    - Chart showing a high-priority task
    - Highlight the distinctive border
    - Show checkbox checked in details panel

20. **theme-toggle-demo.png**
    - Side-by-side comparison of light and dark themes
    - Or show theme toggle button with tooltip

21. **hierarchy-visualization.png**
    - Visual diagram or annotated screenshot showing Section → Subsection → Task structure
    - Could be a zoomed chart view or text-based example

22. **empty-state.png**
    - Application with no data
    - Show empty chart and placeholder text
    - Include "Add Priorities" form

23. **task-urgency-colors.png**
    - Multiple tasks showing different urgency colors
    - Include overdue (red), due today (orange), upcoming (blue)
    - Could be from modals or chart

24. **quick-add-demo.png**
    - Sequence showing clicking a section to pre-fill subsection form
    - Or clicking subsection to pre-fill task form

### Advanced Features

25. **announcement-history.png**
    - Announcement history modal/dialog
    - Show list of past announcements

26. **completion-streak.png**
    - Effort counter showing streak
    - Show "Effort Today" and "Effort Streak" numbers

27. **data-export-options.png**
    - Any data management interface (if available)
    - Show export/save options

### Tips for Taking Screenshots

- **Use Sample Data**: Create realistic examples (e.g., "Academic" section with "DATA 255" subsection and tasks)
- **Show Interactions**: Capture hover states, open modals, show dropdowns
- **Highlight Features**: Use arrows or annotations to point out key elements
- **Consistent Styling**: Use the same theme (light or dark) throughout
- **High Resolution**: Capture at high DPI/Retina resolution for clarity
- **Clean Interface**: Remove any personal/sensitive information
- **Show States**: Capture both enabled and disabled states where relevant

---

## Conclusion

Congratulations! You now have a comprehensive understanding of Priority Visualizer. This application is designed to help you:

- **Visualize** your priorities across all areas of life
- **Organize** tasks hierarchically for better clarity
- **Track** your progress with completion statistics
- **Stay Motivated** with Progress Mode and effort tracking
- **Manage** deadlines effectively

Remember:
- Start simple and build your structure gradually
- Use due dates to stay on track
- Mark effort regularly to see your progress
- Review your priorities regularly
- Customize colors and settings to make it your own

If you have questions or need help, refer back to this tutorial or explore the interface - many features have helpful tooltips and visual cues.

Happy prioritizing! 🎯
