import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, Mail, Lock, UserPlus, LogIn, ArrowLeft, KeyRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check URL hash for recovery token - this handles the redirect from Supabase
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    
    if (type === 'recovery') {
      setIsRecoveryMode(true);
      // Clear the hash to clean up the URL
      window.history.replaceState(null, '', window.location.pathname);
    }

    // Listen for auth state changes including password recovery
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
      } else if (event === 'SIGNED_IN' && !isRecoveryMode && type !== 'recovery') {
        navigate('/');
      }
    });

    // Check if user is already logged in (but not if we're in recovery mode)
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && !isRecoveryMode && type !== 'recovery') {
        navigate('/');
      }
    };
    checkAuth();

    return () => subscription.unsubscribe();
  }, [navigate, isRecoveryMode]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });

    setLoading(false);

    if (error) {
      if (error.message.includes('already registered')) {
        toast({
          title: "Account exists",
          description: "This email is already registered. Please sign in instead.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Check your email!",
        description: "We've sent you a confirmation link to complete your registration.",
      });
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You've been successfully signed in.",
      });
      navigate('/');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Reset failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Check your email!",
        description: "We've sent you a password reset link.",
      });
      setShowForgotPassword(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Password updated!",
        description: "Your password has been successfully changed.",
      });
      setIsRecoveryMode(false);
      setNewPassword('');
      setConfirmPassword('');
      navigate('/');
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: 'guest@example.com',
      password: 'guestuser',
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Guest login failed",
        description: "Guest account may not be set up. Please create a regular account.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome Guest!",
        description: "You can now explore the guest data feature.",
      });
      navigate('/');
    }
  };

  // Password Recovery Mode UI
  if (isRecoveryMode) {
    return (
      <div className="min-h-screen bg-gradient-bg flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-3 bg-gradient-primary rounded-xl">
                  <KeyRound className="w-8 h-8 text-white" />
                </div>
              </div>
              <div>
                <CardTitle className="text-2xl bg-gradient-primary bg-clip-text text-transparent">
                  Set New Password
                </CardTitle>
                <p className="text-muted-foreground mt-2">
                  Enter your new password below
                </p>
              </div>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Enter new password (min 6 characters)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10"
                      minLength={6}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      minLength={6}
                      required
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Forgot Password UI
  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-bg flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-3 bg-gradient-primary rounded-xl">
                  <Mail className="w-8 h-8 text-white" />
                </div>
              </div>
              <div>
                <CardTitle className="text-2xl bg-gradient-primary bg-clip-text text-transparent">
                  Reset Password
                </CardTitle>
                <p className="text-muted-foreground mt-2">
                  Enter your email to receive a reset link
                </p>
              </div>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full flex items-center gap-2"
                  onClick={() => setShowForgotPassword(false)}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 bg-gradient-primary rounded-xl">
                <Target className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl bg-gradient-primary bg-clip-text text-transparent">
                Priority Vizualizer
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                Sign in to save and manage your priorities
              </p>
            </div>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin" className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Sign Up
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                    <button
                      type="button"
                      className="text-sm text-primary hover:underline"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Forgot password?
                    </button>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Create a password (min 6 characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        minLength={6}
                        required
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating account..." : "Sign Up"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 pt-6 border-t border-border/50">
              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  Want to try the demo?
                </p>
                <Button 
                  onClick={handleGuestLogin} 
                  variant="outline" 
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Continue as Guest"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Guest users can access sample data for testing
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;