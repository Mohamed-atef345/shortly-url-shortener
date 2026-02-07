"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Link as LinkIcon, Loader2, User } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/providers/AuthProvider";
import { API_ENDPOINTS } from "@/lib/config";

// Define separate schemas
const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: "Name must be at least 2 characters" })
      .max(50, { message: "Name must be at most 50 characters" }),
    email: z.string().email({ message: "Invalid email address" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .superRefine((password, ctx) => {
        const errors: string[] = [];

        if (!/[a-z]/.test(password)) {
          errors.push("• Password must include a lowercase letter");
        }
        if (!/[A-Z]/.test(password)) {
          errors.push("• Password must include an uppercase letter");
        }
        if (!/[0-9]/.test(password)) {
          errors.push("• Password must include a number");
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
          errors.push(
            "• Password must include a special character (!@#$%^&*...)",
          );
        }

        if (errors.length > 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: errors.join("\n"),
          });
        }
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

type AuthType = "login" | "register";

interface AuthFormProps {
  type: AuthType;
}

// Separate Login Form Component
function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormData) {
    setIsLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.auth.login, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      if (data.success) {
        toast.success("Welcome back!");
        login(data.data.token, data.data.user);
        router.push("/dashboard");
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="name@example.com"
                  {...field}
                  className="h-11 bg-white/5 border-white/10"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...field}
                  className="h-11 bg-white/5 border-white/10"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full h-11 text-base font-medium"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>
    </Form>
  );
}

// Separate Register Form Component
function RegisterForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: RegisterFormData) {
    setIsLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.auth.register, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      if (data.success) {
        toast.success("Account created successfully!");
        login(data.data.token, data.data.user);
        router.push("/dashboard");
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="John Doe"
                    {...field}
                    className="h-11 pl-10 bg-white/5 border-white/10"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="name@example.com"
                  {...field}
                  className="h-11 bg-white/5 border-white/10"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...field}
                  className="h-11 bg-white/5 border-white/10"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...field}
                  className="h-11 bg-white/5 border-white/10"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full h-11 text-base font-medium"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>
    </Form>
  );
}

export function AuthForm({ type }: AuthFormProps) {
  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-primary/25 p-3 mb-6"
        >
          <LinkIcon className="h-10 w-10 text-primary" />
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">
          {type === "login" ? "Welcome back" : "Create an account"}
        </h2>
        <p className="mt-2 text-muted-foreground">
          {type === "login"
            ? "Enter your credentials to access your dashboard"
            : "Get started with your free account today"}
        </p>
      </div>

      {type === "login" ? <LoginForm /> : <RegisterForm />}

      <div className="text-center text-sm">
        <span className="text-muted-foreground">
          {type === "login"
            ? "Don't have an account? "
            : "Already have an account? "}
        </span>
        <Link
          href={type === "login" ? "/register" : "/login"}
          className="font-medium text-primary hover:underline hover:text-primary/80 transition-colors"
        >
          {type === "login" ? "Sign up" : "Sign in"}
        </Link>
      </div>
    </div>
  );
}
