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

## 💡 Usage Guide

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