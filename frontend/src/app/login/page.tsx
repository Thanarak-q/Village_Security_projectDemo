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
import { ScrambleTextPlugin } from "gsap/all";

gsap.registerPlugin(ScrambleTextPlugin);

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

const Gsaploginbutton = React.forwardRef<HTMLButtonElement, GsaploginbuttonProps>(({
  className,
  children,
  ...props
}, ref) => {
  const internalRef = useRef<HTMLButtonElement>(null);
  const buttonRef = ref || internalRef;

  const handleMouseEnter = () => {
    if (buttonRef && 'current' in buttonRef && buttonRef.current) {
      gsap.to(buttonRef.current, {
        scale: 1.07,
        duration: 0.25,
        ease: "power2.out",
      });
    }
  };
  const handleMouseLeave = () => {
    if (buttonRef && 'current' in buttonRef && buttonRef.current) {
      gsap.to(buttonRef.current, {
        scale: 1,
        duration: 0.25,
        ease: "power2.out",
      });
    }
  };

  return (
    <Button
      ref={buttonRef}
      type="submit"
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </Button>
  );
});

Gsaploginbutton.displayName = "Gsaploginbutton";

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
  const successRef = useRef<HTMLDivElement>(null);
  const usernameFieldRef = useRef<HTMLDivElement>(null);
  const passwordFieldRef = useRef<HTMLDivElement>(null);
  const loginButtonRef = useRef<HTMLButtonElement>(null);
  const loginTitleRef = useRef<HTMLHeadingElement>(null);
  const villageTextRef = useRef<HTMLParagraphElement>(null);
  const scrambleSuccessRef = useRef<HTMLHeadingElement>(null);

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

      // Trigger success animation
      animateLoginSuccess();

    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
      setLoading(false);
    }
  }

  const animateLoginSuccess = () => {
    const tl = gsap.timeline();

    // Get the center position between username and password fields
    const usernameRect = usernameFieldRef.current?.getBoundingClientRect();
    const passwordRect = passwordFieldRef.current?.getBoundingClientRect();
    const squareRect = squareRef.current?.getBoundingClientRect();

    if (usernameRect && passwordRect && squareRect) {
      const centerY = (usernameRect.top + passwordRect.top) / 2 - usernameRect.top;
      // Calculate exact position relative to the square container
      const squareCenterY = (usernameRect.top + passwordRect.top) / 2 - squareRect.top;

      // Fade out Login title and Village Management System text while fields are moving
      tl.to([loginTitleRef.current, villageTextRef.current], {
        opacity: 0,
        duration: 0.2,
        ease: "power2.inOut"
      })
        // Hide button
        .to(loginButtonRef.current, {
          opacity: 0,
          duration: 0.2,
          ease: "power2.inOut"
        }, "<")
        // Move both fields to overlap at center position (faster)
        .to(usernameFieldRef.current, {
          y: centerY,
          duration: 0.3,
          ease: "power2.inOut"
        }, "-=0.1")
        .to(passwordFieldRef.current, {
          y: centerY - (passwordRect.top - usernameRect.top),
          duration: 0.3,
          ease: "power2.inOut"
        }, "<")
        // Fade out both fields together (faster)
        .to([usernameFieldRef.current, passwordFieldRef.current], {
          opacity: 0,
          duration: 0.2,
          ease: "power2.inOut"
        })
        // Position success message at top middle of square
        .set(successRef.current, {
          display: "block",
          position: "absolute",
          top: "200px",
          left: "50%",
          transform: "translateX(-50%)",
          opacity: 1,
          zIndex: 10
        })
        // Trigger faster scramble text animation
        .call(() => {
          gsap.to(scrambleSuccessRef.current, {
            duration: 0.8,
            scrambleText: {
              text: "Success!",
              chars: "XO#@$%",
              revealDelay: 0.1,
              speed: 0.6,
            },
          });
        })
        // Wait then redirect (shorter wait)
        .call(() => {
          setTimeout(() => {
            setShouldRedirect(true);
          }, 1200);
        });
    }
  };

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
          <h2 ref={loginTitleRef} className="text-[#253050] m-0 mb-[30px] text-[1.8rem] font-black tracking-[1.5px]">Login</h2>
        </div>
        <div ref={squareRef} className="w-full h-screen bg-white rounded-[22px] flex flex-col items-center opacity-0 z-[1]">
          <div ref={loginRef} className="mt-8 w-[85%] max-w-[350px] opacity-0 transition-opacity duration-200">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem ref={usernameFieldRef} className="mb-3">
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
                    <FormItem ref={passwordFieldRef} className="mb-3">
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

                <Gsaploginbutton ref={loginButtonRef} type="submit" disabled={loading} className="w-full bg-[#253050] text-white rounded-xl text-[1.1rem] py-3 shadow-[0px_6px_24px_1px_rgba(50,56,168,0.09)] font-semibold disabled:opacity-50">
                  {loading ? "Logging in..." : "Login"}
                </Gsaploginbutton>
              </form>
            </Form>
            <p ref={villageTextRef} className="mt-10 text-center text-[#aaa] text-[0.97em]">
              Village Management System <br /> v.x.x
            </p>
          </div>

          {/* Success Message with Scramble Text */}
          <div
            ref={successRef}
            className="hidden text-center"
          >
            <h2
              ref={scrambleSuccessRef}
              className="text-2xl font-bold text-[#253050] tracking-[1.5px]"
            >
              Loading...
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
