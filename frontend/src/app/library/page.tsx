"use client";

import { Library } from "lucide-react";
import { SectionPage } from "@/components/SectionPage";

export default function LibraryPage() {
  return (
    <SectionPage
      active="library"
      icon={Library}
      title="My Library"
      description="Keep generated papers, reusable materials, source documents, and teaching assets organized."
    />
  );
}
