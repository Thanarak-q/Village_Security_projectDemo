"use client"
import { User } from "lucide-react"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import NotificationComponent from "./(main)/notification"

function Navbar() {
  const pathname = usePathname()
  const [userData, setUserData] = useState<any>(null)

  const currentDate = new Date()
  const thaiDate = new Intl.DateTimeFormat('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(currentDate)

  useEffect(() => {
    fetch("/api/auth/me", {
      credentials: "include",
    })
      .then((res) => {
        if (res.status === 401) {
          return null
        }
        return res.json()
      })
      .then((json) => {
        if (json) setUserData(json)
      })
  }, [])

  // Dynamic content based on current route
  const getPageContent = () => {
    switch (pathname) {
      case '/dashboard':
        return {
          title: userData ? `สวัสดี, คุณผู้จัดการ ${userData.username} 👋` : 'สวัสดี, คุณผู้จัดการ 👋',
          subtitle: new Date().toLocaleDateString("th-TH", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          titleClass: "text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight text-gray-900",
          subtitleClass: "text-xs sm:text-sm md:text-base text-gray-500"
        }
      case '/dashboard/user_manage':
        return {
          title: 'จัดการผู้ใช้งาน',
          subtitle: 'จัดการข้อมูลผู้ใช้งานทั้งหมดในระบบ',
          titleClass: "text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight text-gray-900",
          subtitleClass: "text-xs sm:text-sm md:text-base text-gray-500"
        }
      case '/dashboard/house_manage':
        return {
          title: 'การจัดการบ้าน',
          subtitle: 'จัดการข้อมูลบ้านและสถานะการอยู่อาศัย',
          titleClass: "text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-gray-900",
          subtitleClass: "text-sm sm:text-base text-gray-500"
        }
      case '/dashboard/setting_manage':
        return {
          title: 'การตั้งค่า',
          subtitle: 'จัดการการตั้งค่าระบบ',
          titleClass: "text-2xl font-bold text-gray-900",
          subtitleClass: "text-sm text-gray-600"
        }
      default:
        return {
          title: 'การจัดการบ้าน',
          subtitle: thaiDate,
          titleClass: "text-2xl font-bold text-gray-900",
          subtitleClass: "text-sm text-gray-600"
        }
    }
  }

  const pageContent = getPageContent()

  return (
    <nav className="w-full">
      {/* ส่วนเนื้อหาสีขาว */}
      <div className="bg-white p-4 flex justify-between items-center border-b border-gray-200">
        {/* ด้านซ้าย - ข้อความ */}
        <div className="flex flex-col">
          <h1 className={pageContent.titleClass}>
            {pageContent.title}
          </h1>
          <p className={pageContent.subtitleClass}>
            {pageContent.subtitle}
          </p>
        </div>

        {/* ด้านขวา - ไอคอนและโปรไฟล์ */}
        <div className="flex items-center space-x-4">
          {/* Notification Component */}
          <NotificationComponent />

          {/* รูปโปรไฟล์และชื่อ */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
              <User className="h-6 w-6 text-gray-600" />
            </div>
            <span className="text-gray-900 font-medium">Robert</span>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar