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
  DialogDescription,
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
    village_key: string
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
  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'ว่าง'
      case 'occupied':
        return 'มีผู้อยู่อาศัย'
      case 'maintenance':
        return 'กำลังปรับปรุง'
      case 'pending':
        return 'รอการตรวจสอบ'
      default:
        return status
    }
  }



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
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <Home className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {house.address === '-' ? 'ไม่ระบุ' : house.address}
            </div>
            <div className="text-sm text-gray-500">
              {house.village_key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
                  <FormLabel className="text-sm font-medium text-gray-700">
                    บ้านเลขที่
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="123/45"
                      {...field}
                      className="placeholder:text-gray-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* หมู่บ้าน (แสดงเฉพาะข้อมูล ไม่สามารถแก้ไขได้) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                หมู่บ้าน
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-600">
                {house.village_key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </div>
              <p className="text-xs text-gray-500">
                ไม่สามารถเปลี่ยนหมู่บ้านของบ้านได้
              </p>
            </div>

            {/* สถานะ */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
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
                  <FormLabel className="text-sm font-medium text-gray-700">
                    หมายเหตุ (ไม่บังคับ)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="เพิ่มหมายเหตุหรือข้อมูลเพิ่มเติม..."
                      {...field}
                      className="placeholder:text-gray-400 min-h-[60px]"
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
                className="flex-1 bg-blue-600 hover:bg-blue-700"
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