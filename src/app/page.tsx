"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "ai/react";
import { FileIcon, ImageIcon, Loader2Icon } from "lucide-react";
import { FormEvent, useRef, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Component() {
  const [files, setFiles] = useState<FileList | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [intermediateStepsLoading, setIntermediateStepsLoading] =
    useState(false);

  const [sourcesForMessages, setSourcesForMessages] = useState<
    Record<string, any>
  >({});

  const {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
  } = useChat({
    api: "api/process-exam",
    // onResponse(response) {
    //   const sourcesHeader = response.headers.get("x-sources");
    //   const sources = sourcesHeader
    //     ? JSON.parse(Buffer.from(sourcesHeader, "base64").toString("utf8"))
    //     : [];
    //   const messageIndexHeader = response.headers.get("x-message-index");
    //   if (sources.length && messageIndexHeader !== null) {
    //     setSourcesForMessages({
    //       ...sourcesForMessages,
    //       [messageIndexHeader]: sources,
    //     });
    //   }
    // },
    streamProtocol: "text",
    onError: (e) => {
      toast(e.message, {
        theme: "dark",
      });
    },
  });

  async function sendMessage(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // if (!messages.length) {
    //   await new Promise((resolve) => setTimeout(resolve, 300));
    // }
    // if (isLoading ?? intermediateStepsLoading) {
    //   return;
    // }
    handleSubmit(undefined, {
      allowEmptySubmit: true,
      experimental_attachments: files,
    });
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>AI Exam Solver</CardTitle>
        <CardDescription>
          Upload a PDF or image of your exam paper to get Python solutions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full pr-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`mb-4 ${
                m.role === "user" ? "text-right" : "text-left"
              }`}
            >
              <div
                className={`inline-block p-2 rounded-lg ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-center">
              <Loader2Icon className="animate-spin" />
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <form
          onSubmit={sendMessage}
          className="w-full flex items-center space-x-2"
        >
          <input
            type="file"
            accept=".pdf,image/*"
            onChange={(event) => {
              if (event.target.files) {
                setFiles(event.target.files);
              }
            }}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="flex-1">
            <div className="flex items-center justify-center w-full p-2 border-2 border-dashed rounded-md cursor-pointer hover:border-primary">
              {files && files.length > 0 ? (
                <span className="flex items-center">
                  {files[0].type.startsWith("image/") ? (
                    <ImageIcon className="mr-2" />
                  ) : (
                    <FileIcon className="mr-2" />
                  )}
                  {files[0].name}
                </span>
              ) : (
                <span>Choose PDF or Image</span>
              )}
            </div>
          </label>
          <Button type="submit" disabled={!files?.length || isLoading}>
            {isLoading ? <Loader2Icon className="animate-spin" /> : "Upload"}
          </Button>
        </form>
      </CardFooter>
      <ToastContainer />
    </Card>
  );
}
