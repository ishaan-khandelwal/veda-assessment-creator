"use client";

import { Home } from "lucide-react";
import { SectionPage } from "@/components/SectionPage";

export default function HomePage() {
  return (
    <SectionPage
      active="home"
      icon={Home}
      title="Home"
      description="A quick landing space for school activity, recent assignment status, and teacher shortcuts."
    />
  );
}
