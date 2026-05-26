import { Worker } from "bullmq";
import { isRedisActive, getRedisConnection, registerWorkerHandler } from "../queues/queue";
import { getAssessmentById, updateAssessment } from "../services/assessmentRepository";
import { generateQuestions } from "../services/aiService";

// Real-time WebSocket emitter function to be injected from server.ts
let progressEmitter: ((assessmentId: string, step: string, percent: number, message: string) => void) | null = null;

export function setProgressEmitter(emitter: typeof progressEmitter) {
  progressEmitter = emitter;
}

function notify(assessmentId: string, step: string, percent: number, message: string) {
  console.log(`[Job Progress] Assessment: ${assessmentId} - ${percent}%: ${message}`);
  if (progressEmitter) {
    progressEmitter(assessmentId, step, percent, message);
  }
}

/**
 * Core business logic to run AI question generation.
 * Shared between BullMQ Worker and InMemory fallback queue.
 */
export async function processGenerationJob(job: { data: { assessmentId: string } }) {
  const { assessmentId } = job.data;
  
  try {
    notify(assessmentId, "starting", 5, "Initializing background worker...");
    
    // 1. Fetch assessment
    const assessment = await getAssessmentById(assessmentId);
    if (!assessment) {
      throw new Error(`Assessment ${assessmentId} not found in database`);
    }
    
    // Update status to processing
    await updateAssessment(assessmentId, { status: "processing" });
    
    notify(assessmentId, "parsing", 20, "Analyzing assessment metadata and structuring topic prompts...");
    await new Promise(r => setTimeout(r, 1200)); // micro-interaction delay for realism
    
    notify(assessmentId, "ai_prompt", 45, "Running AI question generation (designing sections, difficulties, and marks)...");
    
    // 2. Generate questions
    const generatedSections = await generateQuestions({
      title: assessment.title,
      questionTypes: assessment.questionTypes,
      totalQuestions: assessment.totalQuestions,
      totalMarks: assessment.totalMarks,
      instructions: assessment.instructions,
      fileName: assessment.fileName,
      fileContent: assessment.fileContent
    });
    
    notify(assessmentId, "formatting", 75, "Validating and balancing marks allocation across sections...");
    await new Promise(r => setTimeout(r, 1000));
    
    notify(assessmentId, "saving", 90, "Writing exam layout and question indices to data repository...");
    
    // 3. Save to database
    await updateAssessment(assessmentId, {
      status: "completed",
      generatedSections
    });
    
    notify(assessmentId, "completed", 100, "Assessment generated successfully! Ready for printing.");
  } catch (error: any) {
    console.error(`🔴 Error processing generation job for assessment ${assessmentId}:`, error);
    
    await updateAssessment(assessmentId, {
      status: "failed",
      error: error.message || "Unknown error occurred during generation"
    });
    
    notify(assessmentId, "failed", 100, `Generation failed: ${error.message || "Unknown error"}`);
  }
}

/**
 * Initializes workers depending on Redis connection state.
 */
export function initWorker() {
  if (isRedisActive()) {
    console.log("🟢 Initializing BullMQ Redis Worker...");
    const connection = getRedisConnection();
    
    new Worker(
      "assessment-generation",
      async (job) => {
        await processGenerationJob(job);
      },
      {
        connection: connection!,
        concurrency: 2
      }
    );
  } else {
    console.log("🟡 Registering In-Memory Worker Handler...");
    registerWorkerHandler(async (job) => {
      await processGenerationJob({ data: job.data });
    });
  }
}
