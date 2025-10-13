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
import { Plus, Users } from "lucide-react";
import { AddStaffForm } from "./AddStaffForm";

interface StaffMember {
  admin_id: string;
  username: string;
  email: string | null;
  phone: string | null;
  status: "verified" | "pending" | "disable";
  role: string;
  password_changed_at: string | null;
  created_at: string;
  updated_at: string;
  village_id: string;
  village_name: string;
}

interface AddStaffDialogProps {
  villageId: string;
  villageName: string;
  onStaffAdded: (staff: StaffMember) => void;
  onRefresh: () => void;
}

export function AddStaffDialog({ villageId, villageName, onStaffAdded, onRefresh }: AddStaffDialogProps) {
  const [open, setOpen] = useState(false);

  const handleStaffAdded = (staff: StaffMember) => {
    onStaffAdded(staff);
    onRefresh();
    // Dialog will stay open until user manually closes it
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
            เพิ่มนิติบุคคลใหม่เข้าสู่ระบบสำหรับ {villageName}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <AddStaffForm
            villageId={villageId}
            villageName={villageName}
            onStaffAdded={handleStaffAdded}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
