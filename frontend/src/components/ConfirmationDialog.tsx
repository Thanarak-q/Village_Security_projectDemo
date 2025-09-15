"use client";

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
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  type?: "approve" | "reject" | "warning";
  isLoading?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText = "ยกเลิก",
  type = "warning",
  isLoading = false,
}: ConfirmationDialogProps) {
  const getIcon = () => {
    switch (type) {
      case "approve":
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case "reject":
        return <XCircle className="h-6 w-6 text-red-600" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
    }
  };

  const getConfirmButtonVariant = () => {
    switch (type) {
      case "approve":
        return "default";
      case "reject":
        return "destructive";
      default:
        return "default";
    }
  };

  const getConfirmButtonText = () => {
    if (confirmText) return confirmText;
    switch (type) {
      case "approve":
        return "อนุมัติ";
      case "reject":
        return "ปฏิเสธ";
      default:
        return "ยืนยัน";
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-left text-lg font-semibold">
                {title}
              </AlertDialogTitle>
            </div>
          </div>
          <AlertDialogDescription className="text-left text-sm text-muted-foreground mt-2 whitespace-pre-line">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-3 sm:gap-2">
          <AlertDialogCancel asChild>
            <Button 
              variant="outline" 
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              {cancelText}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant={getConfirmButtonVariant()}
              onClick={onConfirm}
              disabled={isLoading}
              className={`min-w-[100px] flex-1 sm:flex-none ${
                type === 'approve' 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : type === 'reject'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : ''
              }`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span className="text-sm">กำลังดำเนินการ...</span>
                </div>
              ) : (
                <span className="font-medium">{getConfirmButtonText()}</span>
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
