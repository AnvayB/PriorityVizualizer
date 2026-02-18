import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Target, PieChart, TrendingUp, Calendar, ArrowRight } from 'lucide-react';

const features = [
  {
    icon: PieChart,
    headline: 'Visualize your hierarchy',
    body: 'Build Sections → Subsections → Tasks in a live sunburst chart.',
    iconBg: 'bg-[hsl(227,82%,41%)]/10',
    iconColor: 'text-[hsl(227,82%,41%)]',
    border: 'border-[hsl(227,82%,41%)]/20',
  },
  {
    icon: TrendingUp,
    headline: 'Track effort, not just completion',
    body: 'Log daily effort with Progress Mode and work towards your Goals.',
    iconBg: 'bg-[hsl(142,76%,36%)]/10',
    iconColor: 'text-[hsl(142,76%,36%)]',
    border: 'border-[hsl(142,76%,36%)]/20',
  },
  {
    icon: Calendar,
    headline: 'Never miss a deadline',
    body: 'See overdue, due-today, and upcoming tasks at a glance.',
    iconBg: 'bg-[hsl(38,92%,50%)]/10',
    iconColor: 'text-[hsl(38,92%,50%)]',
    border: 'border-[hsl(38,92%,50%)]/20',
  },
];

const stepColors = [
  'bg-[hsl(227,82%,41%)]',
  'bg-[hsl(340,75%,55%)]',
  'bg-[hsl(142,76%,36%)]',
];

const steps = [
  {
    number: '1',
    title: 'Add your priorities',
    body: 'Create Sections for the key areas of your life — Work, Health, Family, or anything that matters.',
  },
  {
    number: '2',
    title: 'Break them down',
    body: 'Add Subsections and Tasks to get specific. The more detail, the clearer your picture.',
  },
  {
    number: '3',
    title: 'Log your effort',
    body: 'Hit "Worked on today" on any task. Over time, your consistency becomes visible.',
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const goToAuth = () => navigate('/auth');

  return (
    <div className="min-h-screen md:h-screen flex flex-col bg-gradient-bg overflow-y-auto md:overflow-hidden">
      {/* Navbar */}
      <nav className="h-14 flex-shrink-0 bg-background/80 backdrop-blur-sm border-b border-border/30 z-10">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-gradient-primary rounded-lg">
              <Target className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-base text-foreground">Priority Viz</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={goToAuth}
            className="border-gray-400 dark:border-border"
          >
            Sign In
          </Button>
        </div>
      </nav>

      {/* Body: hero + how it works row, features full-width strip */}
      <main className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-4 md:px-8 py-6 md:py-8 gap-8">

        {/* ── Row: Hero + How it works ── */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-0">

          {/* Left: Hero + CTA */}
          <div className="w-full md:w-1/2 flex flex-col justify-center gap-6 md:gap-8 md:pr-12 md:border-r border-border/30">

          {/* Top: badge */}
          <div className="inline-flex w-fit items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold tracking-wide">
            <Target className="w-3 h-3" />
            Your life, organized
          </div>

          {/* Middle: logo + headline + description */}
          <div className="space-y-5">
            <div className="flex items-center gap-4 md:gap-5">
              <div className="p-3 md:p-3.5 bg-gradient-primary rounded-2xl shadow-lg flex-shrink-0">
                <Target className="w-9 h-9 md:w-11 md:h-11 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
                Priority Viz
              </h1>
            </div>

            <div className="space-y-2">
              <p className="text-2xl md:text-3xl font-semibold text-foreground leading-snug">
                Visualize your priorities.{' '}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Track your effort.
                </span>
              </p>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-md">
                Organize the areas of your life — Work, Health, Family, Growth — into an
                interactive sunburst chart so you always know where your time and energy is going.
              </p>
            </div>
          </div>

          {/* Bottom: CTAs + footnote */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Button
                size="lg"
                onClick={goToAuth}
                className="bg-gradient-primary text-white border-0 hover:opacity-90 gap-2 text-base"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Button>
              {/* <Button
                size="lg"
                variant="outline"
                onClick={goToAuth}
                className="border-gray-400 dark:border-border text-base"
              >
                Sign In
              </Button> */}
            </div>
            <p className="text-sm text-muted-foreground">Free to use · No credit card required</p>
          </div>

          {/* Close left hero column */}
          </div>

          {/* Right: How it works */}
          <div className="w-full md:w-1/2 flex flex-col justify-center gap-6 pt-6 md:pt-0 md:pl-12 border-t md:border-t-0 border-border/30">
            <div className="space-y-5">
              <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                How it works
              </p>
              <div className="space-y-4">
                {steps.map(({ number, title, body }, i) => (
                  <div key={number} className="flex items-start gap-4">
                    <div className={`w-9 h-9 rounded-full ${stepColors[i]} flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5 shadow-md`}>
                      {number}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-foreground">{title}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed mt-1">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* ── Full-width Features strip ── */}
        <section className="border-t border-border/40">
          <div className="space-y-5">
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Features
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
              {features.map(({ icon: Icon, headline, body, iconBg, iconColor, border }) => (
                <div
                  key={headline}
                  className={`bg-card/70 backdrop-blur-sm border ${border} rounded-xl p-4 space-y-3`}
                >
                  <div className={`p-2 w-fit rounded-lg ${iconBg}`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-foreground leading-snug">{headline}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-1">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
