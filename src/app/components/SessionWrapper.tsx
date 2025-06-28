"use client";

import { SessionProvider } from "next-auth/react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import React from "react";

export default function SessionWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNavbar = !["/login", "/register"].includes(pathname ?? "");

  return (
    <SessionProvider>
      {showNavbar && <Navbar />}
      {children}
    </SessionProvider>
  );
}
