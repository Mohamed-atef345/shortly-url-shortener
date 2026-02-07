"use client";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Zap,
  Link as LinkIcon,
  Shield,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { slideUp, staggerContainer } from "@/styles/animations";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export default function Home() {
  const mounted = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary selection:text-primary-foreground overflow-hidden">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 md:pt-32 md:pb-48 overflow-hidden">
          {/* Abstract Background Shapes */}
          <div className="absolute top-20 right-20 -z-10 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-20 left-20 -z-10 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px]" />

          <div className="container px-4 md:px-6 relative z-10">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto"
            >
              <motion.div
                variants={slideUp}
                className="inline-flex items-center rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                100% Free Forever
              </motion.div>

              {/* TYPOGRAPHY FIX: Gray-900 text, Semi-bold instead of Black */}
              <motion.h1
                variants={slideUp}
                className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight uppercase leading-[0.95] text-foreground"
              >
                Shorten Links <br />
                {/* Green as underline accent, not text */}
                <span className="relative inline-block">
                  Digitize Ideas
                  <span className="absolute bottom-0 left-0 w-full h-3 bg-primary -z-10 translate-y-1" />
                </span>
              </motion.h1>

              <motion.p
                variants={slideUp}
                className="text-xl md:text-2xl text-muted-foreground max-w-[700px]"
              >
                The modern URL shortener for brands that value aesthetics and
                analytics. Powerful, secure, and blazing fast.
              </motion.p>

              <motion.div
                variants={slideUp}
                className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-8"
              >
                <Link href="/register" passHref>
                  <Button
                    size="lg"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg h-14 px-8 rounded-full font-bold w-full sm:w-auto shadow-lg shadow-primary/20"
                  >
                    Start for Free <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/#features" passHref>
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-lg h-14 px-8 rounded-full w-full sm:w-auto border-border"
                  >
                    View Demo
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>

          {/* Marquee Effect */}
          <div className="mt-24 w-full overflow-hidden border-y border-border py-4 bg-muted/50">
            <motion.div
              animate={{ x: [0, -1000] }}
              transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
              className="flex whitespace-nowrap gap-12 items-center"
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-12">
                  {/* Green for highlight words, gray for others */}
                  <span className="text-2xl font-semibold uppercase tracking-widest bg-primary text-primary-foreground px-3 py-1 rounded">
                    Shorten
                  </span>
                  <span className="text-2xl font-medium uppercase tracking-widest text-muted-foreground">
                    •
                  </span>
                  <span className="text-2xl font-semibold uppercase tracking-widest text-foreground">
                    Share
                  </span>
                  <span className="text-2xl font-medium uppercase tracking-widest text-muted-foreground">
                    •
                  </span>
                  <span className="text-2xl font-semibold uppercase tracking-widest bg-primary text-primary-foreground px-3 py-1 rounded">
                    Analyze
                  </span>
                  <span className="text-2xl font-medium uppercase tracking-widest text-muted-foreground">
                    •
                  </span>
                  <span className="text-2xl font-semibold uppercase tracking-widest text-foreground">
                    Scale
                  </span>
                  <span className="text-2xl font-medium uppercase tracking-widest text-muted-foreground">
                    •
                  </span>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Features Grid - with clear section separation */}
        <section
          id="features"
          className="py-24 bg-muted border-y border-border"
        >
          <div className="container px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-foreground">
                Why Choose Shortly?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Everything you need to manage and track your links, completely
                free.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: BarChart3,
                  title: "Deep Analytics",
                  desc: "Track every click with detailed insights on country, device, and browser.",
                },
                {
                  icon: Zap,
                  title: "Blazing Fast",
                  desc: "Built on Bun and edge-ready infrastructure for instant redirects.",
                },
                {
                  icon: Shield,
                  title: "Enterprise Security",
                  desc: "Bank-grade encryption, JWT auth, and role-based access control.",
                },
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-300"
                >
                  <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3 text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* About / CTA Section */}
        <section id="about" className="py-24 bg-background">
          <div className="container px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 text-foreground">
                Free. Forever.{" "}
                {/* Green underline accent instead of green text */}
                <span className="relative inline-block">
                  No Catch.
                  <span className="absolute bottom-0 left-0 w-full h-2 bg-primary -z-10 translate-y-0" />
                </span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Shortly is completely free to use with no hidden fees, no
                premium tiers, and no limits on the number of links you can
                create. Built as an open-source project for the community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 rounded-full font-bold shadow-lg shadow-primary/20"
                  >
                    Get Started Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-muted py-12">
        <div className="container px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <LinkIcon className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl text-foreground">Shortly</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 Shortly. Open source and free forever.
          </p>
          <div className="flex gap-6">
            <Link
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
