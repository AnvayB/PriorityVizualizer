import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const DEV_PASSWORD = import.meta.env.VITE_DEV_PASSWORD;

const Dev = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { navigate('/auth'); return; }
      setUserId(data.user.id);
    });
    if (localStorage.getItem('pv-dev-auth') === 'true') {
      setAuthenticated(true);
    }
  }, [navigate]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (DEV_PASSWORD && password === DEV_PASSWORD) {
      setAuthenticated(true);
      localStorage.setItem('pv-dev-auth', 'true');
    } else {
      setStatus('Incorrect password');
    }
  };

  const handleResetTutorial = async () => {
    if (!userId) return;
    setStatus('Deleting data...');
    await supabase.from('tasks').delete().eq('user_id', userId);
    await supabase.from('subsections').delete().eq('user_id', userId);
    await supabase.from('sections').delete().eq('user_id', userId);
    setStatus('Done — reloading app...');
    setTimeout(() => navigate('/'), 800);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <form onSubmit={handlePasswordSubmit} className="space-y-3 w-72">
          <p className="text-sm font-medium text-center text-muted-foreground">Dev Tools</p>
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          {status && <p className="text-xs text-destructive">{status}</p>}
          <Button type="submit" className="w-full">Enter</Button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="space-y-4 w-72">
        <p className="text-sm font-semibold text-center">Dev Tools</p>
        <Button
          variant="destructive"
          className="w-full"
          onClick={handleResetTutorial}
        >
          Reset Tutorial
        </Button>
        {status && <p className="text-xs text-muted-foreground text-center">{status}</p>}
        <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
          ← Back to App
        </Button>
      </div>
    </div>
  );
};

export default Dev;
