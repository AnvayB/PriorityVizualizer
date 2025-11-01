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
  User,
  RefreshCw,
  Menu
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

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
        {/* Combined Menu Dropdown */}
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1 md:gap-2 text-sm flex-1 sm:flex-none">
                  <Menu className="w-4 h-4" />
                  <span className="text-xs sm:hidden">Menu</span>
                  <span className="hidden sm:inline">Menu</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {/* Load/Refresh Section */}
                <DropdownMenuItem onClick={onLoadFromSupabase} className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">Reload Data</span>
                    <span className="text-xs text-muted-foreground">Refresh from database</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onLoadFromFile} className="gap-2">
                  <FolderOpen className="w-4 h-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">Open File</span>
                    <span className="text-xs text-muted-foreground">Import from your device</span>
                  </div>
                </DropdownMenuItem>
                
                {/* Separator */}
                <div className="my-1 h-px bg-border" />
                
                {/* Save Section */}
                <DropdownMenuItem disabled className="gap-2 opacity-50 cursor-not-allowed pointer-events-none">
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
                
                {/* Guest Demo Option */}
                {isGuestUser?.() && onLoadGuestData && (
                  <>
                    <div className="my-1 h-px bg-border" />
                    <DropdownMenuItem onClick={onLoadGuestData} className="gap-2">
                      <User className="w-4 h-4" />
                      <div className="flex flex-col">
                        <span className="font-medium">Try Demo</span>
                        <span className="text-xs text-muted-foreground">Load sample data</span>
                      </div>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipTrigger>
          <TooltipContent>
            <p>File operations</p>
          </TooltipContent>
        </Tooltip>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Sign Out Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              onClick={onSignOut} 
              variant="outline" 
              size="sm" 
              className="h-9 w-9 p-0"
            >
              <LogOut className="w-4 h-4" />
              <span className="sr-only">Sign Out</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Sign out of your account</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default MobileNavigation;
