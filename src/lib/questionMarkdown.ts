export const formatQuestion = (question: {
  questionText: string;
  questionNumber: number;
  type: string;
  parameters: string[] | null;
  code?: string;
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
    ? `✅ Uspešno -> ${question.executionResult}`
    : "❌ Neuspešno"
}

**Postupak:**
${question.explanation}
`;
