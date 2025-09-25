# PriorityManager

A modern, interactive priority management application that helps you visualize and organize your tasks across different areas of life using an intuitive pie chart interface.

## 🌟 Features

### 📊 **Interactive Pie Chart Visualization**
- Multi-level hierarchical pie chart showing Sections → Subsections → Tasks
- Real-time visual feedback with hover effects and color-coded segments
- Pin slices to keep important information visible
- Dynamic sizing based on task counts and priority levels

### 🗂️ **Hierarchical Task Organization**
- **Sections**: High-level categories (e.g., MSADI, Job Applications, Gym)
- **Subsections**: Specific areas within sections (e.g., DATA 255, DATA 266)
- **Tasks**: Individual actionable items with due dates

### 💾 **Dual Storage Options**
- **Save to Supabase**: Cloud-based storage with user authentication
- **Save to Computer**: Export data as timestamped JSON files
- **Load from Supabase**: Retrieve your saved priorities from the cloud
- **Load from Computer**: Import data from JSON files

### 🎨 **Modern UI/UX**
- Beautiful gradient backgrounds and glass-morphism effects
- Responsive design that works on all devices
- Dark/light theme support
- Smooth animations and transitions
- Toast notifications for user feedback

### 📅 **Task Management**
- Due date tracking with calendar integration
- Upcoming tasks dashboard (next 3 days)
- Task completion status tracking
- Real-time statistics (total tasks, upcoming deadlines)

### 🔧 **Advanced Features**
- Real-time CRUD operations (Create, Read, Update, Delete)
- Color customization for sections
- Data export/import functionality
- User authentication with Supabase
- Row Level Security (RLS) for data protection

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

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- Supabase account (for cloud features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd PriorityManager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase** (Optional - for cloud features)
   - Create a new Supabase project
   - Run the database migrations from `supabase/migrations/`
   - Update the Supabase URL and API key in `src/integrations/supabase/client.ts`

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 📁 Project Structure

```
PriorityManager/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── PieChart.tsx    # Interactive pie chart component
│   │   ├── PriorityForm.tsx # Forms for adding priorities
│   │   └── HoverInfo.tsx   # Hover information display
│   ├── data/               # Default data and types
│   ├── hooks/              # Custom React hooks
│   ├── integrations/       # External service integrations
│   │   └── supabase/       # Supabase client and types
│   ├── lib/                # Utility functions
│   ├── pages/              # Application pages
│   ├── types/              # TypeScript type definitions
│   └── main.tsx            # Application entry point
├── supabase/
│   ├── migrations/         # Database schema migrations
│   └── config.toml         # Supabase configuration
├── public/                 # Static assets
└── package.json
```

## 🎓 Guest Tutorial: How to Use Priority Manager

Welcome to Priority Manager! This comprehensive tutorial will guide you through all the features and help you get the most out of this powerful task management tool.

### 📋 Table of Contents
1. [Getting Started](#getting-started-as-a-guest)
2. [Understanding the Interface](#understanding-the-interface)
3. [Creating Your First Priority Structure](#creating-your-first-priority-structure)
4. [Managing Tasks and Deadlines](#managing-tasks-and-deadlines)
5. [Using the Interactive Pie Chart](#using-the-interactive-pie-chart)
6. [Tracking Progress](#tracking-progress)
7. [Data Management](#data-management)
8. [Advanced Features](#advanced-features)

---

### 🚀 Getting Started as a Guest

When you first open Priority Manager, you'll see a clean, modern interface with several key areas:

![Main Interface Overview](./docs/images/main-interface-overview.png)
*The main Priority Manager interface with all key components*

**Key Components:**
- **Statistics Bar** (top): Shows your life sections, total tasks, due soon, and completed today
- **Interactive Pie Chart** (center): Visual representation of your priorities
- **Task Details Panel** (right): Shows information about selected items
- **Add Priorities Form** (right): Create new sections, subsections, and tasks

---

### 🎯 Understanding the Interface

#### Statistics Dashboard
The top bar provides at-a-glance information about your priorities:

![Statistics Dashboard](./docs/images/statistics-dashboard.png)
*Statistics showing life sections, total tasks, upcoming deadlines, and daily completions*

- **Life Sections**: Total number of major areas you're managing
- **Total Tasks**: All tasks across all sections
- **Due Soon** ⚠️ **(CLICKABLE)**: Tasks due in the next 3 days - click to see details!
- **Completed Today** ✅ **(CLICKABLE)**: Tasks you've finished today - click to see your progress!

#### Interactive Elements
Look for these visual cues that indicate clickable elements:
- **Colored borders** on cards (green for completed, orange for due soon)
- **Hover effects** with shadows and icon animations
- **Cursor changes** to pointer when hovering over interactive elements

---

### 🏗️ Creating Your First Priority Structure

Priority Manager uses a 3-level hierarchy: **Sections** → **Subsections** → **Tasks**

![Hierarchy Structure](./docs/images/hierarchy-structure.png)
*Example of the three-level hierarchy: Academic → Course → Assignment*

#### Step 1: Add a Section
1. Look for the "Add Priorities" form on the right side
2. Click the **"Section"** tab
3. Enter a title (e.g., "Academic", "Work", "Personal")
4. Click **"Add Section"**

![Add Section Form](./docs/images/add-section-form.png)
*Adding a new section to organize your priorities*

#### Step 2: Add Subsections
1. Click the **"Subsection"** tab
2. Select your newly created section from the dropdown
3. Enter a subsection title (e.g., "DATA 255", "Project Alpha")
4. Click **"Add Subsection"**

![Add Subsection Form](./docs/images/add-subsection-form.png)
*Adding subsections to break down your major areas*

#### Step 3: Add Tasks
1. Click the **"Task"** tab
2. Select the section and subsection
3. Enter the task title and due date
4. Click **"Add Task"**

![Add Task Form](./docs/images/add-task-form.png)
*Adding individual tasks with due dates*

---

### 📅 Managing Tasks and Deadlines

#### Understanding Due Dates
Tasks are automatically categorized by urgency:
- **Red**: Overdue tasks
- **Orange/Yellow**: Due today or tomorrow
- **Blue**: Due in 2-3 days
- **Gray**: Due later

![Task Urgency Colors](./docs/images/task-urgency-colors.png)
*Color coding helps you quickly identify urgent tasks*

#### Using the Due Soon Modal
Click on the **"Due Soon"** card in the statistics bar to see:

![Due Soon Modal](./docs/images/due-soon-modal.png)
*Detailed view of all upcoming tasks with urgency indicators*

- **Sorted by urgency**: Most urgent tasks appear first
- **Color-coded borders**: Visual urgency indicators
- **Task context**: Shows which section and subsection each task belongs to
- **High priority badges**: Special markers for important tasks
- **Due date information**: Clear, readable date formats

---

### 🥧 Using the Interactive Pie Chart

The pie chart is the heart of Priority Manager, providing instant visual feedback about your priorities.

![Interactive Pie Chart](./docs/images/interactive-pie-chart.png)
*The pie chart shows proportional representation of your tasks*

#### Chart Interactions
1. **Hover**: Move your mouse over any slice to see details
2. **Click**: Click any slice to "pin" information in the details panel
3. **Multi-level**: The chart shows sections, subsections, and individual tasks

#### Understanding the Visualization
- **Size**: Larger slices = more tasks in that area
- **Colors**: Each section has a unique color (customizable)
- **Borders**: Black borders indicate high-priority items
- **Nested structure**: Inner rings show subsections and tasks

![Chart Interaction Demo](./docs/images/chart-interaction-demo.png)
*Hovering and clicking on chart slices reveals detailed information*

---

### 📊 Tracking Progress

#### Completion Tracking
When you complete tasks, Priority Manager tracks your daily progress:

![Completion Counter](./docs/images/completion-counter.png)
*Daily completion counter with clickable interface*

#### Completed Today Modal
Click on the **"Completed Today"** card to see:

![Completed Tasks Modal](./docs/images/completed-tasks-modal.png)
*Detailed view of your daily accomplishments*

- **Congratulatory messages**: Positive reinforcement for your progress
- **Task details**: What you completed and when
- **Completion times**: Track when you finished each task
- **Context information**: See which areas you've been most productive in

#### Task Management Actions
For any selected item in the details panel, you can:

![Task Management Actions](./docs/images/task-management-actions.png)
*Available actions for managing your priorities*

- **Edit**: Modify titles, due dates, or other details
- **Change Color**: Customize section colors for better organization
- **Mark Complete**: Finish tasks and track progress
- **Delete**: Remove items you no longer need
- **Set Priority**: Mark items as high priority (adds visual indicators)

---

### 💾 Data Management

Priority Manager offers flexible data storage options:

![Data Management Options](./docs/images/data-management-options.png)
*Save and load options in the header menu*

#### Saving Your Data
1. **To Computer**: Downloads a JSON file with timestamp
   - No account required
   - Perfect for backups
   - Can be shared between devices

2. **To Supabase Cloud**: Requires user account
   - Automatic syncing
   - Access from any device
   - Secure cloud storage

#### Loading Your Data
1. **From Computer**: Upload a previously saved JSON file
2. **From Supabase**: Automatically loads when you sign in

![Authentication Flow](./docs/images/authentication-flow.png)
*Sign in to access cloud features*

---

### 🔧 Advanced Features

#### High Priority Items
Mark important items as high priority to:
- Add black borders in the pie chart
- Show priority badges in task lists
- Get visual emphasis in all views

![High Priority Features](./docs/images/high-priority-features.png)
*High priority items get special visual treatment*

#### Color Customization
Personalize your sections with custom colors:

![Color Customization](./docs/images/color-customization.png)
*Choose from a palette of colors for each section*

#### Responsive Design
Priority Manager works seamlessly across all devices:

![Responsive Design](./docs/images/responsive-design.png)
*The interface adapts to different screen sizes*

---

### 🎯 Pro Tips for Maximum Productivity

1. **Start Small**: Begin with 2-3 main sections, then expand
2. **Use Due Dates**: Always set realistic due dates for better planning
3. **Check Daily**: Click "Due Soon" and "Completed Today" regularly
4. **Color Code**: Use consistent colors for related areas
5. **Regular Reviews**: Use the pie chart to identify where you're spending most time
6. **High Priority**: Use sparingly - only for truly urgent items
7. **Pin Important Info**: Click chart slices to keep important details visible

![Pro Tips Visualization](./docs/images/pro-tips-visualization.png)
*Example of a well-organized priority structure*

---

### 🆘 Troubleshooting Common Issues

#### "No Data Yet" Message
If you see an empty chart:
1. Add at least one section using the form
2. Add subsections to your sections
3. Add tasks to see the chart populate

#### Can't See My Tasks
1. Check if you're looking at the right section/subsection
2. Ensure tasks have been saved properly
3. Try refreshing the page

#### Saving Issues
1. **Computer saves**: Check your downloads folder
2. **Cloud saves**: Ensure you're signed in to your account
3. **Loading issues**: Verify file format and integrity

---

### 🎉 Getting the Most Out of Priority Manager

Priority Manager is designed to grow with your needs. Whether you're managing academic coursework, job applications, personal projects, or professional responsibilities, the hierarchical structure and visual feedback help you stay organized and motivated.

**Remember**: The key to success is consistent use. Start simple, build your system gradually, and use the visual feedback to guide your daily priorities!

![Success Story](./docs/images/success-story.png)
*Example of a mature Priority Manager setup with multiple life areas*

---

## 💡 Quick Usage Guide

### Adding Priorities

1. **Add a Section**: Use the "Add Priorities" form, select "Section" tab
2. **Add a Subsection**: Select "Subsection" tab, choose a section, add title
3. **Add a Task**: Select "Task" tab, choose section and subsection, add title and due date

### Managing Data

- **Save to Cloud**: Click "Save Data" → "to Supabase" (requires authentication)
- **Save Locally**: Click "Save Data" → "to Computer" (downloads JSON file)
- **Load from Cloud**: Click "Load Data" → "from Supabase"
- **Load from File**: Click "Load Data" → "from Computer"

### Customization

- **Change Colors**: Click on any section in the chart to change its color
- **Edit Items**: Double-click on sections, subsections, or tasks to edit
- **Delete Items**: Use the delete buttons in the interface

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

## 🎯 Use Cases

- **Academic Planning**: Organize courses, assignments, and deadlines
- **Job Search Management**: Track applications, interviews, and networking
- **Personal Projects**: Manage hobby projects and personal goals
- **Work Task Management**: Organize professional responsibilities
- **Fitness Planning**: Track workout routines and health goals

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Lovable](https://lovable.dev) - AI-powered development platform
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Database and Auth by [Supabase](https://supabase.com/)

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Provide steps to reproduce any bugs

---

**Happy Priority Managing! 🎯**