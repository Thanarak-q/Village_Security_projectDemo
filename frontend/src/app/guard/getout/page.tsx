import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Info } from "lucide-react";

export default function GetOutPlaceholderPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 inline-flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
        <Info className="h-4 w-4" />
        <span>หน้านี้เป็นตำแหน่งชั่วคราว (placeholder)</span>
      </div>

      <h1 className="mb-3 text-2xl font-semibold tracking-tight">
        รายงานการออกของผู้เยี่ยม (Get Out)
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        ตอนนี้เมนูนี้เชื่อมไปยังหน้ารายชื่อผู้เยี่ยมที่ยังอยู่ในหมู่บ้าน
        เพื่อให้คุณสามารถกดอนุมัติการออกได้
      </p>

      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/guard/visitors-in" prefetch>
            ไปที่รายชื่อผู้เยี่ยมที่ยังอยู่
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>

        <Button asChild variant="outline">
          <Link href="/guard" prefetch>
            กลับหน้าหลักของรปภ.
          </Link>
        </Button>
      </div>

      <p className="mt-6 max-w-lg text-xs leading-relaxed text-muted-foreground">
        หมายเหตุ: ขณะนี้ข้อมูลเชื่อมต่อเป็นแบบจำลอง (mock) และจะแทนที่ด้วย API
        จริงในภายหลัง โดยรายการจะแสดงเฉพาะผู้เยี่ยมที่มีสถานะ “อยู่ในหมู่บ้าน
        (isIn = true)” และปุ่ม “อนุมัติออก” จะส่งค่า visitorId
        ไปยังระบบจริงเมื่อพัฒนาสำเร็จ
      </p>
    </div>
  );
}
