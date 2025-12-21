import React, { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'success' | 'error';
  created_at: string;
}

interface AnnouncementDialogProps {
  userId: string;
}

const AnnouncementDialog: React.FC<AnnouncementDialogProps> = ({ userId }) => {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (userId) {
      checkForAnnouncements();
    }
  }, [userId]);

  const checkForAnnouncements = async () => {
    try {
      // Fetch all active announcements
      const { data: announcements, error: announcementsError } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
        .order('created_at', { ascending: false });

      if (announcementsError) {
        console.error('Error fetching announcements:', announcementsError);
        return;
      }

      if (!announcements || announcements.length === 0) {
        return;
      }

      // Fetch which announcements the user has already seen
      const { data: seenAnnouncements, error: seenError } = await supabase
        .from('user_announcements_seen')
        .select('announcement_id')
        .eq('user_id', userId);

      if (seenError) {
        console.error('Error fetching seen announcements:', seenError);
        return;
      }

      const seenIds = new Set(seenAnnouncements?.map(s => s.announcement_id) || []);

      // Find the first unseen announcement
      const unseenAnnouncement = announcements.find(a => !seenIds.has(a.id));

      if (unseenAnnouncement) {
        setAnnouncement(unseenAnnouncement as Announcement);
        setOpen(true);
      }
    } catch (error) {
      console.error('Error checking announcements:', error);
    }
  };

  const markAsSeen = async () => {
    if (!announcement) return;

    try {
      const { error } = await supabase
        .from('user_announcements_seen')
        .insert({
          user_id: userId,
          announcement_id: announcement.id,
        });

      if (error && !error.message.includes('duplicate')) {
        console.error('Error marking announcement as seen:', error);
      }

      setOpen(false);
      setAnnouncement(null);
    } catch (error) {
      console.error('Error marking announcement as seen:', error);
      setOpen(false);
    }
  };

  const getSeverityIcon = () => {
    if (!announcement) return null;

    const iconClass = "w-6 h-6 mr-2";
    
    switch (announcement.severity) {
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

  const getSeverityClass = () => {
    if (!announcement) return '';

    switch (announcement.severity) {
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

  if (!announcement) return null;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className={`${getSeverityClass()}`}>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center">
            {getSeverityIcon()}
            {announcement.title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base whitespace-pre-wrap">
            {announcement.message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={markAsSeen}
            className="rounded-md bg-blue-500 text-white hover:bg-blue-600"
          >
            Got it
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AnnouncementDialog;

