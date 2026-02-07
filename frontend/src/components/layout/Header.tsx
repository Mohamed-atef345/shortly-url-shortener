"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";
import { motion } from "framer-motion";
import { Link as LinkIcon, Menu } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

export function Header() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: "Features", href: "/#features" },
    { name: "About", href: "/#about" },
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LinkIcon className="h-5 w-5" />
          </div>
          <span className="font-bold text-xl tracking-tight">Shortly</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-6 items-center">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <Button variant="ghost" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button onClick={logout} variant="outline">
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                asChild
              >
                <Link href="/register">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Nav */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-4 mt-8">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="text-lg font-medium hover:text-primary transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="flex flex-col gap-2 mt-4">
                  {user ? (
                    <>
                      <Button asChild onClick={() => setIsOpen(false)}>
                        <Link href="/dashboard">Dashboard</Link>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          logout();
                          setIsOpen(false);
                        }}
                      >
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        asChild
                        onClick={() => setIsOpen(false)}
                      >
                        <Link href="/login">Login</Link>
                      </Button>
                      <Button
                        className="bg-primary text-primary-foreground"
                        asChild
                        onClick={() => setIsOpen(false)}
                      >
                        <Link href="/register">Get Started</Link>
                      </Button>
                    </>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
}
