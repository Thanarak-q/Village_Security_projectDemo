"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Home, Plus, CheckCircle } from "lucide-react";

// Form schema
const formSchema = z.object({
  address: z.string().min(1, {
    message: "กรุณากรอกบ้านเลขที่",
  }),
});

type FormData = z.infer<typeof formSchema>;

interface AddHouseDialogProps {
  children?: React.ReactNode;
  onAdd?: () => void;
}

export default function AddHouseDialog({
  children,
  onAdd,
}: AddHouseDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [addedAddress, setAddedAddress] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: "",
    },
  });

  async function onSubmit(data: FormData) {
    setIsSubmitting(true);
    try {
      let villageId = sessionStorage.getItem("selectedVillageId");

      if (!villageId) {
        try {
          const userResponse = await fetch("/api/auth/me", {
            credentials: "include",
          });

          if (userResponse.ok) {
            const userData = await userResponse.json();
            const fallbackId: string | undefined = userData?.village_ids?.[0];

            if (fallbackId) {
              villageId = fallbackId;
              sessionStorage.setItem("selectedVillageId", fallbackId);
            }
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
        }
      }

      if (!villageId) {
        alert("กรุณาเลือกหมู่บ้านก่อน - ไปที่เมนู 'เปลี่ยนหมู่บ้าน' เพื่อเลือกหมู่บ้าน");
        return;
      }

      // Make API call to create new house
      const response = await fetch("/api/house-manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: data.address.trim(),
          village_id: villageId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Store the added address for the success dialog
        setAddedAddress(data.address.trim());
        // Reset form and close dialog
        form.reset();
        setIsOpen(false);
        // Show success dialog
        setShowSuccessDialog(true);
        // Refresh data
        if (onAdd) {
          onAdd();
        }
      } else {
        alert(`เกิดข้อผิดพลาด: ${result.error}`);
      }
    } catch (error) {
      console.error("Error creating house:", error);
      alert("เกิดข้อผิดพลาดในการเพิ่มบ้าน");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          {children || (
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              เพิ่มบ้านใหม่
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="start">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Home className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">เพิ่มบ้านใหม่</h2>
            </div>

            {/* Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* บ้านเลขที่ */}
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">
                        บ้านเลขที่ *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="เช่น 123/45, 67/8, A-15"
                          {...field}
                          className="placeholder:text-muted-foreground"
                          autoFocus
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        บ้านจะถูกเพิ่มในหมู่บ้านของคุณโดยอัตโนมัติ
                      </p>
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    disabled={isSubmitting}
                    onClick={() => {
                      form.reset();
                      setIsOpen(false);
                    }}
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "กำลังเพิ่ม..." : "เพิ่มบ้าน"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </PopoverContent>
      </Popover>

      {/* Success Dialog */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <AlertDialogTitle className="text-xl font-semibold text-green-800 dark:text-green-200">
              เพิ่มบ้านใหม่เรียบร้อย
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-muted-foreground">
              บ้านเลขที่ <span className="font-medium text-foreground">{addedAddress}</span> ได้ถูกเพิ่มเข้าสู่ระบบเรียบร้อยแล้ว
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-center pt-2">
            <AlertDialogAction
              onClick={() => setShowSuccessDialog(false)}
              className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
            >
              ตกลง
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
