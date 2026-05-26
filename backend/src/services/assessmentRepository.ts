import AssessmentModel, { IAssessment, ISection } from "../models/Assessment";
import { isDbConnected } from "../config/db";

// In-Memory fallback store
const inMemoryStore = new Map<string, any>();

export async function createAssessment(data: {
  title: string;
  dueDate: Date;
  questionTypes: string[];
  totalQuestions: number;
  totalMarks: number;
  instructions: string;
  fileName?: string;
  fileContent?: string;
}): Promise<any> {
  if (isDbConnected()) {
    try {
      const assessment = new AssessmentModel({
        ...data,
        status: "pending"
      });
      return await assessment.save();
    } catch (err) {
      console.error("Mongoose save error, fallback to memory", err);
    }
  }

  // Memory Fallback
  const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const memoryObj = {
    _id: id,
    ...data,
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date()
  };
  inMemoryStore.set(id, memoryObj);
  return memoryObj;
}

export async function updateAssessment(
  id: string,
  updateData: {
    status?: "pending" | "processing" | "completed" | "failed";
    error?: string;
    generatedSections?: ISection[];
  }
): Promise<any> {
  if (isDbConnected()) {
    try {
      const updated = await AssessmentModel.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      );
      if (updated) return updated;
    } catch (err) {
      console.error("Mongoose update error, fallback to memory", err);
    }
  }

  // Memory Fallback
  const item = inMemoryStore.get(id);
  if (item) {
    const updatedItem = {
      ...item,
      ...updateData,
      updatedAt: new Date()
    };
    inMemoryStore.set(id, updatedItem);
    return updatedItem;
  }
  return null;
}

export async function getAssessmentById(id: string): Promise<any> {
  if (isDbConnected()) {
    try {
      const item = await AssessmentModel.findById(id);
      if (item) return item;
    } catch (err) {
      console.error("Mongoose fetch error, fallback to memory", err);
    }
  }

  // Memory Fallback
  return inMemoryStore.get(id) || null;
}

export async function getAllAssessments(): Promise<any[]> {
  if (isDbConnected()) {
    try {
      return await AssessmentModel.find().sort({ createdAt: -1 });
    } catch (err) {
      console.error("Mongoose list error, fallback to memory", err);
    }
  }

  // Memory Fallback
  return Array.from(inMemoryStore.values()).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
}
