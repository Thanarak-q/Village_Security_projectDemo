"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Users } from "lucide-react";
import { AddStaffForm } from "./AddStaffForm";

interface AddStaffDialogProps {
  villageKey: string;
  villageName: string;
  onStaffAdded: (staff: any) => void;
  onRefresh: () => void;
}

export function AddStaffDialog({ villageKey, villageName, onStaffAdded, onRefresh }: AddStaffDialogProps) {
  const [open, setOpen] = useState(false);

  const handleStaffAdded = (staff: any) => {
    onStaffAdded(staff);
    setOpen(false);
    onRefresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">เพิ่มนิติบุคคล</span>
          <span className="sm:hidden">เพิ่ม</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            เพิ่มนิติบุคคลใหม่
          </DialogTitle>
          <DialogDescription>
            เพิ่มนิติบุคคลใหม่เข้าสู่ระบบสำหรับหมู่บ้าน {villageName}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <AddStaffForm
            villageKey={villageKey}
            villageName={villageName}
            onStaffAdded={handleStaffAdded}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
