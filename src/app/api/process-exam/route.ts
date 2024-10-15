import {
  decompositionAgent,
  QuestionType,
} from "@/lib/agent-exam-decomposition";
import { GraphState, solverAgent } from "@/lib/agent-question-solver";
// import * as hub from "langchain/hub";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.formData();
  const fileBlob = body.get("file");

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

  const answers = await Promise.allSettled(
    finalState.questions.map(async (question) => {
      const res: Partial<typeof GraphState.State> = await solverAgent.invoke(
        question
      );
      delete res.messages;
      return { ...res, questionText: question.questionText };
    })
  );

  const res = answers
    .filter((a) => a.status === "fulfilled")
    .map((a) => a.value);

  return NextResponse.json({ response: res });
}
