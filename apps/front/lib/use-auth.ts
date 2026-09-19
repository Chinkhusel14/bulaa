"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMe, type AuthUser } from "./api";

export function useAuth() {
  return useQuery<AuthUser | null>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      try {
        return await fetchMe();
      } catch {
        return null;
      }
    },
    retry: false,
  });
}
