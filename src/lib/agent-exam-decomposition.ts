import { ChatOpenAI } from "@langchain/openai";
// import * as hub from "langchain/hub";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { z } from "zod";

export type QuestionType = "theoretical" | "coding";

// Define the graph state
const GraphState = Annotation.Root({
  file: Annotation<Blob>(),
  exam_text: Annotation<string>(),
  questions: Annotation<
    Array<{
      questionText: string;
      questionNumber: number;
      type: QuestionType;
      parameters?: string[] | undefined;
      code?: string | undefined;
      answers: string[];
    }>
  >(),
});

async function inputNode(state: typeof GraphState.State) {
  // Logic to receive the entire exam text
  const loader = new PDFLoader(state.file);
  const exam = await loader.load();
  const content = exam.map((doc) => doc.pageContent).join();
  state.exam_text = content;
  return state;
}

async function classificationNode(state: typeof GraphState.State) {
  // Logic to classify the question type
  const modelClassification = new ChatOpenAI({
    temperature: 0,
    model: "gpt-4o",
  });
  const res = await modelClassification.withStructuredOutput(
    z.object({
      pythonQuestions: z.array(
        z.object({
          questionText: z
            .string()
            .describe(
              "The extracted question text. Extract only the question text before the code."
            ),
          questionNumber: z
            .number()
            .min(1)
            .max(5)
            .describe(
              "The question number. Usually can be found at the start of the question."
            ),
          type: z
            .enum(["theoretical", "coding"])
            .describe(
              "The type of the question. Theoretical questions are strictly about some Python concepts while coding questions have some code blocks that need to be analyzed."
            ),
          parameters: z
            .array(z.string())
            .optional()
            .describe(
              "The parameters given in the question text (NOT IN THE CODE) that are required to successfully analyze and execute the code. If the question doesn't need parameters then leave this undefined."
            ),
          code: z
            .string()
            .optional()
            .describe("The Python code block from the question"),
          answers: z
            .array(z.string())
            .describe(
              'An array of question answers from the question that the student chooses from. eg. ["A) 12345", "B) abcde", "C) 123ABC"]'
            ),
        })
      ),
    })
  )
    .invoke(`Extract only Python related questions and their data that is required in a JSON format. The question number can be found at the start of the question, the execution parameters values are provided in the question text if needed (they are never in the code). If it's a coding question, it will also have a code block for analysis. Theoretical questions don't have any code and are strictly based around Python concepts. At the end of the question are the given question answers that a student should choose from.
    
    Whole exam text (and code): 
    ${state.exam_text}
    `);

  state.questions = res.pythonQuestions;
  return state;
}

function outputNode(state: typeof GraphState.State) {
  // Logic to output the final result
  const finalOut = state.questions
    .map(
      (question) =>
        `OUTPUT NODE: ${question.questionText}
        `
    )
    .join(`\n\n`);

  console.log("OUTPUT NODE: ", finalOut);
  return state;
}

// Define a new graph
const graph = new StateGraph(GraphState);
graph
  // Add nodes to the graph
  .addNode("input", inputNode)
  .addNode("classify_question", classificationNode)
  .addNode("output", outputNode)

  // Define the edges
  .addEdge(START, "input")
  .addEdge("input", "classify_question")
  .addEdge("classify_question", "output")
  .addEdge("output", END);

// Finally, we compile it!
// This compiles it into a LangChain Runnable.
export const decompositionAgent = graph.compile();
