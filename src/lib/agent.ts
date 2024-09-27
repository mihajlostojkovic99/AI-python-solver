import { MemorySaver } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
// import * as hub from "langchain/hub";
import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { executePythonCode } from "./agentTools";

const llm = new ChatOpenAI({
  model: "gpt-3.5-turbo",
  temperature: 0,
});
const reflectionPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a teacher grading a students answer to a Python code snippet.
Generate critique and recommendations for the student's submission but do not answer the question for them! Guide them to the correct answer.
Provide detailed recommendations, including how he could edit the code to get it running to get the correct answer. DO NOT TELL THEM WHAT THE CODE SHOULD OUTPUT!`,
  ],
  new MessagesPlaceholder("messages"),
]);
const reflect = reflectionPrompt.pipe(llm);

// Define the graph state
const GraphState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (state, update) => state.concat(update),
    default: () => [],
  }),
});

const tools = [executePythonCode];
const toolNode = new ToolNode(tools);

const model = new ChatOpenAI({
  temperature: 0,
  model: "gpt-3.5-turbo",
}).bindTools(tools);

// Define the function that determines whether to continue or not
function shouldContinue(state: typeof GraphState.State) {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];

  if (messages.length > 6 && !lastMessage.additional_kwargs.tool_calls) {
    return END;
  }

  // If the LLM makes a tool call, then we route to the "tools" node
  if (lastMessage.additional_kwargs.tool_calls) {
    return "tools";
  }
  return "reflect";
}

// Define the function that calls the model
async function agentNode(state: typeof GraphState.State) {
  const messages = state.messages;

  const response = await model.invoke(messages);

  // We return a list, because this will get added to the existing list
  return { messages: [response] };
}
const reflectionNode = async (state: typeof GraphState.State) => {
  const { messages } = state;
  // Other messages we need to adjust
  const clsMap: { [key: string]: new (content: string) => BaseMessage } = {
    ai: HumanMessage,
    human: AIMessage,
    tool: HumanMessage,
  };
  // First message is the original user request. We hold it the same for all nodes
  const translated = [
    messages[0],
    ...messages.slice(1).map((msg) => {
      const MessageClass = clsMap[msg._getType()];
      if (!MessageClass) {
        throw new Error(`Unknown message type: ${msg._getType()}`);
      }
      return new MessageClass(msg.content.toString());
    }),
  ];
  const res = await reflect.invoke({ messages: translated });
  // We treat the output of this as human feedback for the generator
  return {
    messages: [new HumanMessage({ content: res.content })],
  };
};

// Define a new graph
const workflow = new StateGraph(GraphState)
  .addNode("agent", agentNode)
  .addNode("tools", toolNode)
  .addNode("reflect", reflectionNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", shouldContinue)
  .addEdge("tools", "agent")
  .addEdge("reflect", "agent");

const checkpointer = new MemorySaver();

// Finally, we compile it!
// This compiles it into a LangChain Runnable.
// Note that we're (optionally) passing the memory when compiling the graph
export const agent = workflow.compile({ checkpointer });
