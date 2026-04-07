"use client";

import { createBrowserClient } from "@supabase/auth-helpers-nextjs";

let _client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (typeof window === "undefined") {
    // During SSR/build, return a proxy that won't be called
    return {
      auth: {
        signInWithPassword: async () => ({ data: null, error: null }),
        signInWithOtp: async () => ({ data: null, error: null }),
        signUp: async () => ({ data: null, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        signOut: async () => ({ error: null }),
      },
      storage: {
        from: () => ({
          upload: async () => ({ data: null, error: null }),
          getPublicUrl: () => ({ data: { publicUrl: "" } }),
        }),
      },
      from: () => ({
        insert: async () => ({ data: null, error: null }),
      }),
    } as unknown as ReturnType<typeof createBrowserClient>;
  }

  if (!_client) {
    _client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _client;
}
