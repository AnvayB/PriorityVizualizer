import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, CheckCircle, Download, RefreshCw } from 'lucide-react';

const DataDiagnostic: React.FC = () => {
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostic = async () => {
    setIsRunning(true);
    const results: any = {
      timestamp: new Date().toISOString(),
      checks: []
    };

    try {
      // Check 1: User authentication
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      results.checks.push({
        name: 'User Authentication',
        status: user ? 'success' : 'error',
        data: user ? { email: user.email, id: user.id } : null,
        error: userError?.message
      });

      if (!user) {
        setDiagnosticResults(results);
        setIsRunning(false);
        return;
      }

      // Check 2: Sections query with user_id filter
      const { data: sectionsData, error: sectionsError, count: sectionsCount } = await supabase
        .from('sections')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);

      results.checks.push({
        name: 'Sections Query',
        status: sectionsError ? 'error' : 'success',
        data: { count: sectionsData?.length || 0, exactCount: sectionsCount },
        error: sectionsError?.message,
        details: sectionsData?.map(s => ({ id: s.id, title: s.title }))
      });

      // Check 3: Subsections query (no filter - relies on RLS)
      const { data: subsectionsData, error: subsectionsError, count: subsectionsCount } = await supabase
        .from('subsections')
        .select('*', { count: 'exact' });

      results.checks.push({
        name: 'Subsections Query (RLS)',
        status: subsectionsError ? 'error' : 'success',
        data: { count: subsectionsData?.length || 0, exactCount: subsectionsCount },
        error: subsectionsError?.message,
        warning: (subsectionsData?.length || 0) === 0 ? 'No subsections returned - possible RLS issue' : null
      });

      // Check 4: Subsections query WITH explicit join to verify RLS
      if (sectionsData && sectionsData.length > 0) {
        const sectionIds = sectionsData.map(s => s.id);
        const { data: subsectionsWithFilter, error: subsectionsFilterError } = await supabase
          .from('subsections')
          .select('*')
          .in('section_id', sectionIds);

        results.checks.push({
          name: 'Subsections Query (With Filter)',
          status: subsectionsFilterError ? 'error' : 'success',
          data: { count: subsectionsWithFilter?.length || 0 },
          error: subsectionsFilterError?.message,
          comparison: `RLS returned ${subsectionsData?.length || 0}, Filter returned ${subsectionsWithFilter?.length || 0}`
        });
      }

      // Check 5: Tasks query (no filter - relies on RLS)
      const { data: tasksData, error: tasksError, count: tasksCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact' });

      results.checks.push({
        name: 'Tasks Query (RLS)',
        status: tasksError ? 'error' : 'success',
        data: { count: tasksData?.length || 0, exactCount: tasksCount },
        error: tasksError?.message,
        warning: (tasksData?.length || 0) === 0 ? 'No tasks returned - possible RLS issue' : null
      });

      // Check 6: Check RLS policies
      const { data: rlsData, error: rlsError } = await supabase
        .rpc('pg_policies')
        .select('*');

      results.checks.push({
        name: 'RLS Policies Check',
        status: rlsError ? 'warning' : 'info',
        data: { available: !rlsError },
        error: rlsError?.message,
        note: 'RLS policies query may not be available to regular users'
      });

      // Check 7: Data transformation test
      if (sectionsData && sectionsData.length > 0) {
        const transformedSections = sectionsData.map(section => ({
          id: section.id,
          title: section.title,
          color: section.color || undefined,
          high_priority: section.high_priority || false,
          subsections: (subsectionsData || [])
            .filter(sub => sub.section_id === section.id)
            .map(subsection => ({
              id: subsection.id,
              title: subsection.title,
              high_priority: subsection.high_priority || false,
              tasks: (tasksData || [])
                .filter(task => task.subsection_id === subsection.id)
                .map(task => ({
                  id: task.id,
                  title: task.title,
                  dueDate: task.due_date || '',
                  high_priority: task.high_priority || false
                }))
            }))
        }));

        results.checks.push({
          name: 'Data Transformation',
          status: 'success',
          data: {
            sectionsCount: transformedSections.length,
            subsectionsCount: transformedSections.reduce((sum, s) => sum + s.subsections.length, 0),
            tasksCount: transformedSections.reduce((sum, s) => 
              sum + s.subsections.reduce((subSum, sub) => subSum + sub.tasks.length, 0), 0)
          }
        });
      }

    } catch (error: any) {
      results.checks.push({
        name: 'Unexpected Error',
        status: 'error',
        error: error.message
      });
    }

    setDiagnosticResults(results);
    setIsRunning(false);
  };

  const exportResults = () => {
    if (!diagnosticResults) return;
    
    const dataStr = JSON.stringify(diagnosticResults, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagnostic-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Data Diagnostic Tool
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={runDiagnostic} disabled={isRunning}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
            Run Diagnostic
          </Button>
          {diagnosticResults && (
            <Button onClick={exportResults} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Results
            </Button>
          )}
        </div>

        {diagnosticResults && (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Diagnostic run at: {new Date(diagnosticResults.timestamp).toLocaleString()}
            </div>
            {diagnosticResults.checks.map((check: any, index: number) => (
              <div key={index} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{check.name}</div>
                  <Badge variant={
                    check.status === 'success' ? 'default' :
                    check.status === 'error' ? 'destructive' :
                    check.status === 'warning' ? 'secondary' : 'outline'
                  }>
                    {check.status === 'success' && <CheckCircle className="w-3 h-3 mr-1" />}
                    {check.status === 'error' && <AlertCircle className="w-3 h-3 mr-1" />}
                    {check.status.toUpperCase()}
                  </Badge>
                </div>
                {check.data && (
                  <div className="text-sm bg-muted/50 p-2 rounded">
                    <pre>{JSON.stringify(check.data, null, 2)}</pre>
                  </div>
                )}
                {check.error && (
                  <div className="text-sm text-destructive">Error: {check.error}</div>
                )}
                {check.warning && (
                  <div className="text-sm text-warning">⚠️ {check.warning}</div>
                )}
                {check.note && (
                  <div className="text-sm text-muted-foreground">Note: {check.note}</div>
                )}
                {check.comparison && (
                  <div className="text-sm text-blue-600">ℹ️ {check.comparison}</div>
                )}
                {check.details && (
                  <details className="text-sm">
                    <summary className="cursor-pointer text-muted-foreground">Show details</summary>
                    <pre className="mt-2 bg-muted/30 p-2 rounded overflow-auto max-h-40">
                      {JSON.stringify(check.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DataDiagnostic;

