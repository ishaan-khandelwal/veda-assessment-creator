import { create } from "zustand";
import { connect } from "socket.io-client";

type SocketType = ReturnType<typeof connect>;

export interface IQuestion {
  text: string;
  difficulty: "Easy" | "Moderate" | "Hard";
  marks: number;
  choices?: string[];
  answer?: string;
  explanation?: string;
}

export interface ISection {
  title: string;
  instruction: string;
  questions: IQuestion[];
}

export interface IAssessment {
  _id: string;
  title: string;
  dueDate: string;
  questionTypes: string[];
  totalQuestions: number;
  totalMarks: number;
  instructions: string;
  fileName?: string;
  fileContent?: string;
  status: "pending" | "processing" | "completed" | "failed";
  error?: string;
  generatedSections?: ISection[];
  createdAt: string;
  updatedAt: string;
}

export interface IGenerationProgress {
  step: string;
  percent: number;
  message: string;
}

interface AssessmentState {
  assessments: IAssessment[];
  currentAssessment: IAssessment | null;
  progress: IGenerationProgress | null;
  isLoading: boolean;
  error: string | null;
  socket: SocketType | null;
  
  fetchAssessments: () => Promise<void>;
  fetchAssessmentById: (id: string) => Promise<IAssessment | null>;
  createAssessment: (data: {
    title: string;
    dueDate: string;
    questionTypes: string[];
    totalQuestions: number;
    totalMarks: number;
    instructions: string;
    fileName?: string;
    fileContent?: string;
  }) => Promise<string | null>;
  regenerateAssessment: (id: string) => Promise<void>;
  connectWebSocket: (assessmentId: string) => void;
  disconnectWebSocket: () => void;
}

const API_BASE = "http://localhost:5000/api";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export const useAssessmentStore = create<AssessmentState>((set, get) => ({
  assessments: [],
  currentAssessment: null,
  progress: null,
  isLoading: false,
  error: null,
  socket: null,

  fetchAssessments: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/assessments`);
      if (!res.ok) throw new Error("Failed to load assessments");
      const data = await res.json();
      set({ assessments: data, isLoading: false });
    } catch (err: unknown) {
      set({ error: errorMessage(err, "Failed to load assessments"), isLoading: false });
    }
  },

  fetchAssessmentById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/assessments/${id}`);
      if (!res.ok) throw new Error("Failed to load assessment details");
      const data = await res.json();
      set({ currentAssessment: data, isLoading: false });
      return data;
    } catch (err: unknown) {
      set({ error: errorMessage(err, "Failed to load assessment details"), isLoading: false });
      return null;
    }
  },

  createAssessment: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/assessments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create assessment");
      }
      const result = await res.json();
      set({ isLoading: false });
      return result.assessmentId;
    } catch (err: unknown) {
      set({ error: errorMessage(err, "Failed to create assessment"), isLoading: false });
      return null;
    }
  },

  regenerateAssessment: async (id) => {
    set({ error: null });
    try {
      const res = await fetch(`${API_BASE}/assessments/${id}/regenerate`, {
        method: "POST"
      });
      if (!res.ok) throw new Error("Failed to trigger regeneration");
      
      // Update local state to pending
      set((state) => {
        if (state.currentAssessment && state.currentAssessment._id === id) {
          return {
            currentAssessment: {
              ...state.currentAssessment,
              status: "pending",
              generatedSections: undefined,
              error: undefined
            },
            progress: {
              step: "starting",
              percent: 5,
              message: "Regeneration requested..."
            }
          };
        }
        return {};
      });
    } catch (err: unknown) {
      set({ error: errorMessage(err, "Failed to trigger regeneration") });
    }
  },

  connectWebSocket: (assessmentId: string) => {
    // Clean up existing socket
    get().disconnectWebSocket();

    const socket = connect("http://localhost:5000");

    socket.on("connect", () => {
      console.log("🟢 Connected to backend WebSocket server");
      // Start watching progress for this assessment
      socket.emit("watch-assessment", assessmentId);
    });

    socket.on("progress", (data: { assessmentId: string; step: string; percent: number; message: string }) => {
      if (data.assessmentId === assessmentId) {
        set({
          progress: {
            step: data.step,
            percent: data.percent,
            message: data.message
          }
        });

        // If completed, fetch updated assessment details
        if (data.step === "completed" || data.step === "failed") {
          get().fetchAssessmentById(assessmentId);
        }
      }
    });

    set({ socket });
  },

  disconnectWebSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, progress: null });
    }
  }
}));
