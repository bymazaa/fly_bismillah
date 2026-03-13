'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2 } from "lucide-react";

interface DeleteAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting: boolean;
  title?: string;
  description?: string;
}

export function DeleteAlert({
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
  title = "Are you absolutely sure?",
  description = "This action cannot be undone. This will permanently delete the item from our servers."
}: DeleteAlertProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[400px] rounded-xl border-0">
        <AlertDialogHeader>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-50 rounded-full w-fit">
               <Trash2 className="w-6 h-6 text-rose-600" />
            </div>
            <AlertDialogTitle className="text-lg font-bold text-slate-900">
                {title}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2 text-slate-500">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 mt-4">
          <AlertDialogCancel disabled={isDeleting} className="rounded-lg cursor-pointer border-slate-200">Cancel</AlertDialogCancel>
          <AlertDialogAction

            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isDeleting}
            className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Yes, Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}