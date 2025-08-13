"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Home, Plus } from "lucide-react";

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

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: "",
    },
  });

  async function onSubmit(data: FormData) {
    setIsSubmitting(true);
    try {
      // Make API call to create new house
      const response = await fetch("/api/house-manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: data.address.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert("เพิ่มบ้านใหม่เรียบร้อย");
        // Reset form and close dialog
        form.reset();
        setIsOpen(false);
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            เพิ่มบ้านใหม่
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Home className="h-4 w-4 text-blue-600" />
            </div>
            เพิ่มบ้านใหม่
          </DialogTitle>
        </DialogHeader>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* บ้านเลขที่ */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    บ้านเลขที่ *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="เช่น 123/45, 67/8, A-15"
                      {...field}
                      className="placeholder:text-gray-400"
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-gray-500">
                    บ้านจะถูกเพิ่มในหมู่บ้านของคุณโดยอัตโนมัติ
                  </p>
                </FormItem>
              )}
            />

            <DialogFooter className="flex gap-3 pt-6">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled={isSubmitting}
                  onClick={() => form.reset()}
                >
                  ยกเลิก
                </Button>
              </DialogClose>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "กำลังเพิ่ม..." : "เพิ่มบ้าน"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
