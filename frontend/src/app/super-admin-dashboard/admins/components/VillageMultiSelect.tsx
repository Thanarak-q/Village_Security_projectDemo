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
import { Building, Plus, X, MapPin, Edit } from "lucide-react";
import { toast } from "sonner";

interface Village {
  village_id: string;
  village_name: string;
  admin_count: number;
  address?: string | null;
  admins?: Array<{
    admin_id: string;
    username: string;
  }>;
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingVillage, setEditingVillage] = useState<Village | null>(null);
  const [newVillage, setNewVillage] = useState({
    village_name: "",
    address: "",
  });
  const [editVillage, setEditVillage] = useState({
    village_name: "",
    address: "",
  });
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleCancel = () => {
    setNewVillage({ village_name: "", address: "" });
    setIsDialogOpen(false);
  };

  const handleEditCancel = () => {
    setEditVillage({ village_name: "", address: "" });
    setEditingVillage(null);
    setIsEditDialogOpen(false);
  };

  const handleEditVillage = (village: Village) => {
    setEditingVillage(village);
    setEditVillage({
      village_name: village.village_name,
      address: village.address || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateVillage = async () => {
    if (!editingVillage || !editVillage.village_name.trim()) {
      toast.error("กรุณากรอกชื่อหมู่บ้าน");
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`/api/superadmin/villages/${editingVillage.village_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(editVillage),
      });

      const data = await response.json();
      if (data.success) {
        const updatedVillage = data.data;

        toast.success("แก้ไขหมู่บ้านสำเร็จ");
        // Update village in the list
        const updatedVillages = villages.map((village) =>
          village.village_id === editingVillage.village_id
            ? {
                ...village,
                ...updatedVillage,
                admin_count: village.admin_count,
              }
            : village
        );
        onVillagesChange(updatedVillages);
        
        // Reset form and close dialog
        setEditVillage({ village_name: "", address: "" });
        setEditingVillage(null);
        setIsEditDialogOpen(false);
      } else {
        toast.error(data.error || "Failed to update village");
      }
    } catch (err) {
      toast.error("Failed to update village");
      console.error("Error updating village:", err);
    } finally {
      setUpdating(false);
    }
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
        const createdVillage = {
          ...data.data,
          admin_count: 0,
        };

        toast.success("สร้างหมู่บ้านสำเร็จ");
        // Add new village to the list
        const updatedVillages = [...villages, createdVillage];
        onVillagesChange(updatedVillages);
        
        // Auto-select the new village and update the selection
        const newSelection = [...selectedVillageIds, data.data.village_id];
        onSelectionChange(newSelection);
        
        // Reset form and close dialog
        setNewVillage({ village_name: "", address: "" });
        setIsDialogOpen(false);
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
      
      {/* Selected Villages List */}
      <div className="space-y-2">
        {getSelectedVillages().length > 0 ? (
          getSelectedVillages().map((village) => (
            <div key={village.village_id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <Building className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{village.village_name}</p>
                  {village.address && (
                    <p className="text-sm text-muted-foreground">{village.address}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditVillage(village)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                {!disabled && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newSelection = selectedVillageIds.filter(id => id !== village.village_id);
                      onSelectionChange(newSelection);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 border rounded-lg bg-muted/30">
            <Building className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">
              {role === "staff" ? "กรุณาเลือกหมู่บ้านอย่างน้อย 1 หมู่บ้าน" : "ยังไม่ได้เลือกหมู่บ้าน"}
            </p>
          </div>
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
            เพิ่มหมู่บ้าน
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>สร้างหมู่บ้านใหม่</DialogTitle>
            <DialogDescription>
              เพิ่มหมู่บ้านใหม่เข้าไปในระบบและมอบหมายให้ Admin คนนี้
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
            <Button type="button" variant="outline" onClick={handleCancel}>
              ยกเลิก
            </Button>
            <Button 
              type="button" 
              onClick={handleCreateVillage}
              disabled={creating || !newVillage.village_name.trim()}
            >
              {creating ? "กำลังสร้าง..." : "สร้างหมู่บ้าน"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Village Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>แก้ไขหมู่บ้าน</DialogTitle>
            <DialogDescription>
              แก้ไขข้อมูลหมู่บ้าน
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_village_name">ชื่อหมู่บ้าน</Label>
              <Input
                id="edit_village_name"
                value={editVillage.village_name}
                onChange={(e) => setEditVillage({ ...editVillage, village_name: e.target.value })}
                placeholder="เช่น หมู่บ้านผาสุก"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_address">ที่อยู่ (ไม่บังคับ)</Label>
              <Input
                id="edit_address"
                value={editVillage.address}
                onChange={(e) => setEditVillage({ ...editVillage, address: e.target.value })}
                placeholder="เช่น 123 ถนนสุขุมวิท กรุงเทพฯ"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleEditCancel}>
              ยกเลิก
            </Button>
            <Button 
              type="button" 
              onClick={handleUpdateVillage}
              disabled={updating || !editVillage.village_name.trim()}
            >
              {updating ? "กำลังแก้ไข..." : "บันทึกการเปลี่ยนแปลง"}
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
