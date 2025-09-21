"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Building, Plus, X } from "lucide-react";

interface Village {
  village_id: string;
  village_name: string;
  village_key: string;
}

interface VillageMultiSelectProps {
  villages: Village[];
  selectedVillageKeys: string[];
  onSelectionChange: (villageKeys: string[]) => void;
  role: "admin" | "staff";
  disabled?: boolean;
}

export default function VillageMultiSelect({
  villages,
  selectedVillageKeys,
  onSelectionChange,
  role,
  disabled = false,
}: VillageMultiSelectProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tempSelection, setTempSelection] = useState<string[]>(selectedVillageKeys);

  const handleVillageToggle = (villageKey: string, checked: boolean) => {
    if (checked) {
      setTempSelection([...tempSelection, villageKey]);
    } else {
      setTempSelection(tempSelection.filter(key => key !== villageKey));
    }
  };

  const handleSave = () => {
    onSelectionChange(tempSelection);
    setIsDialogOpen(false);
  };

  const handleCancel = () => {
    setTempSelection(selectedVillageKeys);
    setIsDialogOpen(false);
  };

  const getSelectedVillages = () => {
    return villages.filter(village => selectedVillageKeys.includes(village.village_key));
  };

  const isVillageSelected = (villageKey: string) => {
    return selectedVillageKeys.includes(villageKey);
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
            <Badge key={village.village_key} variant="secondary" className="flex items-center gap-1">
              <Building className="h-3 w-3" />
              {village.village_name}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => {
                    const newSelection = selectedVillageKeys.filter(key => key !== village.village_key);
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
            {selectedVillageKeys.length > 0 ? "แก้ไขหมู่บ้าน" : "เลือกหมู่บ้าน"}
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
              <div key={village.village_key} className="flex items-center space-x-2">
                <Checkbox
                  id={village.village_key}
                  checked={tempSelection.includes(village.village_key)}
                  onCheckedChange={(checked) => 
                    handleVillageToggle(village.village_key, checked as boolean)
                  }
                />
                <Label 
                  htmlFor={village.village_key}
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <Building className="h-4 w-4" />
                  {village.village_name}
                </Label>
              </div>
            ))}
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

      {/* Validation Message */}
      {role === "staff" && selectedVillageKeys.length === 0 && (
        <p className="text-sm text-red-500">
          Staff ต้องมีหมู่บ้านอย่างน้อย 1 หมู่บ้าน
        </p>
      )}
    </div>
  );
}
