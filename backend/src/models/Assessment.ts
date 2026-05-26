import mongoose, { Schema, Document } from "mongoose";

export interface IQuestion {
  text: string;
  difficulty: "Easy" | "Moderate" | "Hard";
  marks: number;
}

export interface ISection {
  title: string;
  instruction: string;
  questions: IQuestion[];
}

export interface IAssessment extends Document {
  title: string;
  dueDate: Date;
  questionTypes: string[];
  totalQuestions: number;
  totalMarks: number;
  instructions: string;
  fileName?: string;
  fileContent?: string;
  status: "pending" | "processing" | "completed" | "failed";
  error?: string;
  generatedSections?: ISection[];
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  text: { type: String, required: true },
  difficulty: { type: String, enum: ["Easy", "Moderate", "Hard"], required: true },
  marks: { type: Number, required: true }
});

const SectionSchema = new Schema<ISection>({
  title: { type: String, required: true },
  instruction: { type: String, required: true },
  questions: [QuestionSchema]
});

const AssessmentSchema = new Schema<IAssessment>(
  {
    title: { type: String, required: true },
    dueDate: { type: Date, required: true },
    questionTypes: [{ type: String, required: true }],
    totalQuestions: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    instructions: { type: String, default: "" },
    fileName: { type: String },
    fileContent: { type: String },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending"
    },
    error: { type: String },
    generatedSections: [SectionSchema]
  },
  { timestamps: true }
);

export default mongoose.model<IAssessment>("Assessment", AssessmentSchema);
