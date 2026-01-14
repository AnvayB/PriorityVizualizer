import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, CheckCircle, Info, AlertTriangle, Bell, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface Announcement {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'success' | 'error';
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
  seen_at?: string;
}

interface AnnouncementHistoryProps {
  userId: string;
}

const AnnouncementHistory: React.FC<AnnouncementHistoryProps> = ({ userId }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open && userId) {
      loadAnnouncementHistory();
    }
  }, [open, userId]);

  const loadAnnouncementHistory = async () => {
    setIsLoading(true);
    try {
      // Fetch all announcements (including inactive ones for history)
      const { data: allAnnouncements, error: announcementsError } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (announcementsError) {
        console.error('Error fetching announcements:', announcementsError);
        setAnnouncements([]);
        return;
      }

      // Fetch which announcements the user has seen
      const { data: seenAnnouncements, error: seenError } = await supabase
        .from('user_announcements_seen')
        .select('announcement_id, seen_at')
        .eq('user_id', userId);

      if (seenError) {
        console.error('Error fetching seen announcements:', seenError);
      }

      // Create a map of announcement_id -> seen_at
      const seenMap = new Map<string, string>();
      (seenAnnouncements || []).forEach((item: any) => {
        seenMap.set(item.announcement_id, item.seen_at);
      });

      setSeenIds(new Set(seenMap.keys()));

      // Add seen_at timestamp to announcements
      const announcementsWithSeen = (allAnnouncements || []).map((announcement: any) => ({
        ...announcement,
        seen_at: seenMap.get(announcement.id),
      }));

      setAnnouncements(announcementsWithSeen);
    } catch (error) {
      console.error('Error loading announcement history:', error);
      setAnnouncements([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    const iconClass = "w-4 h-4";
    
    switch (severity) {
      case 'error':
        return <AlertCircle className={`${iconClass} text-red-500`} />;
      case 'warning':
        return <AlertTriangle className={`${iconClass} text-yellow-500`} />;
      case 'success':
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      case 'info':
      default:
        return <Info className={`${iconClass} text-blue-500`} />;
    }
  };

  const getSeverityBadgeVariant = (severity: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (severity) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'success':
        return 'default';
      case 'info':
      default:
        return 'outline';
    }
  };

  const getSeverityBorderClass = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'border-l-4 border-red-500';
      case 'warning':
        return 'border-l-4 border-yellow-500';
      case 'success':
        return 'border-l-4 border-green-500';
      case 'info':
      default:
        return 'border-l-4 border-blue-500';
    }
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="h-9 w-9 p-0 border-gray-400 dark:border-border"
          title="Updates"
        >
          <Bell className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Update History
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading updates...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-8">
              <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto mb-4">
                <Bell className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No Updates Yet</h3>
              <p className="text-muted-foreground">No announcements have been published yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => {
                const hasSeen = seenIds.has(announcement.id);
                const expired = isExpired(announcement.expires_at);
                
                return (
                  <div
                    key={announcement.id}
                    className={`p-4 rounded-lg bg-muted/30 ${getSeverityBorderClass(announcement.severity)} ${
                      !announcement.is_active || expired ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-1 flex-wrap">
                        {getSeverityIcon(announcement.severity)}
                        <h4 className="font-semibold text-foreground">{announcement.title}</h4>
                        <Badge variant={getSeverityBadgeVariant(announcement.severity)} className="text-xs">
                          {announcement.severity}
                        </Badge>
                        {!announcement.is_active && (
                          <Badge variant="outline" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                        {expired && (
                          <Badge variant="outline" className="text-xs">
                            Expired
                          </Badge>
                        )}
                        {hasSeen && (
                          <Badge variant="secondary" className="text-xs">
                            Seen
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-3">
                      {announcement.message}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      {hasSeen && announcement.seen_at && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Seen: {format(new Date(announcement.seen_at), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <span>Published: {format(new Date(announcement.created_at), 'MMM d, yyyy')}</span>
                      </div>
                      {announcement.expires_at && (
                        <div className="flex items-center gap-1">
                          <span>Expires: {format(new Date(announcement.expires_at), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AnnouncementHistory;

