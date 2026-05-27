"use client";

import { BookOpen } from "lucide-react";
import { SectionPage } from "@/components/SectionPage";

export default function ToolkitPage() {
  return (
    <SectionPage
      active="toolkit"
      icon={BookOpen}
      title="AI Teacher's Toolkit"
      description="Access AI helpers for rubrics, marking criteria, lesson prompts, and classroom resources."
    />
  );
}
