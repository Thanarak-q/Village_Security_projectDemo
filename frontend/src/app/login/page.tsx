"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // ใช้ next/navigation สำหรับ App Router
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ScrambleTextExample, ExpandButton } from "@/components/animation";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const FormSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  password: z.string().min(2, {
    message: "Password must be at least 2 characters.",
  }),
});

export default function InputFormPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
    mode: "onBlur",
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData?.message || "Login failed");
      }

      console.log("Login successful");
      toast.success("Login successful!");
      setShouldRedirect(true);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (shouldRedirect) {
      router.push("/dashboard");
    }
  }, [shouldRedirect, router]);

  const firstErrorField = Object.keys(form.formState.errors)[0] as
    | "username"
    | "password"
    | undefined;

  const firstErrorMessage = firstErrorField
    ? form.formState.errors[firstErrorField]?.message
    : null;

  return (
    <div>
      <Form {...form}>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
          <ScrambleTextExample />

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-2/3 max-w-md mx-auto space-y-8 p-6 bg-white rounded-lg shadow-md mt-8"
            noValidate
          >
            {firstErrorMessage && (
              <FormMessage
                className="bg-red-100 text-red-800 border border-red-300 rounded-md p-3 font-semibold text-center"
                role="alert"
              >
                {firstErrorMessage}
              </FormMessage>
            )}

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="username">Username</FormLabel>
                  <FormControl>
                    <Input
                      id="username"
                      placeholder="Username"
                      autoComplete="username"
                      {...field}
                      className={
                        form.formState.errors.username
                          ? "border-red-500 focus:ring-red-500"
                          : ""
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="password">Password</FormLabel>
                  <FormControl>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••"
                      autoComplete="current-password"
                      {...field}
                      className={
                        form.formState.errors.password
                          ? "border-red-500 focus:ring-red-500"
                          : ""
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-center">
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Logging in..." : "Login"}
              </Button>
            </div>
          </form>
        </div>
      </Form>
    </div>
  );
}
