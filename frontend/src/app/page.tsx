"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useAssessmentStore, IAssessment } from "@/store/assessmentStore";
import {
  Bell,
  BookOpen,
  ChevronLeft,
  ClipboardList,
  FileText,
  Home,
  Library,
  Menu,
  MoreVertical,
  Plus,
  School,
  Search,
  Settings,
  Sparkles,
  Users,
  XCircle
} from "lucide-react";

const navItems = [
  { label: "Home", href: "/home", icon: Home },
  { label: "My Groups", href: "/groups", icon: Users },
  { label: "Assignments", href: "/", icon: ClipboardList, active: true, count: 10 },
  { label: "AI Teacher's Toolkit", href: "/toolkit", icon: BookOpen },
  { label: "My Library", href: "/library", icon: Library }
];

const sampleAssignments = Array.from({ length: 6 }, (_, index) => ({
  id: `sample-${index}`,
  title: "Quiz on Electricity",
  assigned: "20-06-2025",
  due: "23-06-2025"
}));

function Logo() {
  return (
    <div className="brand-mark" aria-label="VedaAI">
      <span>V</span>
      <strong>VedaAI</strong>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="app-sidebar">
      <Logo />
      <Link href="/create" className="create-pill">
        <Sparkles size={14} />
        Create Assignment
      </Link>

      <nav className="side-nav" aria-label="Primary navigation">
        {navItems.map((item) => (
          <Link href={item.href} key={item.label} className={`side-link ${item.active ? "active" : ""}`}>
            <item.icon size={15} />
            {item.label}
            {item.count && <small>{item.count}</small>}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <Link href="/settings" className="side-link">
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

function TopBar() {
  return (
    <header className="top-bar">
      <div className="top-left">
        <Link href="/" className="icon-button" aria-label="Back">
          <ChevronLeft size={19} />
        </Link>
        <div>
          <p className="crumb">Assignment</p>
        </div>
      </div>
      <div className="top-actions">
        <Link href="/settings" className="icon-button" aria-label="Notifications">
          <Bell size={17} />
          <i />
        </Link>
        <Link href="/settings" className="profile-button" aria-label="Profile">
          <span />
          John Doe
        </Link>
      </div>
    </header>
  );
}

function MobileChrome() {
  return (
    <>
      <header className="mobile-top">
        <Logo />
        <div className="mobile-actions">
          <Link href="/settings" className="icon-button" aria-label="Notifications">
            <Bell size={16} />
            <i />
          </Link>
          <Link href="/settings" className="avatar-dot" aria-label="Profile" />
          <Link href="/settings" className="icon-button" aria-label="Menu">
            <Menu size={17} />
          </Link>
        </div>
      </header>
      <nav className="mobile-bottom" aria-label="Mobile navigation">
        {[
          { label: "Home", href: "/home", icon: Home },
          { label: "Assignments", href: "/", icon: ClipboardList, active: true },
          { label: "Library", href: "/library", icon: Library },
          { label: "AI Toolkit", href: "/toolkit", icon: BookOpen }
        ].map((item) => (
          <Link href={item.href} key={item.label} className={item.active ? "active" : ""}>
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

function EmptyIllustration() {
  return (
    <div className="empty-art" aria-hidden="true">
      <div className="paper-lines">
        <span />
        <span />
        <span />
        <span />
      </div>
      <Search size={94} strokeWidth={1.7} />
      <XCircle size={42} />
      <b />
      <i />
    </div>
  );
}

function StatusDot({ status }: { status: IAssessment["status"] }) {
  return <span className={`status-dot ${status}`} aria-label={status} />;
}

function AssignmentCard({ assessment }: { assessment: IAssessment }) {
  const assigned = new Date(assessment.createdAt).toLocaleDateString("en-GB");
  const due = new Date(assessment.dueDate).toLocaleDateString("en-GB");

  return (
    <Link href={`/assessment/${assessment._id}`} className="assignment-card">
      <div>
        <h3>{assessment.title || "Quiz on Electricity"}</h3>
        <StatusDot status={assessment.status} />
      </div>
      <button aria-label="More options">
        <MoreVertical size={17} />
      </button>
      <p>
        <strong>Assigned on:</strong> {assigned}
      </p>
      <p>
        <strong>Due:</strong> {due}
      </p>
    </Link>
  );
}

function DemoAssignmentCard({ item }: { item: (typeof sampleAssignments)[number] }) {
  return (
    <article className="assignment-card muted-card">
      <div>
        <h3>{item.title}</h3>
      </div>
      <button aria-label="More options">
        <MoreVertical size={17} />
      </button>
      <p>
        <strong>Assigned on:</strong> {item.assigned}
      </p>
      <p>
        <strong>Due:</strong> {item.due}
      </p>
    </article>
  );
}

export default function DashboardPage() {
  const { assessments, isLoading, error, fetchAssessments } = useAssessmentStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      fetchAssessments();
    }
  }, [fetchAssessments]);

  const hasAssignments = assessments.length > 0;
  const visibleAssignments = hasAssignments ? assessments : [];

  return (
    <div className="app-frame">
      <Sidebar />
      <MobileChrome />

      <main className="workspace">
        <TopBar />
        <section className="page-heading">
          <div>
            <span className="live-dot" />
            <div>
              <h1>Assignments</h1>
              <p>Manage and create assignments for your classes.</p>
            </div>
          </div>
        </section>

        {error && (
          <div className="notice error">
            Failed to load assignments. Make sure the backend server is running on port 5000.
          </div>
        )}

        {!isLoading && !error && !hasAssignments && (
          <section className="empty-state">
            <EmptyIllustration />
            <h2>No assignments yet</h2>
            <p>
              Create your first assignment to start collecting and grading student submissions. You can set up rubrics,
              define marking criteria, and let AI assist with grading.
            </p>
            <Link href="/create" className="primary-dark">
              <Plus size={16} />
              Create Your First Assignment
            </Link>
          </section>
        )}

        {(isLoading || hasAssignments) && (
          <section className="assignment-board">
            <div className="board-tools">
              <button>
                <FileText size={15} />
                Filter By
              </button>
              <label>
                <Search size={15} />
                <input placeholder="Search Assignment" />
              </label>
            </div>

            <div className="assignment-grid">
              {isLoading &&
                sampleAssignments.slice(0, 4).map((item) => <DemoAssignmentCard key={item.id} item={item} />)}
              {!isLoading &&
                visibleAssignments.map((assessment) => (
                  <AssignmentCard key={assessment._id} assessment={assessment} />
                ))}
            </div>

            <Link href="/create" className="floating-create">
              <Plus size={15} />
              Create Assignment
            </Link>
          </section>
        )}

        {!isLoading && !error && !hasAssignments && (
          <div className="desktop-preview-strip">
            {sampleAssignments.slice(0, 3).map((item) => <DemoAssignmentCard key={item.id} item={item} />)}
          </div>
        )}
      </main>
    </div>
  );
}
