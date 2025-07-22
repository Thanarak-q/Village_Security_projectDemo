"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import ScrambleTextExample from "@/components/animetion/login/hello";

//test botton
import React, { useRef } from "react";
import gsap from "gsap";
// 

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

const FormSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  password: z.string().min(2, {
    message: "Password must be at least 2 characters.",
  }),
});

export default function InputFormPage() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
    mode: "onBlur", // validate on blur for better UX
  });

  function onSubmit(data: z.infer<typeof FormSchema>) {
    toast("You submitted the following values", {
      description: (
        <pre className="mt-2 w-[320px] rounded-md bg-neutral-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    });
  }

  // Get first error and the related field name
  const firstErrorField = Object.keys(form.formState.errors)[0] as
    | "username"
    | "password"
    | undefined;

  const firstErrorMessage = firstErrorField
    ? form.formState.errors[firstErrorField]?.message
    : null;
  
//test botton
const buttonRef = useRef<HTMLButtonElement>(null);

const handleClick = () => {
  if (buttonRef.current) {
    gsap.to(buttonRef.current, {
        scale: 25, 
        borderRadius: 0,
        duration: 1.2,
        ease: "power3.inOut",
    });
  }
};
//

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

            {/* Global error message */}
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
              <button
                type="button" 
                ref={buttonRef}
                onClick={handleClick}
                className="bg-black text-white px-6 py-3 rounded-lg text-lg shadow-lg"
              >
                Login
              </button>
            </div>
          </form>
        </div>
      </Form>
    </div>
  );
}

