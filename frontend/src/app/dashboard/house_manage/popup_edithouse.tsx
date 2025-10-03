"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Home } from "lucide-react"

// Form schema
const formSchema = z.object({
  address: z.string().min(1, {
    message: "กรุณากรอกบ้านเลขที่",
  }),
  status: z.string().min(1, {
    message: "กรุณาเลือกสถานะ",
  }),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface EditHouseDialogProps {
  house: {
    house_id: string
    address: string
    status: string
    village_id?: string | null
  }
  children?: React.ReactNode
  onUpdate?: () => void
}

export default function EditHouseDialog({ house, children, onUpdate }: EditHouseDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: house.address === '-' ? '' : house.address,
      status: house.status,
      notes: "",
    },
  })

  // แปลงสถานะเป็นภาษาไทย



  async function onSubmit(data: FormData) {
    setIsSubmitting(true)
    try {
      // Make API call to update house data
      const response = await fetch(`/api/house-manage/${house.house_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: data.address,
          status: data.status
        })
      })

      const result = await response.json()

      if (result.success) {
        alert("บันทึกข้อมูลบ้านเรียบร้อย")
        // Close dialog and refresh data
        if (onUpdate) {
          onUpdate()
        }
      } else {
        alert(`เกิดข้อผิดพลาด: ${result.error}`)
      }
    } catch (error) {
      console.error("Error updating house:", error)
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || <Button variant="outline">แก้ไข</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="relative">
          <DialogClose asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute right-0 top-0 p-0 h-6 w-6"
            >
            </Button>
          </DialogClose>
          <DialogTitle className="text-lg font-semibold pr-6">
            แก้ไขข้อมูลบ้าน
          </DialogTitle>
        </DialogHeader>

        {/* House Info Section */}
        <div className="flex items-center gap-3 py-4 border-b">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Home className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="font-medium text-foreground">
              {house.address === '-' ? 'ไม่ระบุ' : house.address}
            </div>
            <div className="text-sm text-muted-foreground">
              {(house.village_id ?? "")
                ? (house.village_id ?? "")
                    .replace(/-/g, ' ')
                    .replace(/\b\w/g, l => l.toUpperCase())
                : 'ไม่ระบุ'}
            </div>
          </div>
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
                    บ้านเลขที่
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="123/45"
                      {...field}
                      className="placeholder:text-muted-foreground"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* หมู่บ้าน (แสดงเฉพาะข้อมูล ไม่สามารถแก้ไขได้) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                หมู่บ้าน
              </label>
              <div className="px-3 py-2 bg-muted border border-border rounded-md text-muted-foreground">
                {(house.village_id ?? "")
                  ? (house.village_id ?? "")
                      .replace(/-/g, ' ')
                      .replace(/\b\w/g, l => l.toUpperCase())
                  : "ไม่ระบุ"}
              </div>
              <p className="text-xs text-muted-foreground">
                ไม่สามารถเปลี่ยนหมู่บ้านของบ้านได้
              </p>
            </div>

            {/* สถานะ */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground">
                    สถานะ
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกสถานะ" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="available">ว่าง</SelectItem>
                      <SelectItem value="occupied">มีผู้อยู่อาศัย</SelectItem>
                      <SelectItem value="disable">ไม่ใช้งาน</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* หมายเหตุ */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground">
                    หมายเหตุ (ไม่บังคับ)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="เพิ่มหมายเหตุหรือข้อมูลเพิ่มเติม..."
                      {...field}
                      className="placeholder:text-muted-foreground min-h-[60px]"
                    />
                  </FormControl>
                  <FormMessage />
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
                >
                  ยกเลิก
                </Button>
              </DialogClose>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 
