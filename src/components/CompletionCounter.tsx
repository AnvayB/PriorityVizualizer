import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

interface CompletionCounterProps {
  count: number;
}

const CompletionCounter: React.FC<CompletionCounterProps> = ({ count }) => {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-success/20 rounded-lg">
            <CheckCircle className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{count}</p>
            <p className="text-sm text-muted-foreground">Completed Today</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompletionCounter;