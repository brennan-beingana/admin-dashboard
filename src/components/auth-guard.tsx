"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { hasAdminToken } from "@/lib/storage";

type Props = {
  children: React.ReactNode;
};

export function AuthGuard({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    if (!hasAdminToken()) {
      const nextPath = encodeURIComponent(pathname || "/dashboard");
      const loginUrl = `/login?next=${nextPath}`;
      router.replace(loginUrl);
      window.location.replace(loginUrl);
    }
  }, [pathname, router]);

  // Don't render anything until we're on the client and can check auth
  if (!isClient) {
    return null;
  }

  if (!hasAdminToken()) {
    return null;
  }

  return <>{children}</>;
}
