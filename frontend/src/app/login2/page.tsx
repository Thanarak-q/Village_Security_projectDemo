"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import gsap from "gsap";
import React, { useRef, useEffect } from "react";

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
import styles from "./loginpage.module.css";
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

  function onSubmit(data: z.infer<typeof FormSchema>) {
    toast("You submitted the following values", {
      description: (
        <pre className="mt-2 w-[320px] rounded-md bg-neutral-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    });
  }

  useEffect(() => {
    const tl = gsap.timeline();

    tl.to(welcomeRef.current, {
      top: "18%",
      y: "-50%",
      duration: 0.8,
      ease: "power2.inOut",
    })
      // triangle+square scroll up
      .to(
        loginGroupRef.current,
        {
          bottom: "45%",
          y: "50%",
          duration: 1,
          ease: "power2.inOut",
        },
        "-=0.4"
      )
      // fade in square
      .to(
        squareRef.current,
        { opacity: 1, duration: 0.4, ease: "power2.inOut" },
        "-=0.7"
      )
      // fade in loginBox
      .to(
        loginRef.current,
        { opacity: 1, duration: 0.4, ease: "power2.inOut" },
        "-=0.3"
      );
  }, []);

  return (
    <div className={styles.container}>
      <h2 ref={welcomeRef} className={styles.welcome}>
        <ScrambleTextExample />
      </h2>
      <div ref={loginGroupRef} className={styles.loginGroupWrapper}>
        <div ref={triRef} className={styles.triangle}>
          <h2>Login</h2>
        </div>
        <div ref={squareRef} className={styles.bgSquare}>
          <div ref={loginRef} className={styles.loginBox}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem className={styles.inputGroup}>
                      <FormLabel
                        htmlFor="username"
                        className={styles.labelstrong}
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
                              ? `${styles.inputError}`
                              : ""
                          }
                        />
                      </FormControl>
                      <FormMessage className={styles.inputMessage} />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className={styles.inputGroup}>
                      <FormLabel
                        htmlFor="password"
                        className={styles.labelstrong}
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
                              ? `${styles.inputError}`
                              : ""
                          }
                        />
                      </FormControl>
                      <FormMessage className={styles.inputMessage} />
                    </FormItem>
                  )}
                />

                <Gsaploginbutton type="submit" className={styles.loginButton}>
                  Login
                </Gsaploginbutton>
              </form>
            </Form>
            <p className={styles.footerText}>
              Village Management System <br /> v.x.x
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;