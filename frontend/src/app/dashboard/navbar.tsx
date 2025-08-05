"use client"
import { User } from "lucide-react"
import { usePathname } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { gsap } from "gsap"
import NotificationComponent from "./(main)/notification"

function Navbar() {
  const pathname = usePathname()
  const [userData, setUserData] = useState<any>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const [currentTextIndex, setCurrentTextIndex] = useState(0)

  // Array of spinning texts
  const spinningTexts = [
    "currentpage",
    "goodmorning",
    "สวัสดี",
    "คุณผู้จัดการ",
    "admin_phachange",
    "สวัสดี"
  ]

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

  // GSAP smooth spin-up text animation with power2.inOut
  useEffect(() => {
    if (!textRef.current) return

    // Set initial state
    gsap.set(textRef.current, {
      y: 20,
      opacity: 0,
      rotationX: -90,
      transformOrigin: "center bottom"
    })

    const animateText = () => {
      const tl = gsap.timeline({
        repeat: -1,
        repeatDelay: 0.3
      })

      spinningTexts.forEach((_, index: number) => {
        tl.to(textRef.current, {
          duration: 0.4,
          y: -10,
          opacity: 0,
          rotationX: 90,
          ease: "power2.inOut",
          onComplete: () => {
            setCurrentTextIndex(index)
          }
        })
          .to(textRef.current, {
            duration: 0.5,
            y: 0,
            opacity: 1,
            rotationX: 0,
            ease: "power2.inOut"
          })
          .to({}, { duration: 2 }) // Hold the text for 2 seconds
      })

      return tl
    }

    // Initial entrance animation
    gsap.to(textRef.current, {
      duration: 0.8,
      y: 0,
      opacity: 1,
      rotationX: 0,
      ease: "power2.inOut",
      delay: 0.5,
      onComplete: () => {
        animateText()
      }
    })

    return () => {
      gsap.killTweensOf(textRef.current)
    }
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
          <div className="flex items-center gap-3">
            <h1 className={pageContent.titleClass}>
              {pageContent.title}
            </h1>
            {/* GSAP Smooth Spin-Up Text */}
            <div className="relative overflow-hidden h-8 flex items-center">
              <span
                ref={textRef}
                className="inline-block text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent transform-gpu"
                style={{
                  transformStyle: 'preserve-3d',
                  perspective: '1000px'
                }}
              >
                {spinningTexts[currentTextIndex]}
              </span>
            </div>
          </div>
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