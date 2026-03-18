"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { createQueryClient } from "@/lib/query-client";

type Props = {
  children: React.ReactNode;
};

export function AppProviders({ children }: Props) {
  const [queryClient] = useState(() => createQueryClient());

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
