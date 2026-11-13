"use client";

import { usePathname } from "next/navigation";
import Footer from "./footer";

export default function ConditionalFooter() {
  const pathname = usePathname();

  if (pathname.includes("profile")) {
    return null;
  }

  return <Footer />;
}