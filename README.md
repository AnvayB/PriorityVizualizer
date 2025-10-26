# PriorityManager

<!-- Additions:

* The tasks completed today still don't show the actual tasks:
    - I tested this by completing a task from Job Apps > Aai > 1-5 and although the full total got incremented to show 1, the daily total remains 0 and clicking on that tab opens what I've shown in the image
* Subsection select (filling in the fields for Add Task) only works after multiple subsections are clicked
- For example, suppose I'm clicked on a slice in Section A. When I click to the Section B.2 subsection, that title is not filled in the "Add Priorities" component field. But if I click on Section B.3, then the subsection field in the Add Priorities component field _is_ filled, and same for if I go back to Section B.2. I need the clicked Subsection slice to fill its respective field in the Add Priorities component when it's clicked the first time. Otherwise, this will understandably cause frustration in the users' experience. 

* How should I add a tutorial? Ideally, I want it to be an interactive "follow-along" tutorial where differnt parts of the website are highlighted and explained, but I'm open to making a tutorial video as a backup.

* perform analytics on completed tasks from Supabase

* maybe add RLS back for Supabase tables (since all the content is shared in the section, subsection, tasks)

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


