"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const profileSchema = z.object({
  email: z.string().min(1, "กรุณากรอกอีเมล").email("อีเมลไม่ถูกต้อง"),
  username: z.string().min(1, "กรุณากรอกชื่อผู้ใช้งาน"),
  phone: z.string().min(1, "กรุณากรอกหมายเลขโทรศัพท์"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "กรุณากรอกรหัสผ่านปัจจุบัน"),
  newPassword: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
  confirmPassword: z.string().min(1, "กรุณายืนยันรหัสผ่าน"),
}).refine((data) => {
  return data.newPassword === data.confirmPassword;
}, {
  message: "รหัสผ่านไม่ตรงกันกรุณากรอกใหม่อีกครั้ง",
  path: ["confirmPassword"],
});

function SettingForm() {
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  // Dummy fetch function
  const fetchAdminData = async () => {
    // This would normally fetch from your API
    console.log("Fetching admin data...");
    return {
      email: "john_doe@gmail.com",
      username: "John Doe",
      phone: "1111111111",
    };
  };
  
  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      email: "john_doe@gmail.com",
      username: "John Doe",
      phone: "1111111111",
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Dummy submit function
  async function onSubmit(values: z.infer<typeof profileSchema>) {
    setIsProfileLoading(true);
    try {
      // This would normally submit to your API
      console.log("Submitting profile values:", values);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      console.log("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsProfileLoading(false);
    }
  }

  // Dummy password submit function
  async function onSubmitPassword(values: z.infer<typeof passwordSchema>) {
    setIsPasswordLoading(true);
    try {
      // This would normally submit password change to your API
      console.log("Submitting password change:", values);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      console.log("Password changed successfully!");
    } catch (error) {
      console.error("Error changing password:", error);
    } finally {
      setIsPasswordLoading(false);
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onSubmit)} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                      control={profileForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Username</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="ชื่อผู้ใช้งาน" 
                              {...field}
                              className="h-14 text-base"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="อีเมล" 
                              {...field}
                              className="h-14 text-base"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={profileForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">Phone Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="หมายเลขโทรศัพท์" 
                            {...field}
                            className="h-14 text-base"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-6">
                    <Button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white h-14 text-base font-medium"
                      disabled={isProfileLoading}
                    >
                      {isProfileLoading ? "Updating..." : "Update Profile"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-8">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">Current Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="รหัสผ่านปัจจุบัน" 
                            {...field}
                            className="h-14 text-base"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">New Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="รหัสผ่านใหม่" 
                              {...field}
                              className="h-14 text-base"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Confirm Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="ยืนยันรหัสผ่านใหม่" 
                              {...field}
                              className="h-14 text-base"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="pt-6">
                    <Button 
                      type="submit" 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white h-14 text-base font-medium"
                      disabled={isPasswordLoading}
                    >
                      {isPasswordLoading ? "Changing..." : "Change Password"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default SettingForm;
