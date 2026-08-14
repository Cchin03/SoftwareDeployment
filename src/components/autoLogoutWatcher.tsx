"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const AWAY_LIMIT_MS = 5 * 60 * 1000; // 5 minutes
const STORAGE_KEY = "lastActiveAt";

// Renders nothing. Mounted once in the root layout so it's present on
// every page. Tracks when the tab/browser was last visible; if the user
// comes back after being away 5+ minutes, force-logs them out before
// anything else renders.
//
// Note: this can't detect "user closed the tab and never came back" in
// real time — nothing runs on the server or client at that point. It
// only catches it the next time they open the site. For real server-side
// expiry, shorten the Supabase JWT expiry instead (see chat).
export default function AutoLogoutWatcher() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    async function checkAway() {
      const last = localStorage.getItem(STORAGE_KEY);
      if (last) {
        const elapsed = Date.now() - Number(last);
        if (elapsed > AWAY_LIMIT_MS) {
          await supabase.auth.signOut();
          router.push("/dashboard");
          return;
        }
      }
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    }
    checkAway();

    function stamp() {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    }

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") stamp();
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", stamp);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", stamp);
    };
  }, [router]);

  return null;
}
