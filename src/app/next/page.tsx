"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatQuestion } from "@/lib/questionMarkdown";
import { mockRes } from "@/lib/tmp";
import { FileText, Loader2, Upload } from "lucide-react";
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

SyntaxHighlighter.supportedLanguages.push(python);

export default function TestAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Array<{
    questionText: string;
    questionNumber: number;
    type: string;
    parameters: string[] | null;
    code?: string;
    formattedCode?: string;
    executionResult: string;
    executionSuccess: boolean;
    explanation: string;
  }> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setError(null);
    } else {
      setFile(null);
      setError("Please upload a valid PDF file.");
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Please select a file before submitting.");
      return;
    }

    setIsLoading(true);
    setError(null);

    // Simulating file upload and processing
    try {
      const data = new FormData();
      data.append("file", file);
      // const response = await fetch("/api/process-exam", {
      //   method: "POST",
      //   body: data,
      // });
      const body: {
        response: Array<{
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
      } = mockRes;

      setAnswers(body.response);
      setResult(
        body.response
          .map((question) => formatQuestion(question))
          .join("\n-----------------------------\n")
      );
    } catch (err) {
      setError(
        "An error occurred while processing the file. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl min-h-screen flex flex-col">
      <Card className="h-full flex-grow">
        <CardHeader>
          <CardTitle>Python Test Analyzer</CardTitle>
          <CardDescription>
            Upload a PDF of a Python programming test to get AI-powered analysis
            and feedback.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="dropzone-file"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click to upload</span> or
                    drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    PDF file only
                  </p>
                </div>
                <input
                  id="dropzone-file"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf"
                />
              </label>
            </div>
            {file && (
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <FileText className="w-4 h-4" />
                <span>{file.name}</span>
              </div>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button
              onClick={handleSubmit}
              disabled={!file || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Analyze Test"
              )}
            </Button>
          </div>
          {result && (
            <div className="mt-8">
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
                            code({
                              node,
                              className,
                              children,
                              ref,
                              style,
                              ...props
                            }) {
                              const match = /language-(\w+)/.exec(
                                className || ""
                              );
                              return match ? (
                                <SyntaxHighlighter
                                  style={oneLight}
                                  language="python"
                                  PreTag="div"
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, "")}
                                </SyntaxHighlighter>
                              ) : (
                                <code className={className} {...props}>
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

                {/* <ReactMarkdown
                  components={{
                    code({ node, className, children, ref, style, ...props }) {
                      const match = /language-(\w+)/.exec(className || "");
                      return match ? (
                        <SyntaxHighlighter
                          style={oneLight}
                          language="python"
                          PreTag="div"
                          {...props}
                        >
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {result}
                </ReactMarkdown> */}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
