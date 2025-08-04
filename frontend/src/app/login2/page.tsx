"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import gsap from "gsap";
import React, { useRef } from "react";

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
import { ScrambleTextExample } from "@/components/animation";
import { ButtonProps } from "react-day-picker";

const FormSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  password: z.string().min(2, {
    message: "Password must be at least 2 characters.",
  }),
});

type GsaploginbuttonProps = ButtonProps & {
  children: React.ReactNode;
};

const Gsaploginbutton: React.FC<GsaploginbuttonProps> = ({
  className,
  children,
  ...props
}) => {
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleMouseEnter = () => {
    if (btnRef.current) {
      gsap.to(btnRef.current, {
        scale: 1.07,
        duration: 0.25,
        ease: "power2.out",
      });
    }
  };
  const handleMouseLeave = () => {
    if (btnRef.current) {
      gsap.to(btnRef.current, {
        scale: 1,
        duration: 0.25,
        ease: "power2.out",
      });
    }
  };

  return (
    <Button
      ref={btnRef}
      type="submit"
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </Button>
  );
};

const Page: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { username: "", password: "" },
    mode: "onBlur",
  });

  const welcomeRef = useRef<HTMLHeadingElement>(null);

  const loginGroupRef = useRef<HTMLDivElement>(null);
  const triRef = useRef<HTMLDivElement>(null);
  const squareRef = useRef<HTMLDivElement>(null);
  const loginRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const isLowPerformance = window.innerWidth < 768 || navigator.hardwareConcurrency < 4;
    const preferReducedMotion = window.matchMedia("(prefers-reduced-motion:reduce").matches;
    const isShortScreen = window.innerHeight < 800;
    const tl = gsap.timeline();

    // Set initial position based on screen height
    const initialBottom = isShortScreen ? "-250px" : "-350px";
    gsap.set(loginGroupRef.current, { bottom: initialBottom });

    if (!preferReducedMotion) {
      tl.to(welcomeRef.current, {
        top: "10%",
        // y: "-50%",
        duration: 0.8,
        ease: "power2.inOut",
      })
        .to(
          triRef.current,
          {
            opacity: 1,
            duration: 1,
            ease: "power2.inOut",
          },
          "<"
        )
        // fade in square at same time as triangle
        .to(
          squareRef.current,
          { opacity: 1, duration: 1, ease: "power2.inOut" },
          "<"
        )
        // fade in loginBox
        .to(
          loginRef.current,
          { opacity: 1, duration: 0.4, ease: "power2.inOut" },
          "-=0.3"
        );
    } else if (isLowPerformance) {
      gsap.set(welcomeRef.current, { top: "18%", y: "-50%" })
      gsap.set(loginGroupRef.current, { bottom: isShortScreen ? "35%" : "45%", y: "50%" })
      gsap.set(squareRef.current, { opacity: 1 })
      gsap.set(loginRef.current, { opacity: 1 })

    } else {
      gsap.set(welcomeRef.current, { top: "18%", y: "-50%" })
      gsap.set(loginGroupRef.current, { bottom: isShortScreen ? "35%" : "45%", y: "50%" })
      gsap.set(squareRef.current, { opacity: 1 })
      gsap.set(loginRef.current, { opacity: 1 })

    }
  }, []);

  return (
    <div className="w-screen h-screen bg-[#4fa3f2] flex flex-col justify-center items-center overflow-hidden">
      <div ref={welcomeRef} className="absolute text-white text-4xl tracking-[2px] z-10">
        <ScrambleTextExample />
      </div>
      <div ref={loginGroupRef} className="relative flex flex-col items-stretch w-full z-[5]">
        <div ref={triRef} className="opacity-0 w-full h-[120px] bg-white flex justify-center items-end z-[2] mt-[50px] rounded-t-[22px]"
          style={{ clipPath: 'polygon(20px 100%, 50% 0%, calc(100% - 20px) 100%, 100% 100%, 0% 100%)' }}>
          <h2 className="text-[#253050] m-0 mb-[30px] text-[1.8rem] font-black tracking-[1.5px]">Login</h2>
        </div>
        <div ref={squareRef} className="w-full h-screen bg-white rounded-[22px] flex flex-col items-center opacity-0 z-[1]">
          <div ref={loginRef} className="mt-8 w-[85%] max-w-[350px] opacity-0 transition-opacity duration-200">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem className="mb-3">
                      <FormLabel
                        htmlFor="username"
                        className="font-bold text-[#253050]"
                      >
                        Username
                      </FormLabel>
                      <FormControl>
                        <Input
                          id="username"
                          placeholder="Username"
                          {...field}
                          className={
                            form.formState.errors.username
                              ? "border-[1.5px] border-[#ef4b6c]"
                              : ""
                          }
                        />
                      </FormControl>
                      <FormMessage className="text-[#ef4b6c] text-[0.9rem]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="mb-3">
                      <FormLabel
                        htmlFor="password"
                        className="font-bold text-[#253050]"
                      >
                        Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••"
                          {...field}
                          className={
                            form.formState.errors.password
                              ? "border-[1.5px] border-[#ef4b6c]"
                              : ""
                          }
                        />
                      </FormControl>
                      <FormMessage className="text-[#ef4b6c] text-[0.9rem]" />
                    </FormItem>
                  )}
                />

                <Gsaploginbutton type="submit" disabled={loading} className="w-full bg-[#253050] text-white rounded-xl text-[1.1rem] py-3 shadow-[0px_6px_24px_1px_rgba(50,56,168,0.09)] font-semibold disabled:opacity-50">
                  {loading ? "Logging in..." : "Login"}
                </Gsaploginbutton>
              </form>
            </Form>
            <p className="mt-10 text-center text-[#aaa] text-[0.97em]">
              Village Management System <br /> v.x.x
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;