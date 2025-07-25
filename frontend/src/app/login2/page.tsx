"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ScrambleTextExample } from "@/components/animation";

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

import styles from "./loginpage.module.css";

const FormSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  password: z.string().min(2, {
    message: "Password must be at least 2 characters.",
  }),
});

const Page = () => {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: "Username",
      password: "",
    },
    mode: "onBlur",
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

  const firstErrorField = Object.keys(form.formState.errors)[0] as
    | "username"
    | "password"
    | undefined;
  const firstErrorMessage = firstErrorField
    ? form.formState.errors[firstErrorField]?.message
    : null;

  return (
    <div className={styles.container}>
      <h2 className={styles.welcome}>
        <ScrambleTextExample />
      </h2>
      <div className={styles.triangle}>
        <h2>Login</h2>
      </div>
      <div className={styles.loginBox}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

            <Button type="submit" className={styles.loginButton}>
              Log In
            </Button>
          </form>
        </Form>
        <p className={styles.footerText}>
          Village Management System <br /> v.x.x
        </p>
      </div>
    </div>
  );
};

export default Page;
