import { Bell, User } from "lucide-react"

function Navbar() {
  const currentDate = new Date()
  const thaiDate = new Intl.DateTimeFormat('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(currentDate)

  return (
    <nav className="w-full"> 
      {/* ส่วนเนื้อหาสีขาว */}
      <div className="bg-white p-4 flex justify-between items-center border-b border-gray-200">
        {/* ด้านซ้าย - ข้อความ */}
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-gray-900">การจัดการบ้าน</h1>
          <p className="text-sm text-gray-600">{thaiDate}</p>
        </div>
        
        {/* ด้านขวา - ไอคอนและโปรไฟล์ */}
        <div className="flex items-center space-x-4">
          {/* ไอคอนกระดิ่ง */}
          <div className="relative">
            <Bell className="h-6 w-6 text-gray-600 cursor-pointer hover:text-gray-800" />
            {/* จุดแจ้งเตือน (ถ้ามี) */}
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></div>
          </div>
          
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