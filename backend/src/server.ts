import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB, isDbConnected } from "./config/db";
import { initRedisAndQueue, addJobToQueue, isRedisActive } from "./queues/queue";
import { initWorker, setProgressEmitter } from "./workers/generatorWorker";
import {
  createAssessment,
  getAllAssessments,
  getAssessmentById,
  updateAssessment
} from "./services/assessmentRepository";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for development testing
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

app.use(cors());
// Increase payload limit to handle potential file content strings
app.use(express.json({ limit: "50mb" }));

// Real-time WebSocket emitter setup
setProgressEmitter((assessmentId, step, percent, message) => {
  // Emit progress update specifically to client rooms watching this assessment
  io.to(`assessment:${assessmentId}`).emit("progress", {
    assessmentId,
    step,
    percent,
    message
  });
});

// WebSocket Connection Handler
io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Client joins a channel to listen for a specific assessment's generation progress
  socket.on("watch-assessment", (assessmentId: string) => {
    console.log(`👁️ Client ${socket.id} started watching assessment: ${assessmentId}`);
    socket.join(`assessment:${assessmentId}`);
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

/**
 * Express REST Endpoints
 */

// 1. Create a new assessment and queue the generation
app.post("/api/assessments", async (req, res): Promise<any> => {
  try {
    const { title, dueDate, questionTypes, totalQuestions, totalMarks, instructions, fileName, fileContent } = req.body;
    
    // Proper input validation
    if (!title || !dueDate || !questionTypes || !totalQuestions || !totalMarks) {
      return res.status(400).json({ error: "Missing required fields in request body." });
    }

    if (totalQuestions <= 0 || totalMarks <= 0) {
      return res.status(400).json({ error: "Questions and Marks must be positive integers." });
    }

    const assessment = await createAssessment({
      title,
      dueDate: new Date(dueDate),
      questionTypes: Array.isArray(questionTypes) ? questionTypes : [questionTypes],
      totalQuestions: parseInt(totalQuestions, 10),
      totalMarks: parseInt(totalMarks, 10),
      instructions: instructions || "",
      fileName,
      fileContent
    });

    // Queue the background generation job
    const jobId = await addJobToQueue("generate-questions", {
      assessmentId: assessment._id.toString()
    });

    console.log(`🚀 Queued generation job (ID: ${jobId}) for assessment: ${assessment.title}`);

    res.status(201).json({
      message: "Assessment metadata saved, generation task queued.",
      assessmentId: assessment._id.toString(),
      assessment
    });
  } catch (err: any) {
    console.error("Error creating assessment:", err);
    res.status(500).json({ error: err.message || "Failed to create assessment." });
  }
});

// 2. Fetch all assessments (dashboard list view)
app.get("/api/assessments", async (req, res) => {
  try {
    const assessments = await getAllAssessments();
    res.json(assessments);
  } catch (err: any) {
    console.error("Error listing assessments:", err);
    res.status(500).json({ error: "Failed to load assessments." });
  }
});

// 3. Fetch a specific assessment details (output details view)
app.get("/api/assessments/:id", async (req, res): Promise<any> => {
  try {
    const assessment = await getAssessmentById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ error: "Assessment not found." });
    }
    res.json(assessment);
  } catch (err: any) {
    console.error("Error fetching assessment:", err);
    res.status(500).json({ error: "Failed to fetch assessment." });
  }
});

// 4. Trigger regeneration for an existing assessment
app.post("/api/assessments/:id/regenerate", async (req, res): Promise<any> => {
  try {
    const assessment = await getAssessmentById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ error: "Assessment not found." });
    }

    // Reset status to pending
    await updateAssessment(req.params.id, {
      status: "pending",
      error: undefined,
      generatedSections: undefined
    });

    // Re-queue the background generation job
    const jobId = await addJobToQueue("generate-questions", {
      assessmentId: req.params.id
    });

    console.log(`🔄 Re-queued generation job (ID: ${jobId}) for assessment: ${assessment.title}`);

    res.json({
      message: "Regeneration job queued successfully.",
      assessmentId: req.params.id
    });
  } catch (err: any) {
    console.error("Error regenerating assessment:", err);
    res.status(500).json({ error: "Failed to queue regeneration task." });
  }
});

// Health check endpoint with system status info
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date(),
    environment: {
      dbConnected: isDbConnected(),
      redisActive: isRedisActive()
    }
  });
});

/**
 * Bootstraps the application dependencies and starts HTTP listeners
 */
async function startServer() {
  // 1. Connect to Database (falls back gracefully to memory if MongoDB offline)
  await connectDB();

  // 2. Connect to Redis / Setup BullMQ (falls back gracefully to memory loop if Redis offline)
  await initRedisAndQueue();

  // 3. Start workers to handle queues
  initWorker();

  // 4. Start HTTP Server
  server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 SERVER RUNNING ON PORT ${PORT}`);
    console.log(`📡 WebSocket server initialized and broadcasting`);
    console.log(`====================================================`);
  });
}

startServer();
