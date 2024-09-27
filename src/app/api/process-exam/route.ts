import {
  decompositionAgent,
  QuestionType,
} from "@/lib/agent-exam-decomposition";
import { solverAgent } from "@/lib/agent-question-solver";
import { HumanMessage } from "@langchain/core/messages";
import {
  JsonOutputParser,
  StringOutputParser,
} from "@langchain/core/output_parsers";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
// import * as hub from "langchain/hub";
import { NextRequest, NextResponse } from "next/server";

const model4o = new ChatOpenAI({ model: "gpt-4o-mini" });
const model35 = new ChatOpenAI({ model: "gpt-3.5-turbo" });
const parser = new StringOutputParser();
const jsonParser = new JsonOutputParser();

export async function POST(req: NextRequest) {
  const body: {
    messages: Array<{
      role: string;
      content: string;
      experimental_attachments: Array<{
        name: string;
        contentType: string;
        url: string;
      }>;
    }>;
  } = await req.json();

  const userMessage = body.messages.findLast(
    (message) => message.role === "user"
  );

  const attachment = userMessage?.experimental_attachments[0];
  if (!attachment) {
    return NextResponse.json({ error: "No files received." }, { status: 400 });
  }
  const fileBlob = await fetch(attachment.url).then((r) => r.blob());

  const finalState: {
    questions: Array<{
      questionText: string;
      questionNumber: number;
      type: QuestionType;
      parameters?: string[] | undefined;
      code?: string | undefined;
      answers: string[];
    }>;
  } = await decompositionAgent.invoke({
    file: fileBlob,
  });

  const answers = await Promise.all(
    finalState.questions.map(async (question) => {
      const res: {
        questionNumber: number;
        type: QuestionType;
        parameters?: string[];
        code: string;
        formattedCode: string;
        executionSuccess: boolean;
        answers: string[];
        response: string;
        reflectionLoopCount: number;
        messages: unknown;
      } = await solverAgent.invoke(question);
      delete res.messages;
      return { ...res, questionText: question.questionText };
    })
  );

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "You are a Python teachers assistant. Students had a Python programming exam and now your goal is to provide them with answers to the questions. The user will send you a question along with a correct answer and your goal is to briefly and strait to the point explain to them the question and the solution. Given the provided multiple choice options that the question had, tell them which one they should mark as the correct one. Don't delve into much details and if you don't know the answer, tell them that you're not sure.",
    ],
    new MessagesPlaceholder("messages"),
  ]);
  const humanMessage = new HumanMessage({
    content: `Here are the questions:\n
      ${answers
        .map(
          (answer) => `Question number ${
            answer.questionNumber
          }. from the exam. ${answer.questionText}\n
        \`\`\`python
          ${answer.code}
        \`\`\`\n
        Question parameters: ${answer.parameters?.join(", ") || "None"}\n
        Question multiple choice answers: ${answer.answers.join(", ")}\n\n
        The question type is a ${answer.type} question.\n
        ${
          answer.executionSuccess
            ? `When the code is executed the result is: "${answer.response}"`
            : "The question couldn't be executed successfuly, try to answer it by yourself."
        }\n
        `
        )
        .join("\n\n\n")}
      `,
  });

  const res = await prompt
    .pipe(model4o)
    .pipe(new StringOutputParser())
    .invoke({ messages: [humanMessage] });

  console.log("FINAL RESULT IN LAMBDA: ", res);

  return NextResponse.json({ response: res });
}
