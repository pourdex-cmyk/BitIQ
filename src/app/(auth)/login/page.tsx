"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Zap, Mail, Lock, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const appRoute = "/projects";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [magicLink, setMagicLink] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let active = true;

    const syncSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (active && session) {
        router.replace(appRoute);
        router.refresh();
      }
    };

    void syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
      if (event !== "SIGNED_OUT" && session) {
        router.replace(appRoute);
        router.refresh();
      }
      }
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [appRoute, router, supabase]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (magicLink) {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/login`,
          },
        });
        if (error) throw error;
        toast.success("Magic link sent! Check your email.");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.session) {
          router.replace(appRoute);
          router.refresh();
        }
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Authentication failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--surface-base)]">
      {/* Left panel — branding */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 overflow-hidden">
        {/* Animated geometric background */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border border-[var(--teal-600)]"
              style={{
                width: 120 + i * 80,
                height: 120 + i * 80,
                left: "50%",
                top: "50%",
                x: "-50%",
                y: "-50%",
                opacity: 0.15 - i * 0.02,
              }}
              animate={{
                rotate: i % 2 === 0 ? 360 : -360,
                scale: [1, 1.02, 1],
              }}
              transition={{
                rotate: { duration: 20 + i * 5, repeat: Infinity, ease: "linear" },
                scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
              }}
            />
          ))}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(29,158,117,0.08) 0%, transparent 70%)",
            }}
          />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--teal-600)] flex items-center justify-center">
              <Zap className="w-5 h-5 text-[var(--teal-400)]" />
            </div>
            <span
              className="text-2xl font-bold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-dm-serif)" }}
            >
              BidIQ
            </span>
          </div>
        </div>

        <div className="relative z-10">
          <h1
            className="text-5xl font-bold text-[var(--text-primary)] leading-tight mb-6"
            style={{ fontFamily: "var(--font-dm-serif)" }}
          >
            Smarter bids.
            <br />
            <span className="text-[var(--teal-400)]">Better projects.</span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-md leading-relaxed">
            AI-powered contractor bid management for Beantown Companies.
            Score, compare, and select the best bids in minutes — not days.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { value: "94%", label: "AI Accuracy" },
              { value: "$2.1M", label: "Savings vs. Market" },
              { value: "3.2x", label: "Faster Decisions" },
            ].map((stat) => (
              <div key={stat.label} className="card-surface p-4">
                <div
                  className="text-2xl font-bold text-[var(--teal-400)] font-mono"
                  style={{ fontFamily: "var(--font-dm-serif)" }}
                >
                  {stat.value}
                </div>
                <div className="text-xs text-[var(--text-secondary)] mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-[var(--text-secondary)]">
            Augmentation Consulting Group · Confidential
          </p>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-lg bg-[var(--teal-600)] flex items-center justify-center">
              <Zap className="w-4 h-4 text-[var(--teal-400)]" />
            </div>
            <span
              className="text-xl font-bold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-dm-serif)" }}
            >
              BidIQ
            </span>
          </div>

          <div className="card-surface p-8">
            <div className="mb-8">
              <h2
                className="text-2xl font-bold text-[var(--text-primary)] mb-2"
                style={{ fontFamily: "var(--font-dm-serif)" }}
              >
                Welcome back
              </h2>
              <p className="text-[var(--text-secondary)] text-sm">
                Sign in to the Beantown bid portal
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@beantownco.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--navy-800)] border border-[var(--surface-border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--teal-400)] focus:border-[var(--teal-400)] text-sm transition-colors"
                  />
                </div>
              </div>

              {!magicLink && (
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required={!magicLink}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-[var(--navy-800)] border border-[var(--surface-border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--teal-400)] focus:border-[var(--teal-400)] text-sm transition-colors"
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--teal-600)] hover:bg-[var(--teal-500)] text-white border-0 py-2.5 font-semibold"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    {magicLink ? "Sending..." : "Signing in..."}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {magicLink ? "Send Magic Link" : "Sign In"}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => setMagicLink(!magicLink)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-[var(--surface-border)] rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--teal-400)] transition-colors"
              >
                <Sparkles className="w-4 h-4 text-[var(--purple-400)]" />
                {magicLink ? "Use password instead" : "Sign in with magic link"}
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-[var(--surface-border)] space-y-3">
              <p className="text-center text-sm text-[var(--text-secondary)]">
                Don&apos;t have an account?{" "}
                <a
                  href="/signup"
                  className="text-[var(--teal-400)] hover:text-[var(--teal-300)] font-medium transition-colors"
                >
                  Sign up
                </a>
              </p>
              <p className="text-center text-xs text-[var(--text-secondary)]">
                Are you a contractor?{" "}
                <span className="text-[var(--teal-400)]">
                  Use your invitation link from your email.
                </span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
