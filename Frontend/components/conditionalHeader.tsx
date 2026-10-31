"use client";

import { usePathname } from "next/navigation";
import Header from "./header";

export default function ConditionalHeader() {
  const pathname = usePathname();

  if (pathname.includes("profile")) {
    return null;
  }

  return <Header />;
}