import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  LogOut, 
  Save, 
  Upload, 
  ChevronDown, 
  Download,
  FolderOpen,
  Database,
  HardDrive,
  User
} from 'lucide-react';

interface MobileNavigationProps {
  onSignOut: () => void;
  onSaveToDatabase: () => void;
  onSaveToComputer: () => void;
  onLoadFromSupabase: () => void;
  onLoadFromFile: () => void;
  onLoadGuestData?: () => void;
  user?: { email: string } | null;
  isGuestUser?: () => boolean;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  onSignOut,
  onSaveToDatabase,
  onSaveToComputer,
  onLoadFromSupabase,
  onLoadFromFile,
  onLoadGuestData,
  user,
  isGuestUser
}) => {
  return (
    <TooltipProvider>
      <div className="flex gap-2 w-full sm:w-auto">
        {/* Sign Out Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              onClick={onSignOut} 
              variant="outline" 
              size="sm" 
              className="gap-1 md:gap-2 flex-1 sm:flex-none"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-xs sm:hidden">Logout</span>
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Sign out of your account</p>
          </TooltipContent>
        </Tooltip>

        {/* Save Dropdown */}
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-1 md:gap-2 text-sm flex-1 sm:flex-none">
                  <Save className="w-4 h-4" />
                  <span className="text-xs sm:hidden">Save</span>
                  <span className="hidden sm:inline">Save</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onSaveToDatabase} className="gap-2">
                  <Database className="w-4 h-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">Save to Cloud</span>
                    <span className="text-xs text-muted-foreground">Store in your account</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onSaveToComputer} className="gap-2">
                  <Download className="w-4 h-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">Download File</span>
                    <span className="text-xs text-muted-foreground">Save to your device</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipTrigger>
          <TooltipContent>
            <p>Save your priorities</p>
          </TooltipContent>
        </Tooltip>

        {/* Load Dropdown */}
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1 md:gap-2 text-sm flex-1 sm:flex-none">
                  <Upload className="w-4 h-4" />
                  <span className="text-xs sm:hidden">Load</span>
                  <span className="hidden sm:inline">Load</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onLoadFromSupabase} className="gap-2">
                  <Database className="w-4 h-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">Load from Cloud</span>
                    <span className="text-xs text-muted-foreground">Restore from your account</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onLoadFromFile} className="gap-2">
                  <FolderOpen className="w-4 h-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">Open File</span>
                    <span className="text-xs text-muted-foreground">Import from your device</span>
                  </div>
                </DropdownMenuItem>
                {isGuestUser?.() && onLoadGuestData && (
                  <DropdownMenuItem onClick={onLoadGuestData} className="gap-2">
                    <User className="w-4 h-4" />
                    <div className="flex flex-col">
                      <span className="font-medium">Try Demo</span>
                      <span className="text-xs text-muted-foreground">Load sample data</span>
                    </div>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipTrigger>
          <TooltipContent>
            <p>Load your priorities</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default MobileNavigation;
