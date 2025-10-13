"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Building, Plus, X, MapPin } from "lucide-react";
import { toast } from "sonner";

interface Village {
  village_id: string;
  village_name: string;
  address?: string;
}

interface VillageMultiSelectProps {
  villages: Village[];
  selectedVillageIds: string[];
  onSelectionChange: (villageIds: string[]) => void;
  onVillagesChange: (villages: Village[]) => void;
  role: "admin" | "staff";
  disabled?: boolean;
}

export default function VillageMultiSelect({
  villages,
  selectedVillageIds,
  onSelectionChange,
  onVillagesChange,
  role,
  disabled = false,
}: VillageMultiSelectProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [tempSelection, setTempSelection] = useState<string[]>(selectedVillageIds);
  const [newVillage, setNewVillage] = useState({
    village_name: "",
    address: "",
  });
  const [creating, setCreating] = useState(false);

  const handleVillageToggle = (villageId: string, checked: boolean) => {
    if (checked) {
      setTempSelection([...tempSelection, villageId]);
    } else {
      setTempSelection(tempSelection.filter(id => id !== villageId));
    }
  };

  const handleSave = () => {
    onSelectionChange(tempSelection);
    setIsDialogOpen(false);
  };

  const handleCancel = () => {
    setTempSelection(selectedVillageIds);
    setIsDialogOpen(false);
  };

  const handleCreateVillage = async () => {
    if (!newVillage.village_name.trim()) {
      toast.error("กรุณากรอกชื่อหมู่บ้าน");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/superadmin/villages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(newVillage),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("สร้างหมู่บ้านสำเร็จ");
        // Add new village to the list
        const updatedVillages = [...villages, data.data];
        onVillagesChange(updatedVillages);
        
        // Auto-select the new village
        const newSelection = [...tempSelection, data.data.village_id];
        setTempSelection(newSelection);
        
        // Reset form
        setNewVillage({ village_name: "", address: "" });
        setIsCreateDialogOpen(false);
      } else {
        toast.error(data.error || "Failed to create village");
      }
    } catch (err) {
      toast.error("Failed to create village");
      console.error("Error creating village:", err);
    } finally {
      setCreating(false);
    }
  };

  const getSelectedVillages = () => {
    return villages.filter(village => selectedVillageIds.includes(village.village_id));
  };

  const isVillageSelected = (villageId: string) => {
    return selectedVillageIds.includes(villageId);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="villages">
        หมู่บ้าน {role === "staff" && <span className="text-red-500">*</span>}
      </Label>
      
      {/* Selected Villages Display */}
      <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md bg-muted/50">
        {getSelectedVillages().length > 0 ? (
          getSelectedVillages().map((village) => (
            <Badge key={village.village_id} variant="secondary" className="flex items-center gap-1">
              <Building className="h-3 w-3" />
              {village.village_name}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => {
                    const newSelection = selectedVillageIds.filter(id => id !== village.village_id);
                    onSelectionChange(newSelection);
                  }}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))
        ) : (
          <span className="text-muted-foreground text-sm">
            {role === "staff" ? "กรุณาเลือกหมู่บ้านอย่างน้อย 1 หมู่บ้าน" : "ยังไม่ได้เลือกหมู่บ้าน"}
          </span>
        )}
      </div>

      {/* Selection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            {selectedVillageIds.length > 0 ? "แก้ไขหมู่บ้าน" : "เลือกหมู่บ้าน"}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>เลือกหมู่บ้าน</DialogTitle>
            <DialogDescription>
              {role === "staff" 
                ? "Staff ต้องมีหมู่บ้านอย่างน้อย 1 หมู่บ้าน"
                : "Admin สามารถมีหลายหมู่บ้านได้"
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {villages.map((village) => (
              <div key={village.village_id} className="flex items-center space-x-2">
                <Checkbox
                  id={village.village_id}
                  checked={tempSelection.includes(village.village_id)}
                  onCheckedChange={(checked) => 
                    handleVillageToggle(village.village_id, checked as boolean)
                  }
                />
                <Label 
                  htmlFor={village.village_id}
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <Building className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{village.village_name}</span>
                    {village.address && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {village.address}
                      </span>
                    )}
                  </div>
                </Label>
              </div>
            ))}
          </div>

          {/* Create New Village Button */}
          <div className="border-t pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateDialogOpen(true)}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              สร้างหมู่บ้านใหม่
            </Button>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              ยกเลิก
            </Button>
            <Button 
              type="button" 
              onClick={handleSave}
              disabled={role === "staff" && tempSelection.length === 0}
            >
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Village Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>สร้างหมู่บ้านใหม่</DialogTitle>
            <DialogDescription>
              เพิ่มหมู่บ้านใหม่เข้าไปในระบบ
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="village_name">ชื่อหมู่บ้าน</Label>
              <Input
                id="village_name"
                value={newVillage.village_name}
                onChange={(e) => setNewVillage({ ...newVillage, village_name: e.target.value })}
                placeholder="เช่น หมู่บ้านผาสุก"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">ที่อยู่ (ไม่บังคับ)</Label>
              <Input
                id="address"
                value={newVillage.address}
                onChange={(e) => setNewVillage({ ...newVillage, address: e.target.value })}
                placeholder="เช่น 123 ถนนสุขุมวิท กรุงเทพฯ"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleCreateVillage} disabled={creating}>
              {creating ? "กำลังสร้าง..." : "สร้างหมู่บ้าน"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Validation Message */}
      {role === "staff" && selectedVillageIds.length === 0 && (
        <p className="text-sm text-red-500">
          Staff ต้องมีหมู่บ้านอย่างน้อย 1 หมู่บ้าน
        </p>
      )}
    </div>
  );
}
