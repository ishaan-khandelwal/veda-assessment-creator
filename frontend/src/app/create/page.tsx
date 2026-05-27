"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAssessmentStore } from "@/store/assessmentStore";
import {
  ArrowLeft,
  Bell,
  BookOpen,
  Calendar,
  Check,
  ChevronDown,
  ClipboardList,
  Home,
  Library,
  Loader2,
  Menu,
  Minus,
  Plus,
  School,
  Settings,
  UploadCloud,
  UserRound,
  Users,
  X
} from "lucide-react";

const questionDefaults = [
  { type: "Multiple Choice Questions", questions: 4, marks: 1 },
  { type: "Short Questions", questions: 3, marks: 2 },
  { type: "Diagram/Graph-Based Questions", questions: 5, marks: 5 },
  { type: "Numerical Problems", questions: 5, marks: 5 }
];

const questionOptions = [
  "Multiple Choice Questions",
  "Short Questions",
  "Long Answer Questions",
  "Diagram/Graph-Based Questions",
  "Numerical Problems",
  "Case Study Questions",
  "Fill in the Blanks"
];

function Logo() {
  return (
    <div className="brand-mark">
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
        <Plus size={14} />
        Create Assignment
      </Link>
      <nav className="side-nav">
        {[
          { label: "Home", href: "/home", icon: Home },
          { label: "My Groups", href: "/groups", icon: Users },
          { label: "Assignments", href: "/", icon: ClipboardList, active: true },
          { label: "AI Teacher's Toolkit", href: "/toolkit", icon: BookOpen },
          { label: "My Library", href: "/library", icon: Library, count: 32 }
        ].map((item) => (
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

function AppTop({ title = "Assignment" }: { title?: string }) {
  return (
    <header className="top-bar">
      <div className="top-left">
        <Link href="/" className="icon-button" aria-label="Back">
          <ArrowLeft size={18} />
        </Link>
        <p className="crumb">{title}</p>
      </div>
      <div className="top-actions">
        <Link href="/settings" className="icon-button" aria-label="Notifications">
          <Bell size={17} />
          <i />
        </Link>
        <Link href="/settings" className="profile-button">
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
    </>
  );
}

type QuestionRow = {
  type: string;
  questions: number;
  marks: number;
};

export default function CreateAssessmentPage() {
  const router = useRouter();
  const { createAssessment, isLoading, error } = useAssessmentStore();
  const [title, setTitle] = useState("Quiz on Electricity");
  const [dueDate, setDueDate] = useState("");
  const [rows, setRows] = useState<QuestionRow[]>(questionDefaults);
  const [instructions, setInstructions] = useState("");
  const [fileName, setFileName] = useState<string | undefined>();
  const [fileContent, setFileContent] = useState<string | undefined>();

  const totalQuestions = rows.reduce((sum, row) => sum + row.questions, 0);
  const totalMarks = rows.reduce((sum, row) => sum + row.questions * row.marks, 0);
  const today = new Date().toISOString().split("T")[0];

  const updateRow = (index: number, patch: Partial<QuestionRow>) => {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const removeRow = (index: number) => {
    setRows((current) => current.filter((_, i) => i !== index));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setFileContent(ev.target?.result as string);
    reader.readAsText(file);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!dueDate || rows.length === 0) return;

    const id = await createAssessment({
      title: title.trim() || "Quiz on Electricity",
      dueDate,
      questionTypes: rows.map((row) => row.type),
      totalQuestions,
      totalMarks,
      instructions: instructions.trim(),
      fileName,
      fileContent
    });

    if (id) router.push(`/assessment/${id}`);
  };

  return (
    <div className="app-frame">
      <Sidebar />
      <MobileChrome />

      <main className="workspace">
        <AppTop />
        <section className="page-heading create-heading">
          <div>
            <span className="live-dot" />
            <div>
              <h1>Create Assignment</h1>
              <p>Set up a new assignment for your students</p>
            </div>
          </div>
        </section>

        <div className="progress-track">
          <span />
          <span />
        </div>

        <form className="creator-panel" onSubmit={handleSubmit}>
          <section className="creator-card">
            <h2>Assignment Details</h2>
            <p>Basic information about your assignment</p>

            <label className="upload-zone">
              <UploadCloud size={28} />
              <strong>{fileName ? fileName : "Choose a file or drag & drop it here"}</strong>
              <span>JPEG, PNG, TXT up to 10MB</span>
              <em>Browse Files</em>
              <input type="file" accept=".txt,.md,.png,.jpg,.jpeg" onChange={handleFileUpload} />
            </label>
            <p className="helper-copy">Upload images of your preferred document/image</p>

            <div className="field-row two">
              <label>
                <span>Title</span>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Quiz on Electricity" />
              </label>
              <label>
                <span>Due Date</span>
                <div className="date-field">
                  <input type="date" min={today} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                  <Calendar size={16} />
                </div>
              </label>
            </div>

            <div className="question-header">
              <span>Question Type</span>
              <span>No. of Questions</span>
              <span>Marks</span>
            </div>

            <div className="question-rows">
              {rows.map((row, index) => (
                <div className="question-row" key={`${row.type}-${index}`}>
                  <label>
                    <select value={row.type} onChange={(e) => updateRow(index, { type: e.target.value })}>
                      {questionOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={15} />
                  </label>
                  <button type="button" className="row-remove" onClick={() => removeRow(index)} aria-label="Remove row">
                    <X size={15} />
                  </button>
                  <div className="stepper">
                    <button type="button" onClick={() => updateRow(index, { questions: Math.max(1, row.questions - 1) })}>
                      <Minus size={13} />
                    </button>
                    <strong>{row.questions}</strong>
                    <button type="button" onClick={() => updateRow(index, { questions: Math.min(50, row.questions + 1) })}>
                      <Plus size={13} />
                    </button>
                  </div>
                  <div className="stepper">
                    <button type="button" onClick={() => updateRow(index, { marks: Math.max(1, row.marks - 1) })}>
                      <Minus size={13} />
                    </button>
                    <strong>{row.marks}</strong>
                    <button type="button" onClick={() => updateRow(index, { marks: Math.min(20, row.marks + 1) })}>
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="add-type"
              onClick={() => setRows((current) => [...current, { type: "Short Questions", questions: 4, marks: 4 }])}
            >
              <Plus size={17} />
              Add Question Type
            </button>

            <div className="totals">
              <span>Total Questions: {totalQuestions}</span>
              <span>Total Marks: {totalMarks}</span>
            </div>

            <label className="instructions-field">
              <span>Additional Information (For better output)</span>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="eg Generate a question paper for 3 hour exam duration..."
              />
              <UserRound size={15} />
            </label>

            {error && <div className="notice error">{error}</div>}
          </section>

          <div className="form-actions">
            <Link href="/" className="secondary-round">
              <ArrowLeft size={15} />
              Previous
            </Link>
            <button className="primary-round" disabled={isLoading || !dueDate || rows.length === 0}>
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {isLoading ? "Generating..." : "Generate Assignment"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
