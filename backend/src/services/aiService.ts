import { GoogleGenAI } from "@google/genai";
import { ISection, IQuestion } from "../models/Assessment";

// Initialize Gemini client (optional, depending on process.env.GEMINI_API_KEY)
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY") {
    return null;
  }
  try {
    return new GoogleGenAI({ apiKey });
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI client:", error);
    return null;
  }
};

/**
 * Service to generate questions using real Gemini API or high-fidelity mock fallback.
 */
export async function generateQuestions(params: {
  title: string;
  questionTypes: string[];
  totalQuestions: number;
  totalMarks: number;
  instructions: string;
  fileName?: string;
  fileContent?: string;
}): Promise<ISection[]> {
  const ai = getGeminiClient();
  
  if (ai) {
    console.log("🟢 Using Google Gemini API for question generation...");
    try {
      const prompt = `
You are an expert academic assessment creator. Create a structured exam paper based on the following specifications:
- Assessment Title: "${params.title}"
- Question Types to include: ${params.questionTypes.join(", ")}
- Total Questions: ${params.totalQuestions}
- Total Marks: ${params.totalMarks}
- Additional Instructions: "${params.instructions || "None"}"
${params.fileContent ? `- Source Context Material (use this for questions): \n"""\n${params.fileContent}\n"""` : ""}

Guidelines:
1. Divide the questions logically into Sections (e.g. Section A: Multiple Choice Questions, Section B: Short Answer Questions, etc.) based on the requested Question Types.
2. Distribute marks logically across questions to sum up exactly to ${params.totalMarks}.
3. Assign each question a difficulty level: "Easy", "Moderate", or "Hard".
4. Output must be valid JSON matching the following TypeScript interface structure (Do not add markdown formatting outside the JSON, return ONLY the raw JSON string):

interface Response {
  sections: Array<{
    title: string;
    instruction: string;
    questions: Array<{
      text: string;
      difficulty: "Easy" | "Moderate" | "Hard";
      marks: number;
    }>;
  }>;
}
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response received from Gemini API");
      }

      const parsed = JSON.parse(responseText.trim());
      if (parsed && Array.isArray(parsed.sections)) {
        return parsed.sections as ISection[];
      }
      throw new Error("Invalid response format from Gemini API");
    } catch (error: any) {
      console.error("🔴 Gemini API generation failed. Falling back to high-fidelity mock generator. Error:", error.message);
    }
  } else {
    console.log("🟡 No GEMINI_API_KEY found. Using high-fidelity mock question generator...");
  }

  // Fallback high-fidelity mock generator
  return generateMockQuestions(params);
}

// Topic-based question bank for realistic mock generation
const mockQuestionBank: Record<string, { easy: string[]; moderate: string[]; hard: string[] }> = {
  programming: {
    easy: [
      "What is the difference between 'let' and 'const' declarations in modern JavaScript?",
      "Explain the purpose of the 'return' statement in a programming function.",
      "What is an array, and how do you access its first element in JavaScript?",
      "Explain the difference between '=' and '===' operators in JavaScript.",
      "What is HTML, and what is its role in web development?"
    ],
    moderate: [
      "Explain the concept of closures in JavaScript and provide a code example showing its practical usage.",
      "Describe how the event loop works in Node.js, highlighting call stack, event queue, and microtask queues.",
      "What is Promise.all() in JavaScript, and how does it handle errors in concurrent asynchronous operations?",
      "Discuss the differences between SQL and NoSQL databases. When would you prefer MongoDB over PostgreSQL?",
      "Explain CSS Flexbox vs. CSS Grid. In what scenarios is one preferred over the other?"
    ],
    hard: [
      "Design a scalable system architecture for a real-time collaborative code editor like Google Docs. Discuss WebSocket signaling and OT (Operational Transformation).",
      "Explain JavaScript prototypes, prototype chains, and how inheritance is resolved dynamically at runtime.",
      "Analyze the performance implications of React's Virtual DOM reconciliation process. Explain fibers and selective rendering.",
      "Identify security vulnerabilities like CSRF and XSS in web applications and design comprehensive mitigation strategies.",
      "What is the time and space complexity of sorting an array using QuickSort? Discuss average, best, and worst-case scenarios with pivot selection."
    ]
  },
  science: {
    easy: [
      "What is the chemical formula for water?",
      "Identify the three states of matter and provide an example of each.",
      "What planet is closest to the Sun in our solar system?",
      "Explain the function of the human heart in the circulatory system.",
      "What is photosynthesis? Write the basic word equation for it."
    ],
    moderate: [
      "Explain Newton's Three Laws of Motion with real-world examples for each.",
      "Describe the structure of DNA, including double helix, nucleotides, and base pairing rules.",
      "How does the greenhouse effect work, and what human activities amplify it?",
      "Compare and contrast active transport and passive transport across cell membranes.",
      "Explain how vaccines prepare the human immune system to fight off pathogens."
    ],
    hard: [
      "Explain Einstein's Theory of Special Relativity and discuss its implications on time dilation and length contraction.",
      "Describe the pathway and regulatory checkpoints of cellular respiration (Glycolysis, Krebs Cycle, and Electron Transport Chain).",
      "Explain CRISPR-Cas9 technology and analyze the ethical and biological implications of gene editing in human embryos.",
      "Discuss the laws of thermodynamics and how they govern energy transfers within ecosystems.",
      "Explain quantum tunneling and its application in modern semiconductor devices."
    ]
  },
  general: {
    easy: [
      "Who wrote the play 'Hamlet'?",
      "Which country is known as the Land of the Rising Sun?",
      "What is the largest ocean on Earth?",
      "In which year did World War II end?",
      "Name the currency used in the European Union."
    ],
    moderate: [
      "Discuss the main causes and consequences of the Industrial Revolution in Europe.",
      "Explain the concept of supply and demand and how market equilibrium is established.",
      "Describe the separation of powers in a democratic system (Legislative, Executive, Judiciary).",
      "Explain the importance of biodiversity and the current threats facing rainforests globally.",
      "Analyze the themes of power and corruption in George Orwell's novel '1984'."
    ],
    hard: [
      "Critically analyze the geopolitical impacts of the Cold War on modern international alliances.",
      "Compare the philosophical ideologies of Thomas Hobbes and John Locke regarding the social contract and human nature.",
      "Discuss the macroeconomic policies a central bank can implement to combat stagflation. Compare fiscal vs. monetary levers.",
      "Explain the structural causes of the 2008 global financial crisis, focusing on subprime mortgages and derivatives.",
      "Analyze the impact of artificial intelligence on future labor economics, resource distribution, and universal basic income models."
    ]
  }
};

function generateMockQuestions(params: {
  title: string;
  questionTypes: string[];
  totalQuestions: number;
  totalMarks: number;
}): ISection[] {
  // Detect topic from title
  const titleLower = params.title.toLowerCase();
  let topicKey: "programming" | "science" | "general" = "general";
  if (
    titleLower.includes("code") ||
    titleLower.includes("js") ||
    titleLower.includes("javascript") ||
    titleLower.includes("react") ||
    titleLower.includes("programming") ||
    titleLower.includes("computer") ||
    titleLower.includes("web") ||
    titleLower.includes("database") ||
    titleLower.includes("tech")
  ) {
    topicKey = "programming";
  } else if (
    titleLower.includes("science") ||
    titleLower.includes("biology") ||
    titleLower.includes("physics") ||
    titleLower.includes("chemistry") ||
    titleLower.includes("earth") ||
    titleLower.includes("nature")
  ) {
    topicKey = "science";
  }

  const topicBank = mockQuestionBank[topicKey];
  const sections: ISection[] = [];
  
  // Decide how many sections based on questionTypes
  const qTypes = params.questionTypes.length > 0 ? params.questionTypes : ["General Questions"];
  const questionsPerType = Math.ceil(params.totalQuestions / qTypes.length);
  
  let questionsCreated = 0;
  let marksAssigned = 0;

  qTypes.forEach((type, sectionIdx) => {
    if (questionsCreated >= params.totalQuestions) return;

    const currentSectionQuestions: IQuestion[] = [];
    const targetCount = Math.min(questionsPerType, params.totalQuestions - questionsCreated);
    
    // Formulate a section instruction based on question type
    let instruction = "Attempt all questions in this section.";
    if (type.toLowerCase().includes("mcq") || type.toLowerCase().includes("choice")) {
      instruction = "Select the single best answer for each question. No negative marking.";
    } else if (type.toLowerCase().includes("short")) {
      instruction = "Answer all questions in 2-3 sentences.";
    } else if (type.toLowerCase().includes("long") || type.toLowerCase().includes("essay")) {
      instruction = "Answer all questions in detail, showing necessary steps or explanations.";
    }

    for (let i = 0; i < targetCount; i++) {
      const qIndex = questionsCreated + 1;
      
      // Determine difficulty distribution: Easy for first 40%, Moderate for next 40%, Hard for top 20%
      let difficulty: "Easy" | "Moderate" | "Hard" = "Moderate";
      const ratio = qIndex / params.totalQuestions;
      if (ratio <= 0.4) {
        difficulty = "Easy";
      } else if (ratio <= 0.8) {
        difficulty = "Moderate";
      } else {
        difficulty = "Hard";
      }

      // Assign marks: Harder questions get more marks
      let marks = 1;
      if (difficulty === "Easy") {
        marks = Math.max(1, Math.floor(params.totalMarks / params.totalQuestions * 0.7));
      } else if (difficulty === "Moderate") {
        marks = Math.max(2, Math.floor(params.totalMarks / params.totalQuestions));
      } else {
        marks = Math.max(3, Math.floor(params.totalMarks / params.totalQuestions * 1.5));
      }
      
      // Select question text
      const list = topicBank[difficulty.toLowerCase() as "easy" | "moderate" | "hard"];
      const questionText = list[i % list.length];
      
      currentSectionQuestions.push({
        text: `Q${qIndex}. ${questionText}`,
        difficulty,
        marks
      });

      questionsCreated++;
      marksAssigned += marks;
    }

    sections.push({
      title: `Section ${String.fromCharCode(65 + sectionIdx)}: ${type}`,
      instruction,
      questions: currentSectionQuestions
    });
  });

  // Adjust marks of the last question to sum up to exactly totalMarks
  const difference = params.totalMarks - marksAssigned;
  if (difference !== 0 && sections.length > 0) {
    const lastSection = sections[sections.length - 1];
    if (lastSection.questions.length > 0) {
      const lastQ = lastSection.questions[lastSection.questions.length - 1];
      const newMarks = lastQ.marks + difference;
      lastQ.marks = newMarks > 0 ? newMarks : 1;
    }
  }

  return sections;
}
