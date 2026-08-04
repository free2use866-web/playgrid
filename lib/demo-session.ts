"use client";

import { useEffect, useState } from "react";

export type DemoRole = "student" | "admin";

export type DemoSession = {
  role: DemoRole;
  name: string;
  username: string;
  email: string;
  initials: string;
  sportsCredits: number;
  arcadeCredits: number;
  rank: number | null;
};

const DEMO_SESSION_KEY = "playgrid-demo-session-v1";
const DEMO_ARCADE_BALANCE_KEY = "playgrid-demo-arcade-balance-v1";

const demoProfiles: Record<DemoRole, DemoSession> = {
  student: {
    role: "student",
    name: "Demo Student",
    username: "demo_student",
    email: "student.demo@playgrid.test",
    initials: "DS",
    sportsCredits: 6730,
    arcadeCredits: 5750,
    rank: 6,
  },
  admin: {
    role: "admin",
    name: "Demo Admin",
    username: "demo_admin",
    email: "admin.demo@playgrid.test",
    initials: "DA",
    sportsCredits: 0,
    arcadeCredits: 0,
    rank: null,
  },
};

export function getDemoSession(): DemoSession | null {
  if (typeof window === "undefined") return null;

  const storedRole = window.sessionStorage.getItem(DEMO_SESSION_KEY);
  if (storedRole !== "student" && storedRole !== "admin") return null;
  const profile = demoProfiles[storedRole];
  if (storedRole === "admin") return { ...profile };

  const storedArcadeBalance = Number(
    window.sessionStorage.getItem(DEMO_ARCADE_BALANCE_KEY),
  );

  return {
    ...profile,
    arcadeCredits: Number.isFinite(storedArcadeBalance)
      ? Math.max(0, Math.floor(storedArcadeBalance))
      : profile.arcadeCredits,
  };
}

export function useDemoSession() {
  const [session, setSession] = useState<DemoSession | null>(null);

  useEffect(() => {
    const syncSession = () => setSession(getDemoSession());
    syncSession();
    window.addEventListener("playgrid-demo-session", syncSession);
    return () =>
      window.removeEventListener("playgrid-demo-session", syncSession);
  }, []);

  return session;
}

export function startDemoSession(role: DemoRole) {
  window.sessionStorage.setItem(DEMO_SESSION_KEY, role);
  if (
    role === "student" &&
    window.sessionStorage.getItem(DEMO_ARCADE_BALANCE_KEY) === null
  ) {
    window.sessionStorage.setItem(
      DEMO_ARCADE_BALANCE_KEY,
      String(demoProfiles.student.arcadeCredits),
    );
  }
  window.dispatchEvent(new Event("playgrid-demo-session"));
}

export function clearDemoSession() {
  window.sessionStorage.removeItem(DEMO_SESSION_KEY);
  window.sessionStorage.removeItem(DEMO_ARCADE_BALANCE_KEY);
  window.dispatchEvent(new Event("playgrid-demo-session"));
}

export function adjustDemoArcadeCredits(delta: number) {
  const session = getDemoSession();
  if (!session || session.role !== "student" || !Number.isFinite(delta)) {
    return;
  }

  window.sessionStorage.setItem(
    DEMO_ARCADE_BALANCE_KEY,
    String(Math.max(0, Math.floor(session.arcadeCredits + delta))),
  );
  window.dispatchEvent(new Event("playgrid-demo-session"));
}

export function enterDemo(role: DemoRole) {
  startDemoSession(role);
  window.location.assign(role === "admin" ? "/admin" : "/sports");
}

export function switchDemoRole(currentRole: DemoRole) {
  enterDemo(currentRole === "admin" ? "student" : "admin");
}
