"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAssessmentStore, IAssessment, IQuestion, ISection } from "@/store/assessmentStore";
import {
  ArrowLeft,
  Bell,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Download,
  Home,
  Library,
  Loader2,
  Menu,
  Plus,
  Printer,
  RefreshCw,
  School,
  Settings,
  Users,
  XCircle
} from "lucide-react";

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
        AI Teacher&apos;s Toolkit
      </Link>
      <nav className="side-nav">
        {[
          { label: "Home", href: "/home", icon: Home },
          { label: "My Groups", href: "/groups", icon: Users },
          { label: "Assignments", href: "/", icon: ClipboardList, active: true, count: 10 },
          { label: "AI Teacher's Toolkit", href: "/toolkit", icon: BookOpen },
          { label: "My Library", href: "/library", icon: Library }
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

function MobileChrome() {
  return (
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
  );
}

function TopBar({ title }: { title: string }) {
  return (
    <header className="top-bar output-top">
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

function GenerationState({ message, percent }: { message: string; percent: number }) {
  return (
    <section className="generator-state">
      <div className="loader-badge">
        <Loader2 size={28} className="animate-spin" />
      </div>
      <h1>Generating assessment</h1>
      <p>{message}</p>
      <div className="generation-bar">
        <span style={{ width: `${percent}%` }} />
      </div>
    </section>
  );
}

function QuestionLine({ question, number }: { question: IQuestion; number: number }) {
  return (
    <li>
      <p>
        <span>{number}.</span>
        {question.text.replace(/^Q\d+\.\s*/, "")}
        <em>[{question.marks} Mark{question.marks !== 1 ? "s" : ""}]</em>
      </p>
      {question.choices && question.choices.length > 0 && (
        <ol type="a">
          {question.choices.map((choice, index) => (
            <li key={index}>{choice}</li>
          ))}
        </ol>
      )}
    </li>
  );
}

function ExamPaper({ assessment }: { assessment: IAssessment }) {
  const sections: ISection[] = assessment.generatedSections || [];
  const totalMarks = assessment.totalMarks || sections.reduce((sum, section) => sum + section.questions.reduce((qSum, q) => qSum + q.marks, 0), 0);

  return (
    <article id="exam-paper" className="paper-sheet">
      <header>
        <h1>Delhi Public School, Sector-4, Bokaro</h1>
        <h2>{assessment.title}</h2>
        <p>Class 5th</p>
      </header>

      <div className="paper-meta">
        <span>Time Allowed: 45 minutes</span>
        <span>Maximum Marks: {totalMarks}</span>
      </div>

      <p className="paper-instruction">All questions are compulsory unless stated otherwise.</p>

      <div className="student-lines">
        <span>Name: ____________________</span>
        <span>Roll Number: ______________</span>
        <span>Class/Sec: ________________</span>
      </div>

      {sections.map((section, sectionIndex) => (
        <section key={sectionIndex}>
          <h3>{section.title || `Section ${String.fromCharCode(65 + sectionIndex)}`}</h3>
          <p>{section.instruction}</p>
          <ol>
            {section.questions.map((question, questionIndex) => (
              <QuestionLine key={questionIndex} question={question} number={questionIndex + 1} />
            ))}
          </ol>
        </section>
      ))}

      {sections.some((section) => section.questions.some((question) => question.answer || question.explanation)) && (
        <section className="answer-key">
          <h3>Answer Key</h3>
          <ol>
            {sections.flatMap((section) =>
              section.questions
                .filter((question) => question.answer)
                .map((question, index) => (
                  <li key={`${section.title}-${index}`}>
                    <strong>{question.answer}</strong>
                    {question.explanation && <span>{question.explanation}</span>}
                  </li>
                ))
            )}
          </ol>
        </section>
      )}
    </article>
  );
}

export default function AssessmentOutputPage() {
  const params = useParams();
  const id = params.id as string;
  const {
    currentAssessment,
    progress,
    isLoading,
    error,
    fetchAssessmentById,
    regenerateAssessment,
    connectWebSocket,
    disconnectWebSocket
  } = useAssessmentStore();
  const initialized = useRef(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!initialized.current && id) {
      initialized.current = true;
      fetchAssessmentById(id);
      connectWebSocket(id);
    }
    return () => disconnectWebSocket();
  }, [id, fetchAssessmentById, connectWebSocket, disconnectWebSocket]);

  useEffect(() => {
    if (!currentAssessment || currentAssessment.status === "completed" || currentAssessment.status === "failed") return;
    const interval = setInterval(() => fetchAssessmentById(id), 3000);
    return () => clearInterval(interval);
  }, [currentAssessment, currentAssessment?.status, id, fetchAssessmentById]);

  const handleRegenerate = async () => {
    await regenerateAssessment(id);
    connectWebSocket(id);
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const html2pdf = (await import("html2pdf.js")).default;
      const element = document.getElementById("exam-paper");
      if (!element) return;
      await html2pdf()
        .set({
          margin: [8, 8, 8, 8],
          filename: `${currentAssessment?.title?.replace(/[^a-z0-9]/gi, "_") || "assessment"}_paper.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
        })
        .from(element)
        .save();
    } catch {
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  const isGenerating = !currentAssessment || currentAssessment.status === "pending" || currentAssessment.status === "processing";
  const title = currentAssessment?.title || "AI Generated Question Paper";

  return (
    <div className="app-frame output-frame">
      <Sidebar />
      <MobileChrome />
      <main className="workspace output-workspace">
        <TopBar title={title} />

        {error && (
          <div className="notice error">
            <XCircle size={17} />
            {error}
          </div>
        )}

        {isLoading && !currentAssessment && (
          <GenerationState message="Loading assessment details..." percent={20} />
        )}

        {isGenerating && (
          <GenerationState
            message={progress?.message || "AI is drafting your assessment paper."}
            percent={progress?.percent || 8}
          />
        )}

        {currentAssessment?.status === "failed" && (
          <section className="generator-state failed">
            <XCircle size={42} />
            <h1>Generation failed</h1>
            <p>{currentAssessment.error || "Something went wrong while generating this assignment."}</p>
            <button className="primary-dark" onClick={handleRegenerate}>
              <RefreshCw size={15} />
              Try Again
            </button>
          </section>
        )}

        {currentAssessment?.status === "completed" && (
          <section className="output-layout">
            <div className="output-toolbar">
              <div>
                <p>Generated with AI from assignment provisioning from VEDA. Editable & business-class assignment tool.</p>
              </div>
              <div>
                <button className="download-pill" onClick={handleDownloadPDF} disabled={isDownloading}>
                  {isDownloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                  {isDownloading ? "Preparing..." : "Download PDF"}
                </button>
                <button className="icon-button light" onClick={() => window.print()} aria-label="Print">
                  <Printer size={16} />
                </button>
              </div>
            </div>

            <ExamPaper assessment={currentAssessment} />

            <div className="output-actions">
              <span>
                <CheckCircle2 size={16} />
                Assignment generated successfully
              </span>
              <button onClick={handleRegenerate}>
                <RefreshCw size={15} />
                Regenerate
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
