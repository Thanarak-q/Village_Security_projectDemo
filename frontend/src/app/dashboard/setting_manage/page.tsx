import SettingForm from "./SettingForm";

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    firstName: mockUserData.firstName,
    lastName: mockUserData.lastName,
    email: mockUserData.email,
    phone: mockUserData.phone,
    language: mockUserData.language
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Validate password change
      if (passwordData.newPassword || passwordData.confirmPassword || passwordData.currentPassword) {
        if (!passwordData.currentPassword) {
          alert("กรุณากรอกรหัสผ่านปัจจุบัน")
          return
        }
        if (!passwordData.newPassword) {
          alert("กรุณากรอกรหัสผ่านใหม่")
          return
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
          alert("รหัสผ่านใหม่ไม่ตรงกัน")
          return
        }
        if (passwordData.newPassword.length < 6) {
          alert("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร")
          return
        }
      }

      alert("บันทึกการเปลี่ยนแปลงเรียบร้อย")

      // Reset password fields
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      })
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl ">
        <SettingForm />
      </div>
    </section>
  );
}
