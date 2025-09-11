import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartSlice } from '@/types/priorities';
import { Calendar, CheckCircle, Clock } from 'lucide-react';

interface HoverInfoProps {
  slice: ChartSlice | null;
}

const HoverInfo: React.FC<HoverInfoProps> = ({ slice }) => {
  if (!slice) {
    return (
      <Card className="w-full max-w-md h-64 bg-card/30 backdrop-blur-sm border-border/30">
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-muted-foreground text-center">
            Hover over the pie chart to see details
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isOverdue = (dateString: string) => {
    const dueDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  const getDaysUntilDue = (dateString: string) => {
    const dueDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <Card className="w-full max-w-md bg-card/50 backdrop-blur-sm border-border/50 animate-scale-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-primary">
            {slice.level === 'section' && slice.section.title}
            {slice.level === 'subsection' && slice.subsection?.title}
            {slice.level === 'task' && slice.task?.title}
          </CardTitle>
          <Badge 
            variant={slice.level === 'section' ? 'default' : slice.level === 'subsection' ? 'secondary' : 'outline'}
            className="capitalize"
          >
            {slice.level}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {slice.level === 'section' && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {slice.section.subsections.length} subsection{slice.section.subsections.length !== 1 ? 's' : ''}
            </p>
            <p className="text-sm text-muted-foreground">
              {slice.section.subsections.reduce((total, sub) => total + sub.tasks.length, 0)} total task{slice.section.subsections.reduce((total, sub) => total + sub.tasks.length, 0) !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {slice.level === 'subsection' && slice.subsection && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Parent: <span className="text-foreground font-medium">{slice.section.title}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              {slice.subsection.tasks.length} task{slice.subsection.tasks.length !== 1 ? 's' : ''}
            </p>
            {slice.subsection.tasks.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Tasks:</p>
                {slice.subsection.tasks.map((task) => {
                  const daysUntil = getDaysUntilDue(task.dueDate);
                  const overdue = isOverdue(task.dueDate);
                  
                  return (
                    <div key={task.id} className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded-md">
                      <span className="truncate flex-1">{task.title}</span>
                      <Badge 
                        variant={overdue ? 'destructive' : daysUntil <= 3 ? 'secondary' : 'outline'}
                        className="ml-2 text-xs"
                      >
                        {overdue ? 'Overdue' : daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil}d`}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {slice.level === 'task' && slice.task && (
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Section: <span className="text-foreground font-medium">{slice.section.title}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Subsection: <span className="text-foreground font-medium">{slice.subsection?.title}</span>
              </p>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
              <Calendar className="w-4 h-4 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">Due Date</p>
                <p className="text-xs text-muted-foreground">{formatDate(slice.task.dueDate)}</p>
              </div>
              {(() => {
                const daysUntil = getDaysUntilDue(slice.task.dueDate);
                const overdue = isOverdue(slice.task.dueDate);
                
                return (
                  <Badge 
                    variant={overdue ? 'destructive' : daysUntil <= 3 ? 'secondary' : 'outline'}
                    className="flex items-center gap-1"
                  >
                    {overdue ? (
                      <>
                        <Clock className="w-3 h-3" />
                        Overdue
                      </>
                    ) : daysUntil === 0 ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Today
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3" />
                        {daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                      </>
                    )}
                  </Badge>
                );
              })()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HoverInfo;