import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle, Calendar, Clock } from 'lucide-react';

interface CompletionCounterProps {
  count: number;
  completedTasks?: Array<{
    id: string;
    title: string;
    sectionTitle: string;
    subsectionTitle: string;
    completedAt: string;
  }>;
}

const CompletionCounter: React.FC<CompletionCounterProps> = ({ count, completedTasks = [] }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Card className="bg-card/50 backdrop-blur-sm border-2 border-success/30 cursor-pointer hover:bg-card/70 hover:border-success/50 hover:shadow-lg hover:shadow-success/10 transition-all duration-200 group">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/20 rounded-lg group-hover:bg-success/30 transition-colors">
                <CheckCircle className="w-5 h-5 text-success group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{count}</p>
                <p className="text-sm text-muted-foreground group-hover:text-success/80 transition-colors">Completed Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success" />
            Completed Today ({count})
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {count === 0 ? (
            <div className="text-center py-8">
              <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No Tasks Completed Today</h3>
              <p className="text-muted-foreground">Complete some tasks to see them here!</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Great job! You've completed {count} task{count !== 1 ? 's' : ''} today.
              </p>
              {completedTasks.length > 0 && (
                <div className="space-y-2">
                  {completedTasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate">{task.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {task.sectionTitle} → {task.subsectionTitle}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Completed at {formatTime(task.completedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {completedTasks.length === 0 && count > 0 && (
                <div className="p-4 bg-muted/30 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">
                    Task details are not available for items completed in this session.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompletionCounter;