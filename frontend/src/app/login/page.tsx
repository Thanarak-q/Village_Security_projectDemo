"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { ModeToggle } from "@/components/mode-toggle";
import { ButtonProps } from "react-day-picker";
import { ScrambleTextPlugin } from "gsap/all";

gsap.registerPlugin(ScrambleTextPlugin);

const FormSchema = z.object({
  username: z
    .string()
    .min(3, {
      message: "Username must be at least 3 characters.",
    })
    .max(50, {
      message: "Username must not exceed 50 characters.",
    })
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: "Username can only contain letters, numbers, and underscores.",
    }),
  password: z
    .string()
    .min(6, {
      message: "Password must be at least 6 characters.",
    })
    .max(100, {
      message: "Password must not exceed 100 characters.",
    }),
});

type GsaploginbuttonProps = ButtonProps & {
  children: React.ReactNode;
};

const Gsaploginbutton = React.forwardRef<
  HTMLButtonElement,
  GsaploginbuttonProps
>(({ className, children, ...props }, ref) => {
  const internalRef = useRef<HTMLButtonElement>(null);
  const buttonRef = ref || internalRef;

  const handleMouseEnter = () => {
    if (buttonRef && "current" in buttonRef && buttonRef.current) {
      gsap.to(buttonRef.current, {
        scale: 1.07,
        duration: 0.25,
        ease: "power2.out",
      });
    }
  };
  const handleMouseLeave = () => {
    if (buttonRef && "current" in buttonRef && buttonRef.current) {
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
  const errorMessageRef = useRef<HTMLParagraphElement>(null);

  const animateLoginFailure = () => {
    const tl = gsap.timeline();

    // Determine screen size for responsive adjustments
    const isSmallPhone = window.innerWidth < 480;
    const isMobile = window.innerWidth < 640;

    // Keep error message consistent across all devices
    const errorText = "Invalid Username or Password";

    // Determine login fail text size based on screen size
    const loginFailText = "Login Fail";
    // if (isSmallPhone) {
    //   loginFailText = "Fail";
    // }

    // Create a pop-up scale animation with color change
    tl.to(loginTitleRef.current, {
      scale: isSmallPhone ? 1.1 : isMobile ? 1.15 : 1.2,
      color: "hsl(var(--destructive))",
      duration: 0.3,
      ease: "back.out(1.7)",
    })
      // Scramble text to "Login fail" or "Fail" for small phones
      .to(
        loginTitleRef.current,
        {
          duration: 0.8,
          scrambleText: {
            text: loginFailText,
            chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
            revealDelay: 0.1,
            speed: 0.8,
          },
        },
        "-=0.2"
      )
      // Show error message with animation
      .set(
        errorMessageRef.current,
        {
          display: "block",
          opacity: 0,
          y: isSmallPhone ? -6 : isMobile ? -8 : -10,
        },
        "-=0.4"
      )
      .to(errorMessageRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power2.out",
      })
      // Animate error message text with scramble effect
      .to(
        errorMessageRef.current,
        {
          duration: 0.5,
          scrambleText: {
            text: errorText,
            chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
            revealDelay: 0.05,
            speed: 0.1,
          },
        },
        "-=0.3"
      )
      // Scale back to normal size but keep red color
      .to(
        loginTitleRef.current,
        {
          scale: 1,
          duration: 0.4,
          ease: "power2.out",
        },
        "-=0.8"
      )
      // After 4 seconds, hide error message and revert back to original "Login" text and color
      .to(
        errorMessageRef.current,
        {
          opacity: 0,
          y: isSmallPhone ? -6 : isMobile ? -8 : -10,
          duration: 0.4,
          ease: "power2.inOut",
        },
        "+=3.5"
      )
      .set(errorMessageRef.current, {
        display: "none",
      })
      .to(
        loginTitleRef.current,
        {
          duration: 0.8,
          scrambleText: {
            text: "Login",
            chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
            revealDelay: 0.1,
            speed: 0.8,
          },
          color: "hsl(var(--foreground))",
        },
        "-=0.2"
      );
  };

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setLoading(true);
    
    // Clear sessionStorage before login to prevent cross-user data
    sessionStorage.clear();
    
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errData;
        try {
          errData = await response.json();
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
          throw new Error(`Login failed (${response.status})`);
        }

        console.error("Login error:", {
          status: response.status,
          statusText: response.statusText,
          data: errData,
        });

        // Handle different error formats
        let errorMessage = "Login failed";
        if (errData?.error) {
          errorMessage = errData.error;
        } else if (errData?.message) {
          errorMessage = errData.message;
        } else if (errData?.details && Array.isArray(errData.details)) {
          errorMessage = errData.details.join(", ");
        } else if (response.status === 429) {
          errorMessage = "Too many login attempts. Please try again later.";
        } else if (response.status === 401) {
          errorMessage = "Invalid username or password";
        } else if (response.status === 403) {
          errorMessage = "Account not verified";
        }

        throw new Error(errorMessage);
      }

      console.log("Login successful");

      // Get redirect URL based on user role
      try {
        const redirectResponse = await fetch("/api/redirect/dashboard", {
          credentials: "include",
        });
        
        if (redirectResponse.ok) {
          const redirectData = await redirectResponse.json();
          if (redirectData.success) {
            // Trigger success animation
            animateLoginSuccess(redirectData.redirect_url);
            return; // Exit early with proper redirect
          }
        }
      } catch (redirectError) {
        console.error("Error getting redirect URL:", redirectError);
      }

      // Fallback to default dashboard
      animateLoginSuccess("/dashboard");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Something went wrong";
      // Trigger login failure animation
      animateLoginFailure();
      setLoading(false);
    }
  }

  const animateLoginSuccess = (redirectUrl: string = "/dashboard") => {
    const tl = gsap.timeline();

    // Get the center position between username and password fields
    const usernameRect = usernameFieldRef.current?.getBoundingClientRect();
    const passwordRect = passwordFieldRef.current?.getBoundingClientRect();
    const squareRect = squareRef.current?.getBoundingClientRect();

    if (usernameRect && passwordRect && squareRect) {
      const centerY =
        (usernameRect.top + passwordRect.top) / 2 - usernameRect.top;

      // Fade out Login title and Village Management System text while fields are moving
      tl.to([loginTitleRef.current, villageTextRef.current], {
        opacity: 0,
        duration: 0.2,
        ease: "power2.inOut",
      })
        // Hide button
        .to(
          loginButtonRef.current,
          {
            opacity: 0,
            duration: 0.2,
            ease: "power2.inOut",
          },
          "<"
        )
        // Move both fields to overlap at center position (faster)
        .to(
          usernameFieldRef.current,
          {
            y: centerY,
            duration: 0.3,
            ease: "power2.inOut",
          },
          "-=0.1"
        )
        .to(
          passwordFieldRef.current,
          {
            y: centerY - (passwordRect.top - usernameRect.top),
            duration: 0.3,
            ease: "power2.inOut",
          },
          "<"
        )
        // Fade out both fields together (faster) and show success message simultaneously
        .to([usernameFieldRef.current, passwordFieldRef.current], {
          opacity: 0,
          duration: 0.2,
          ease: "power2.inOut",
        })
        .set(
          successRef.current,
          {
            display: "block",
            position: "absolute",
            top: "25%",

            opacity: 1,
            zIndex: 10,
          },
          "<"
        )
        // Trigger faster scramble text animation
        .call(() => {
          gsap.to(scrambleSuccessRef.current, {
            duration: 1,
            scrambleText: {
              text: "Successfully!!!",
              chars: "YOU ARE RIGHT!!!",
              revealDelay: 0.1,
              speed: 1,
            },
          });
        })
        // Wait then redirect (shorter wait)
        .call(() => {
          setTimeout(() => {
            router.push(redirectUrl);
          }, 1200);
        });
    }
  };


  useEffect(() => {
    const isShortScreen = window.innerHeight < 800;
    const initialBottom = isShortScreen ? "-250px" : "-350px";

    try {
      gsap.set(loginGroupRef.current, { bottom: initialBottom });

      const tl = gsap.timeline();
      tl.to(welcomeRef.current, {
        top: "10%",
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
        .to(
          squareRef.current,
          { opacity: 1, duration: 1, ease: "power2.inOut" },
          "<"
        )
        .to(
          loginRef.current,
          { opacity: 1, duration: 0.4, ease: "power2.inOut" },
          "-=0.3"
        );
    } catch (error) {
      console.warn("GSAP animation failed, using fallback:", error);
      if (triRef.current) triRef.current.style.opacity = "1";
      if (squareRef.current) squareRef.current.style.opacity = "1";
      if (loginRef.current) loginRef.current.style.opacity = "1";
      if (welcomeRef.current) {
        welcomeRef.current.style.top = "10%";
        welcomeRef.current.style.transform = "translateY(-50%)";
      }
      if (loginGroupRef.current) {
        loginGroupRef.current.style.bottom = isShortScreen ? "35%" : "45%";
        loginGroupRef.current.style.transform = "translateY(50%)";
      }
    }
  }, []);

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-blue-500 to-blue-600 dark:from-slate-900 dark:to-slate-800 flex flex-col justify-center items-center overflow-hidden">
      {/* Theme Toggle Button */}
      <div className="absolute top-4 right-4 z-20">
        <ModeToggle />
      </div>
      
      <div
        ref={welcomeRef}
        className="absolute text-white text-4xl tracking-[2px] z-10"
      >
        <ScrambleTextExample />
      </div>
      <div
        ref={loginGroupRef}
        className="relative flex flex-col items-stretch w-full z-[5]"
      >
        <div
          ref={triRef}
          className="opacity-0 w-full h-[120px] sm:h-[130px] md:h-[140px] bg-background flex flex-col justify-center items-center z-[2] mt-[50px] rounded-t-[22px] relative triangle-shape"
        >
          <h2
            ref={loginTitleRef}
            className="text-foreground m-0 text-[1.2rem] xs:text-[1.3rem] sm:text-[1.6rem] md:text-[1.8rem] lg:text-[2rem] font-black tracking-[1.5px]"
          >
            Login
          </h2>
          <p
            ref={errorMessageRef}
            className="hidden text-destructive text-[0.7rem] sm:text-[0.75rem] md:text-[0.85rem] lg:text-[0.9rem] font-medium mt-1 sm:mt-2 text-center px-2 sm:px-3 md:px-4 leading-tight max-w-[280px] sm:max-w-[320px] md:max-w-[360px]"
          ></p>
        </div>
        <div
          ref={squareRef}
          className="w-full h-screen bg-background rounded-[22px] flex flex-col items-center opacity-0 z-[1]"
        >
          <div
            ref={loginRef}
            className="mt-8 w-[85%] max-w-[350px] opacity-0 transition-opacity duration-200"
          >
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem ref={usernameFieldRef} className="mb-3">
                      <FormLabel
                        htmlFor="username"
                        className="font-bold text-foreground"
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
                              ? "border-[1.5px] border-destructive"
                              : ""
                          }
                        />
                      </FormControl>
                      <FormMessage className="text-destructive text-[0.9rem]" />
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
                        className="font-bold text-foreground"
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
                              ? "border-[1.5px] border-destructive"
                              : ""
                          }
                        />
                      </FormControl>
                      <FormMessage className="text-destructive text-[0.9rem]" />
                    </FormItem>
                  )}
                />

                <Gsaploginbutton
                  ref={loginButtonRef}
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground rounded-xl text-[1.1rem] py-3 shadow-lg font-semibold disabled:opacity-50"
                >
                  {loading ? "Logging in..." : "Login"}
                </Gsaploginbutton>
              </form>
            </Form>
            <p
              ref={villageTextRef}
              className="mt-10 text-center text-muted-foreground text-[0.97em]"
            >
              Village Management System <br /> v.x.x
            </p>
          </div>

          {/* Success Message with Scramble Text */}
          <div ref={successRef} className="hidden text-center">
            <h2
              ref={scrambleSuccessRef}
              className="text-2xl font-bold text-foreground tracking-[1.5px]"
            ></h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
