import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Workspace } from '@/types/priorities';

interface WorkspaceTabsProps {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  onSwitch: (id: string) => void;
  onAdd: (name: string) => Promise<void>;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const WorkspaceTabs: React.FC<WorkspaceTabsProps> = ({
  workspaces,
  activeWorkspaceId,
  onSwitch,
  onAdd,
  onRename,
  onDelete,
}) => {
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameName, setRenameName] = useState('');
  const [renameId, setRenameId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!addName.trim()) return;
    await onAdd(addName.trim());
    setAddName('');
    setAddOpen(false);
  };

  const handleRename = async () => {
    if (!renameId || !renameName.trim()) return;
    await onRename(renameId, renameName.trim());
    setRenameOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await onDelete(deleteId);
    setDeleteOpen(false);
    setDeleteId(null);
  };

  const openRename = (id: string, currentName: string) => {
    setRenameId(id);
    setRenameName(currentName);
    setRenameOpen(true);
  };

  const openDelete = (id: string) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  if (workspaces.length <= 1 && !workspaces.length) return null;

  return (
    <>
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
        {workspaces.map((ws) => {
          const isActive = ws.id === activeWorkspaceId;
          return (
            <div key={ws.id} className="flex items-center shrink-0">
              <button
                onClick={() => onSwitch(ws.id)}
                className={cn(
                  'flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-l-full text-sm font-medium transition-colors whitespace-nowrap',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                )}
              >
                {ws.emoji && <span>{ws.emoji}</span>}
                {ws.name}
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      'flex items-center px-1.5 py-1.5 rounded-r-full text-xs transition-colors border-l',
                      isActive
                        ? 'bg-primary text-primary-foreground border-primary-foreground/20 hover:bg-primary/80'
                        : 'bg-muted text-muted-foreground border-muted-foreground/20 hover:bg-muted/80'
                    )}
                  >
                    <MoreHorizontal className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => openRename(ws.id, ws.name)}>
                    <Pencil className="w-3.5 h-3.5 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => openDelete(ws.id)}
                    disabled={workspaces.length <= 1}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
          title="New workspace"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Add workspace */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New Workspace</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 pt-1">
            <Input
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              placeholder="Workspace name"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              autoFocus
            />
            <Button onClick={handleAdd} disabled={!addName.trim()}>Create</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename workspace */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename Workspace</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 pt-1">
            <Input
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              placeholder="Workspace name"
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              autoFocus
            />
            <Button onClick={handleRename} disabled={!renameName.trim()}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete workspace?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the workspace and all its sections, subsections, and tasks. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default WorkspaceTabs;
