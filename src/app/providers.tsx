"use client";

/**
 * @file providers.tsx — Client-side providers wrapper for the root layout.
 * @module app
 *
 * Hosts long-lived React contexts: TanStack Query for server-state caching,
 * sonner for toast notifications. Keeps app/layout.tsx as a Server Component
 * by isolating the "use client" boundary here.
 *
 * @dependencies @tanstack/react-query, sonner
 * @related app/layout.tsx
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  );
}
