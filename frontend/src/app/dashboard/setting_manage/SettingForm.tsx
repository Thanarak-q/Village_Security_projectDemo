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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, AlertCircle } from "lucide-react";

const profileSchema = z.object({
  email: z.string().min(1, "กรุณากรอกอีเมล").email({ message: "อีเมลไม่ถูกต้อง" }),
  username: z.string().optional(), // Username is read-only, no validation needed
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
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  // Fetch admin profile data
  const fetchAdminData = async () => {
    try {
      const response = await fetch('/api/admin/profile', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        return result.data;
      } else {
        console.error("Error fetching admin data:", result.error);
        return null;
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
      return null;
    }
  };

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      email: "",
      username: "",
      phone: "",
    },
  });

  // Load admin data on component mount
  useEffect(() => {
    const loadAdminData = async () => {
      setIsDataLoading(true);
      const adminData = await fetchAdminData();

      if (adminData) {
        profileForm.reset({
          email: adminData.email || "",
          username: adminData.username || "",
          phone: adminData.phone || "",
        });
      }

      setIsDataLoading(false);
    };

    loadAdminData();
  }, [profileForm]);

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Submit profile update
  async function onSubmit(values: z.infer<typeof profileSchema>) {
    setIsProfileLoading(true);
    setProfileMessage("");

    try {
      // Exclude username from the update payload since it should not be changed
      const { username, ...updateData } = values;
      void username;

      const response = await fetch('/api/admin/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (result.success) {
        setProfileMessage("Profile updated successfully!");
      } else {
        setProfileMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      setProfileMessage("An error occurred while updating profile");
      console.error("Error updating profile:", error);
    } finally {
      setIsProfileLoading(false);
    }
  }

  // Submit password change
  async function onSubmitPassword(values: z.infer<typeof passwordSchema>) {
    setIsPasswordLoading(true);
    setPasswordMessage("");

    try {
      const response = await fetch('/api/admin/password', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setPasswordMessage("Password changed successfully!");
        // Clear password form
        passwordForm.reset();
      } else {
        setPasswordMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      setPasswordMessage("An error occurred while changing password");
      console.error("Error changing password:", error);
    } finally {
      setIsPasswordLoading(false);
    }
  }

  if (isDataLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-14 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-14 w-full" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-14 w-full" />
              </div>
              <Skeleton className="h-14 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-40" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-14 w-full" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-14 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-14 w-full" />
                </div>
              </div>
              <Skeleton className="h-14 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            {profileMessage && (
              <Alert className={`mb-4 ${profileMessage.includes('Error')
                  ? 'border-destructive text-destructive'
                  : 'border-green-500 text-green-700 dark:text-green-400'
                }`}>
                {profileMessage.includes('Error') ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  {profileMessage}
                </AlertDescription>
              </Alert>
            )}
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
                            className="h-14 text-base bg-muted cursor-not-allowed"
                            readOnly
                            disabled
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
                    className="w-full h-14 text-base font-medium"
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
            {passwordMessage && (
              <Alert className={`mb-4 ${passwordMessage.includes('Error')
                  ? 'border-destructive text-destructive'
                  : 'border-green-500 text-green-700 dark:text-green-400'
                }`}>
                {passwordMessage.includes('Error') ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  {passwordMessage}
                </AlertDescription>
              </Alert>
            )}
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
                    className="w-full h-14 text-base font-medium"
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
  );
}

export default SettingForm;
