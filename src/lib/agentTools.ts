import { tool } from "@langchain/core/tools";
import { z } from "zod";
export const executePythonCode = tool(
  async (input) => {
    const res = await fetch(`${process.env.PYTHON_SERVER}/exec`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
      .then(async (r) => (await r.json()) as { result: string })
      .catch((err) => err);
    return res;
  },
  {
    name: "execute_python_code",
    description:
      "Executes the provided Python code and returns the output (console output, ie. print statements). Call this tool to find out the output of a Python code but make sure that the ouput will be displayed in console.",
    schema: z.object({
      code: z.string().describe("The Python code to execute."),
    }),
    // responseFormat: z.object({
    //   result: z.string().describe("The output of the Python code."),
    // }),
  }
);
