import React from 'react';

/**
 * ตัวอย่างการใช้งาน Responsive Classes
 * ไฟล์นี้แสดงวิธีการใช้ responsive utilities ที่สร้างขึ้น
 */

export default function ResponsiveExample() {
  return (
    <div className="responsive-container">
      {/* ตัวอย่าง Responsive Grid */}
      <div className="responsive-grid mb-8">
        <div className="responsive-card p-4">
          <h3 className="responsive-heading font-semibold mb-2">Card 1</h3>
          <p className="responsive-text">เนื้อหาที่ปรับขนาดตามหน้าจอ</p>
        </div>
        <div className="responsive-card p-4">
          <h3 className="responsive-heading font-semibold mb-2">Card 2</h3>
          <p className="responsive-text">เนื้อหาที่ปรับขนาดตามหน้าจอ</p>
        </div>
        <div className="responsive-card p-4">
          <h3 className="responsive-heading font-semibold mb-2">Card 3</h3>
          <p className="responsive-text">เนื้อหาที่ปรับขนาดตามหน้าจอ</p>
        </div>
        <div className="responsive-card p-4">
          <h3 className="responsive-heading font-semibold mb-2">Card 4</h3>
          <p className="responsive-text">เนื้อหาที่ปรับขนาดตามหน้าจอ</p>
        </div>
      </div>

      {/* ตัวอย่าง Responsive Flex Layout */}
      <div className="responsive-flex gap-4 mb-8">
        <div className="flex-1 responsive-card p-4">
          <h3 className="responsive-text-lg font-semibold mb-2">Flex Item 1</h3>
          <p className="responsive-text-sm">เนื้อหาที่ปรับตามขนาดหน้าจอ</p>
        </div>
        <div className="flex-1 responsive-card p-4">
          <h3 className="responsive-text-lg font-semibold mb-2">Flex Item 2</h3>
          <p className="responsive-text-sm">เนื้อหาที่ปรับตามขนาดหน้าจอ</p>
        </div>
      </div>

      {/* ตัวอย่าง Responsive Table */}
      <div className="responsive-table mb-8">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="responsive-table-cell border border-gray-300 p-2 text-left">
                <span className="mobile-only">ชื่อ</span>
                <span className="tablet-up">ชื่อผู้ใช้</span>
              </th>
              <th className="responsive-table-cell border border-gray-300 p-2 text-left hidden sm:table-cell">
                อีเมล
              </th>
              <th className="responsive-table-cell border border-gray-300 p-2 text-left">
                สถานะ
              </th>
              <th className="responsive-table-cell border border-gray-300 p-2 text-left">
                การดำเนินการ
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="responsive-table-cell border border-gray-300 p-2">
                <div>
                  <div className="font-medium">สมชาย ใจดี</div>
                  <div className="text-xs text-gray-500 sm:hidden">somchai@example.com</div>
                </div>
              </td>
              <td className="responsive-table-cell border border-gray-300 p-2 hidden sm:table-cell">
                somchai@example.com
              </td>
              <td className="responsive-table-cell border border-gray-300 p-2">
                <span className="responsive-badge bg-green-100 text-green-800">
                  <span className="mobile-only">ใช้งาน</span>
                  <span className="tablet-up">ใช้งานได้</span>
                </span>
              </td>
              <td className="responsive-table-cell border border-gray-300 p-2">
                <button className="responsive-button bg-blue-600 text-white rounded">
                  <span className="mobile-only">แก้ไข</span>
                  <span className="tablet-up">แก้ไขข้อมูล</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ตัวอย่าง Responsive Buttons */}
      <div className="responsive-flex gap-4 mb-8">
        <button className="responsive-button bg-blue-600 text-white rounded touch-friendly">
          <span className="mobile-only">บันทึก</span>
          <span className="tablet-up">บันทึกข้อมูล</span>
        </button>
        <button className="responsive-button bg-gray-600 text-white rounded touch-friendly">
          <span className="mobile-only">ยกเลิก</span>
          <span className="tablet-up">ยกเลิกการแก้ไข</span>
        </button>
      </div>

      {/* ตัวอย่าง Responsive Text */}
      <div className="responsive-spacing">
        <h1 className="responsive-heading font-bold">หัวข้อหลัก</h1>
        <h2 className="responsive-text-lg font-semibold">หัวข้อรอง</h2>
        <p className="responsive-text">เนื้อหาปกติที่ปรับขนาดตามหน้าจอ</p>
        <p className="responsive-text-sm">เนื้อหาย่อยที่ปรับขนาดตามหน้าจอ</p>
        <p className="responsive-text-xs">ข้อความเล็กที่ปรับขนาดตามหน้าจอ</p>
      </div>

      {/* ตัวอย่าง Hide/Show Elements */}
      <div className="responsive-margin">
        <div className="mobile-only bg-blue-100 p-4 rounded">
          <p className="responsive-text-sm">แสดงเฉพาะบน Mobile</p>
        </div>
        <div className="tablet-up bg-green-100 p-4 rounded">
          <p className="responsive-text-sm">แสดงบน Tablet และ Desktop</p>
        </div>
        <div className="desktop-only bg-purple-100 p-4 rounded">
          <p className="responsive-text-sm">แสดงเฉพาะบน Desktop</p>
        </div>
      </div>

      {/* ตัวอย่าง Responsive Icons */}
      <div className="responsive-flex gap-4 mb-8">
        <div className="responsive-icon bg-blue-500 text-white rounded-full flex items-center justify-center">
          <svg className="responsive-icon-sm" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
          </svg>
        </div>
        <div className="responsive-icon bg-green-500 text-white rounded-full flex items-center justify-center">
          <svg className="responsive-icon-sm" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
          </svg>
        </div>
      </div>

      {/* ตัวอย่าง Responsive Chart Container */}
      <div className="responsive-card p-4 mb-8">
        <h3 className="responsive-text-lg font-semibold mb-4">กราฟตัวอย่าง</h3>
        <div className="responsive-chart bg-gray-100 rounded flex items-center justify-center">
          <p className="responsive-text-sm text-gray-600">พื้นที่สำหรับแสดงกราฟ</p>
        </div>
      </div>

      {/* ตัวอย่าง Responsive Badges */}
      <div className="responsive-flex gap-2 mb-8">
        <span className="responsive-badge bg-blue-100 text-blue-800 rounded-full">
          <span className="mobile-only">ใหม่</span>
          <span className="tablet-up">รายการใหม่</span>
        </span>
        <span className="responsive-badge bg-green-100 text-green-800 rounded-full">
          <span className="mobile-only">สำเร็จ</span>
          <span className="tablet-up">ดำเนินการสำเร็จ</span>
        </span>
        <span className="responsive-badge bg-red-100 text-red-800 rounded-full">
          <span className="mobile-only">ผิดพลาด</span>
          <span className="tablet-up">เกิดข้อผิดพลาด</span>
        </span>
      </div>
    </div>
  );
}

/**
 * วิธีการใช้งาน:
 * 
 * 1. Import component นี้เพื่อดูตัวอย่าง
 * 2. ใช้ responsive classes ในคอมโพเนนต์ของคุณ
 * 3. ทดสอบบนหน้าจอขนาดต่างๆ
 * 
 * Responsive Classes ที่แนะนำ:
 * - responsive-container: สำหรับ container หลัก
 * - responsive-grid: สำหรับ grid layout
 * - responsive-flex: สำหรับ flex layout
 * - responsive-text: สำหรับข้อความ
 * - responsive-heading: สำหรับหัวข้อ
 * - responsive-card: สำหรับ card components
 * - responsive-button: สำหรับปุ่ม
 * - responsive-table: สำหรับตาราง
 * - responsive-chart: สำหรับกราฟ
 * - mobile-only: แสดงเฉพาะบน mobile
 * - tablet-up: แสดงบน tablet และขึ้นไป
 * - desktop-only: แสดงเฉพาะบน desktop
 */ 