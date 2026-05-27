"use client";

import { Users } from "lucide-react";
import { SectionPage } from "@/components/SectionPage";

export default function GroupsPage() {
  return (
    <SectionPage
      active="groups"
      icon={Users}
      title="My Groups"
      description="Manage class groups, student sections, and assignment recipients from one place."
    />
  );
}
