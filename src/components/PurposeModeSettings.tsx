import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';
import { TrendingUp, Upload, X, Flower, Star, Sparkles, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const SAMPLE_IMAGES = [
  { src: '/purpose-samples/compass.svg',  label: 'Compass – find your direction' },
  { src: '/purpose-samples/seedling.svg', label: 'Seedling – growth over time' },
  { src: '/purpose-samples/mountain.svg', label: 'Mountain – reach your peak' },
  { src: '/purpose-samples/sunrise.svg',  label: 'Sunrise – your future self' },
];

interface PurposeModeSettingsProps {
  userId: string;
  purposeModeEnabled: boolean;
  purposeImageUrl: string | null;
  animationIcon: 'flower' | 'star' | 'sparkle';
  onSettingsUpdate: () => void;
  onEffortCleared?: () => void;
}

const PurposeModeSettings: React.FC<PurposeModeSettingsProps> = ({
  userId,
  purposeModeEnabled,
  purposeImageUrl,
  animationIcon,
  onSettingsUpdate,
  onEffortCleared,
}) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTogglePurposeMode = async (enabled: boolean) => {
    try {
      // Get or create user settings
      const { data: existing } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('user_settings')
          .update({ purpose_mode_enabled: enabled })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_settings')
          .insert({
            user_id: userId,
            purpose_mode_enabled: enabled,
          });

        if (error) throw error;
      }

      onSettingsUpdate();
      toast({
        title: enabled ? "Progress Mode enabled" : "Progress Mode disabled",
        description: enabled
          ? "Your goal image is now visible in the header. Choose or upload an image."
          : "Progress Mode has been disabled.",
      });
    } catch (error) {
      console.error('Error toggling purpose mode:', error);
      toast({
        title: "Error",
        description: "Failed to update Progress Mode settings.",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    // Check if image is square (recommend 256x256px but allow any square)
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);
      
      if (img.width !== img.height) {
        toast({
          title: "Image should be square",
          description: "For best results, use a square image (recommended: 256x256px).",
          variant: "destructive",
        });
        return;
      }

      setIsUploading(true);
      try {
        const fileExt = file.name.split('.').pop();
        // Path structure: userId/purpose-image-timestamp.ext
        // This matches the storage policy that checks folder[1] = auth.uid()
        const filePath = `${userId}/purpose-image-${Date.now()}.${fileExt}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('purpose-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('purpose-images')
          .getPublicUrl(filePath);

        // Update user settings
        const { data: existing } = await supabase
          .from('user_settings')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (existing) {
          const { error: updateError } = await supabase
            .from('user_settings')
            .update({ purpose_image_url: publicUrl })
            .eq('user_id', userId);

          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase
            .from('user_settings')
            .insert({
              user_id: userId,
              purpose_image_url: publicUrl,
            });

          if (insertError) throw insertError;
        }

        // Delete old image if exists
        if (purposeImageUrl) {
          // Extract path from URL: https://...supabase.co/storage/v1/object/public/purpose-images/userId/filename
          // We need just userId/filename
          const urlParts = purposeImageUrl.split('/');
          const bucketIndex = urlParts.findIndex(part => part === 'purpose-images');
          if (bucketIndex !== -1 && urlParts.length > bucketIndex + 2) {
            const oldPath = `${urlParts[bucketIndex + 1]}/${urlParts[bucketIndex + 2]}`;
            await supabase.storage
              .from('purpose-images')
              .remove([oldPath]);
          }
        }

        onSettingsUpdate();
        toast({
          title: "Image uploaded",
          description: "Your goal image has been updated.",
        });
      } catch (error) {
        console.error('Error uploading image:', error);
        toast({
          title: "Error",
          description: "Failed to upload image. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      toast({
        title: "Invalid image",
        description: "Could not load the image file.",
        variant: "destructive",
      });
    };

    img.src = objectUrl;
  };

  const handleRemoveImage = async () => {
    try {
      if (purposeImageUrl) {
        // Extract path from URL: https://...supabase.co/storage/v1/object/public/purpose-images/userId/filename
        // We need just userId/filename
        const urlParts = purposeImageUrl.split('/');
        const bucketIndex = urlParts.findIndex(part => part === 'purpose-images');
        if (bucketIndex !== -1 && urlParts.length > bucketIndex + 2) {
          const path = `${urlParts[bucketIndex + 1]}/${urlParts[bucketIndex + 2]}`;
          await supabase.storage
            .from('purpose-images')
            .remove([path]);
        }
      }

      const { error } = await supabase
        .from('user_settings')
        .update({ purpose_image_url: null })
        .eq('user_id', userId);

      if (error) throw error;

      onSettingsUpdate();
      toast({
        title: "Image removed",
        description: "Goal image has been removed.",
      });
    } catch (error) {
      console.error('Error removing image:', error);
      toast({
        title: "Error",
        description: "Failed to remove image.",
        variant: "destructive",
      });
    }
  };

  const handleSelectSampleImage = async (src: string) => {
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({ user_id: userId, purpose_image_url: src }, { onConflict: 'user_id' });
      if (error) throw error;
      onSettingsUpdate();
      toast({ title: 'Goal image updated' });
    } catch (error) {
      console.error('Error selecting sample image:', error);
      toast({ title: 'Error', description: 'Failed to set goal image.', variant: 'destructive' });
    }
  };

  const handleAnimationIconChange = async (icon: 'flower' | 'star' | 'sparkle') => {
    try {
      const { data: existing } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('user_settings')
          .update({ effort_animation_icon: icon })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_settings')
          .insert({
            user_id: userId,
            effort_animation_icon: icon,
          });

        if (error) throw error;
      }

      onSettingsUpdate();
    } catch (error) {
      console.error('Error updating animation icon:', error);
      toast({
        title: "Error",
        description: "Failed to update animation icon.",
        variant: "destructive",
      });
    }
  };

  const handleClearAllIcons = async () => {
    try {
      // Get today's date in PST
      const now = new Date();
      const pstNow = toZonedTime(now, 'America/Los_Angeles');
      const today = format(pstNow, 'yyyy-MM-dd');

      // Delete all effort records for today
      const { error } = await supabase
        .from('task_effort')
        .delete()
        .eq('user_id', userId)
        .eq('date', today);

      if (error) throw error;

      toast({
        title: "Icons cleared",
        description: "All effort icons have been cleared.",
      });

      if (onEffortCleared) {
        onEffortCleared();
      }
    } catch (error) {
      console.error('Error clearing effort icons:', error);
      toast({
        title: "Error",
        description: "Failed to clear icons. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 w-9 p-0 border-gray-400 dark:border-border" title="Progress Mode Settings">
          <TrendingUp className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Progress Mode</h4>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="purpose-mode"
                checked={purposeModeEnabled}
                onCheckedChange={handleTogglePurposeMode}
              />
              <Label
                htmlFor="purpose-mode"
                className="text-sm font-normal cursor-pointer"
              >
                Enable Progress Mode
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Choose a goal image that represents what you're working towards. Each time you log effort on a task, your chosen icon appears around it — a visual reminder of your progress and intent.
            </p>
          </div>

          {purposeModeEnabled && (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Goal Image</Label>
                <p className="text-xs text-muted-foreground">
                  Choose a built-in image or upload your own (recommended: 256×256px square).
                </p>
                {/* Sample image grid */}
                <div className="grid grid-cols-4 gap-2">
                  {SAMPLE_IMAGES.map(({ src, label }) => (
                    <button
                      key={src}
                      title={label}
                      onClick={() => handleSelectSampleImage(src)}
                      className={cn(
                        "rounded-full overflow-hidden border-2 cursor-pointer transition-all focus:outline-none",
                        purposeImageUrl === src
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <img src={src} alt={label} className="w-14 h-14 object-cover" />
                    </button>
                  ))}
                </div>
                {/* Divider */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex-1 border-t border-border" />
                  <span>or upload your own</span>
                  <div className="flex-1 border-t border-border" />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex-1"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploading ? 'Uploading...' : purposeImageUrl ? 'Change Image' : 'Upload Image'}
                  </Button>
                  {purposeImageUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveImage}
                      className="px-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {purposeImageUrl && (
                  <div className="mt-2">
                    <img
                      src={purposeImageUrl}
                      alt="Goal image preview"
                      className="w-16 h-16 rounded-full object-cover border border-border"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Icon</Label>
                <Select value={animationIcon} onValueChange={handleAnimationIconChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flower">
                      <div className="flex items-center gap-2">
                        <Flower className="w-4 h-4" />
                        <span>Flower</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="star">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        <span>Star</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="sparkle">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        <span>Sparkle</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose the icon that appears around the anchor when you mark effort on tasks.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAllIcons}
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Icons
                </Button>
                <p className="text-xs text-muted-foreground">
                  Remove all effort icons from the purpose anchor for today.
                </p>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default PurposeModeSettings;

