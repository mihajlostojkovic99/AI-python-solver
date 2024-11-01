import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatQuestion } from "@/lib/questionMarkdown";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

SyntaxHighlighter.supportedLanguages.push(python);

const AnalysisResult: React.FC<{
  answers: Array<{
    questionText: string;
    questionNumber: number;
    type: string;
    parameters: string[] | null;
    code?: string;
    formattedCode?: string;
    executionResult: string;
    executionSuccess: boolean;
    explanation: string;
  }>;
}> = ({ answers }) => {
  return (
    <>
      <h2 className="text-lg font-semibold mb-4">Analysis Results</h2>
      <div className="prose dark:prose-invert max-w-none">
        <Tabs defaultValue="Zadatak 3" className="w-full">
          <TabsList className="w-full">
            {answers &&
              answers.map((answer) => (
                <TabsTrigger
                  key={answer.questionNumber}
                  value={`Zadatak ${answer.questionNumber}`}
                  className="w-1/3"
                >
                  Zadatak {answer.questionNumber}.
                </TabsTrigger>
              ))}
          </TabsList>
          {answers &&
            answers.map((answer) => (
              <TabsContent
                key={answer.questionNumber}
                value={`Zadatak ${answer.questionNumber}`}
              >
                <ReactMarkdown
                  components={{
                    code({ node, className, children, ref, style, ...props }) {
                      const match = /language-(\w+)/.exec(className || "");
                      return match ? (
                        <SyntaxHighlighter
                          style={oneLight}
                          customStyle={{
                            lineHeight: "1.5",
                            fontSize: "0.85em",
                          }}
                          codeTagProps={{
                            style: {
                              lineHeight: "inherit",
                              fontSize: "inherit",
                            },
                          }}
                          language="python"
                          PreTag="div"
                          showLineNumbers
                          {...props}
                        >
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      ) : (
                        <code
                          className="relative rounded bg-[#e4e4e7] px-[0.3rem] py-[0.2rem] font-mono text-sm text-[#383a42]"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {formatQuestion(answer)}
                </ReactMarkdown>
              </TabsContent>
            ))}
        </Tabs>
      </div>
    </>
  );
};

export default AnalysisResult;
