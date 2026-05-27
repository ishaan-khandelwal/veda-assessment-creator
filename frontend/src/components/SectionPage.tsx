"use client";

import Link from "next/link";
import {
  Bell,
  BookOpen,
  ClipboardList,
  Home,
  Library,
  Menu,
  Plus,
  School,
  Settings,
  Users,
  type LucideIcon
} from "lucide-react";

type SectionPageProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  active: "home" | "groups" | "assignments" | "toolkit" | "library" | "settings";
};

const navItems = [
  { key: "home", label: "Home", href: "/home", icon: Home },
  { key: "groups", label: "My Groups", href: "/groups", icon: Users },
  { key: "assignments", label: "Assignments", href: "/", icon: ClipboardList, count: 10 },
  { key: "toolkit", label: "AI Teacher's Toolkit", href: "/toolkit", icon: BookOpen },
  { key: "library", label: "My Library", href: "/library", icon: Library, count: 32 }
];

function Logo() {
  return (
    <Link href="/" className="brand-mark" aria-label="VedaAI dashboard">
      <span>V</span>
      <strong>VedaAI</strong>
    </Link>
  );
}

function Sidebar({ active }: { active: SectionPageProps["active"] }) {
  return (
    <aside className="app-sidebar">
      <Logo />
      <Link href="/create" className="create-pill">
        <Plus size={14} />
        Create Assignment
      </Link>

      <nav className="side-nav" aria-label="Primary navigation">
        {navItems.map((item) => (
          <Link href={item.href} key={item.key} className={`side-link ${active === item.key ? "active" : ""}`}>
            <item.icon size={15} />
            {item.label}
            {item.count && <small>{item.count}</small>}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <Link href="/settings" className={`side-link ${active === "settings" ? "active" : ""}`}>
          <Settings size={15} />
          Settings
        </Link>
        <div className="school-card">
          <div className="school-avatar">
            <School size={19} />
          </div>
          <div>
            <strong>Delhi Public School</strong>
            <span>Bokaro Steel City</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function MobileChrome({ active }: { active: SectionPageProps["active"] }) {
  const mobileItems = [
    { key: "home", label: "Home", href: "/home", icon: Home },
    { key: "assignments", label: "Assignments", href: "/", icon: ClipboardList },
    { key: "library", label: "Library", href: "/library", icon: Library },
    { key: "toolkit", label: "AI Toolkit", href: "/toolkit", icon: BookOpen }
  ];

  return (
    <>
      <header className="mobile-top">
        <Logo />
        <div className="mobile-actions">
          <Link href="/settings" className="icon-button" aria-label="Settings">
            <Bell size={16} />
            <i />
          </Link>
          <Link href="/settings" className="avatar-dot" aria-label="Profile settings" />
          <Link href="/settings" className="icon-button" aria-label="Menu">
            <Menu size={17} />
          </Link>
        </div>
      </header>
      <nav className="mobile-bottom" aria-label="Mobile navigation">
        {mobileItems.map((item) => (
          <Link href={item.href} key={item.key} className={active === item.key ? "active" : ""}>
            <item.icon size={17} />
            {item.label}
          </Link>
        ))}
      </nav>
      <Link href="/create" className="mobile-fab" aria-label="Create assignment">
        <Plus size={22} />
      </Link>
    </>
  );
}

export function SectionPage({ title, description, icon: Icon, active }: SectionPageProps) {
  return (
    <div className="app-frame">
      <Sidebar active={active} />
      <MobileChrome active={active} />

      <main className="workspace">
        <header className="top-bar">
          <div className="top-left">
            <p className="crumb">{title}</p>
          </div>
          <div className="top-actions">
            <Link href="/settings" className="icon-button" aria-label="Notifications">
              <Bell size={17} />
              <i />
            </Link>
            <Link href="/settings" className="profile-button" aria-label="Profile settings">
              <span />
              John Doe
            </Link>
          </div>
        </header>

        <section className="section-placeholder">
          <div className="section-icon">
            <Icon size={34} />
          </div>
          <h1>{title}</h1>
          <p>{description}</p>
          <div className="section-actions">
            <Link href="/" className="secondary-round">
              View Assignments
            </Link>
            <Link href="/create" className="primary-dark">
              <Plus size={15} />
              Create Assignment
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
