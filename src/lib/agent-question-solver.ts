import { ChatOpenAI } from "@langchain/openai";
// import * as hub from "langchain/hub";
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { z } from "zod";
import { executePythonCode } from "./agentTools";

const tools = [executePythonCode];
const toolNode = new ToolNode(tools);

const REFLECTION_LOOP_COUNT = 3;

const model = new ChatOpenAI({
  temperature: 0,
  model: "gpt-4o-mini",
}).bindTools(tools);

type QuestionType = "theoretical" | "coding" | "unknown";

// Define the graph state
export const GraphState = Annotation.Root({
  questionText: Annotation<string>(),
  questionNumber: Annotation<number>(),
  type: Annotation<QuestionType>(),
  parameters: Annotation<string[] | undefined>(),
  code: Annotation<string>(),
  formattedCode: Annotation<string>(),
  executionResult: Annotation<string>(),
  executionSuccess: Annotation<boolean>(),
  explanation: Annotation<string>(),
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  reflectionLoopCount: Annotation<number>(),
});

async function inputNode(state: typeof GraphState.State) {
  // Format the code
  const model = new ChatOpenAI({
    temperature: 0,
    model: "gpt-4o-mini",
  });

  const res =
    await model.invoke(`Format and adapt the following Python code so that it can be executed and it needs to print out the result of execution. Make sure to include any required imports or function definitions. Respond short and concise by including the formatted code and nothing else!

    ${
      state.parameters && state.parameters.length > 0
        ? `The code will also require these parameters to run so insert them at an appropirate place:
      Parameters: [${state.parameters?.join(", ")}]`
        : ""
    }
    
    --------------------

    Code to format:
    ${state.code}

    --------------------

    Formatted code:
    `);

  const formattedCode = res.content.toString().trim();
  // console.log("FORMATTED CODE: ", formattedCode, `\n\n`);
  state.formattedCode = formattedCode;

  return state;
}

async function executorNode(state: typeof GraphState.State) {
  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are a Python coding assistant tasked with executing Python code that the user provides and returning the response.
  Try your best to make the code work and execute it using the provided tool for code execution. You should strictly answer with the result of the execution or an error.
  If the user provides critique for the error, fix the code and execute again.`,
    ],
    new MessagesPlaceholder("messages"),
  ]);

  const executionChain = prompt.pipe(model);

  if (state.messages.length === 0) {
    const message = new HumanMessage({
      content: `Execute the following Python code and return only the result. If the code fails to execute, return the error message. Make sure to include any required imports or function definitions. Respond short and concise by including the execution result and nothing else!
      
      ${
        state.parameters && state.parameters.length > 0
          ? `The code might also require these parameters to run so insert them at an appropirate place:
        Parameters: [${state.parameters?.join(", ")}]`
          : ""
      }

      --------------------

      Code to execute:
      ${state.formattedCode}

      --------------------

      Execution result:
      `,
    });
    state.messages.push(message);
  }

  const lastMessage = state.messages[state.messages.length - 1];

  if (state.executionSuccess && lastMessage?._getType() !== "human") {
    // If the execution was successful and the last message is not a "human" critique message, the process is finished
    return state;
  }

  const res = await executionChain.invoke({ messages: state.messages });

  // console.log(
  //   "EXECUTION NODE RESULT: ",
  //   JSON.stringify(res.content),
  //   `\n\n`
  // );
  return { messages: [res], executionSuccess: false };
}

async function reflectionNode(state: typeof GraphState.State) {
  // Logic for reflection on the result
  const { messages, executionSuccess } = state;

  // console.log("REFLECTION NODE COUNTER: ", state.reflectionLoopCount);

  const reflectionModel = new ChatOpenAI({
    temperature: 0,
    model: "gpt-4o-mini",
  }).withStructuredOutput(
    z.object({
      executedSuccessfully: z
        .boolean()
        .describe(
          "A simple true or false value explaining if the code was executed successully or an error occured."
        ),
      critique: z
        .string()
        .optional()
        .describe(
          "A critique of the code if it seems like the result doesn't make sense or if an error occured. Contains recommendations to improve and fix the code."
        ),
    })
  );
  const clsMap: { [key: string]: new (content: string) => BaseMessage } = {
    ai: HumanMessage,
    tool: HumanMessage,
    human: AIMessage,
  };
  const translated = [
    messages[0],
    ...messages
      .slice(1)
      .map((msg) => new clsMap[msg._getType()](msg.content.toString())),
  ];

  const reflectionPrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are a Python language debugger tasked with helping the user on executing Python code. Analyse the code that the user sent and the execution response. If there's an error, include recommendations on how to fix the code for them to try and resolve the error.
      Respond in a JSON format with all required information.`,
    ],
    new MessagesPlaceholder("messages"),
  ]);
  const reflect = reflectionPrompt.pipe(reflectionModel);
  const res = await reflect.invoke({ messages: translated });

  return {
    ...(res.critique
      ? { messages: [new HumanMessage({ content: res.critique })] }
      : {}),
    reflectionLoopCount: (state.reflectionLoopCount ?? 0) + 1,
    executionSuccess: res.executedSuccessfully,
  };
}

const shouldContinue = (state: typeof GraphState.State) => {
  const { messages, reflectionLoopCount, executionSuccess } = state;

  // console.log("SHOULD CONTINUE? COUNTER AT ", reflectionLoopCount);

  if (executionSuccess) return "output";

  if (reflectionLoopCount > REFLECTION_LOOP_COUNT) {
    // TODO: return message "unable to solve"
    return "output";
  }

  const lastMessage = messages[messages.length - 1];

  if (
    "tool_calls" in lastMessage &&
    Array.isArray(lastMessage.tool_calls) &&
    lastMessage.tool_calls?.length
  ) {
    return "tools";
  } else {
    return "reflection";
  }
};

async function outputNode(state: typeof GraphState.State) {
  // Logic to output the final result
  const { messages, formattedCode, executionSuccess } = state;

  if (!executionSuccess) {
    return { explanation: "Neočekivana greška prilikom analiziranja pitanja." };
  }

  const executionResult = messages[messages.length - 1].content.toString();

  const outputPrompt = ChatPromptTemplate.fromMessages([
    new SystemMessage(`Ti si Python asistent za objasnjavanje koda. Tvoj zadatak je da objasnis korisniku kako se kod izvrsio da bi se doslo do krajnjeg rezultata izvrsavanja. Ukratko objasni korisniku postupak izvrsavanja u par recenica.
      Korisnik ce ti dati kod kao i rezultat izvrsavanja u Python okruzenju.
      Budi ljubazan i pomozi korisniku da razume kod.`),
    HumanMessagePromptTemplate.fromTemplate(`
      Kod: 
      {code}
      
      -------------

      Rezultat izvrsavanja: {result}

      -------------

      Objasnjenje:
      `),
  ]);
  const outputChain = outputPrompt.pipe(model).pipe(new StringOutputParser());
  const res = await outputChain.invoke({
    code: formattedCode,
    result: executionResult,
  });
  console.log("OUTPUT NODE RESULT (EXPLANATION): ", res, `\n\n`);
  return {
    // response: messages[messages.length - 1].content.toString(),
    executionResult,
    explanation: res,
  };
}

// Define a new graph
const graph = new StateGraph(GraphState);
graph
  // Add nodes to the graph
  .addNode("input", inputNode)
  .addNode("output", outputNode)
  .addNode("executor", executorNode)
  .addNode("tools", toolNode)
  .addNode("reflection", reflectionNode)

  // Define the edges
  .addEdge(START, "input")
  .addEdge("input", "executor")
  .addConditionalEdges("executor", shouldContinue, [
    "tools",
    "output",
    "reflection",
  ])
  .addEdge("tools", "executor")
  .addEdge("reflection", "executor")
  .addEdge("output", END);

export const solverAgent = graph.compile();
