export const formatQuestion = (question: {
  questionText: string;
  questionNumber: number;
  type: string;
  parameters: string[] | null;
  code?: string;
  answers: string[];
  formattedCode?: string;
  executionResult: string;
  executionSuccess: boolean;
  explanation: string;
}) => `
**Tip pitanja:** ${
  question.type === "coding" ? "Analiza koda" : "Teorijsko pitanje"
}

**Tekst zadatka:**
${question.questionText}

${
  question.parameters
    ? `**Parametri za izvrsavanje:** \n- ${question.parameters.join(", ")}`
    : ""
}

${
  question.code
    ? `**Kod:**\n\n${question.formattedCode || question.code}\n`
    : ""
}

**Rezultat izvrsavanja:** ${
  question.executionSuccess && question.executionResult
    ? `__${question.executionResult}__ -> ${
        question.answers.some((ans) => ans.includes(question.executionResult))
          ? `✅ Uspešno - Tačan odgovor je pod **${question.answers.find(
              (ans) => ans.includes(question.executionResult)
            )}**`
          : "❌ Neuspešno - Rešenje nije ponuđeno"
      }`
    : "❌ Neuspešno"
}

**Postupak:**
${question.explanation}
`;
