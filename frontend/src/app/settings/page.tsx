"use client";

import { Settings } from "lucide-react";
import { SectionPage } from "@/components/SectionPage";

export default function SettingsPage() {
  return (
    <SectionPage
      active="settings"
      icon={Settings}
      title="Settings"
      description="Update school details, teacher profile preferences, notification options, and workspace defaults."
    />
  );
}
