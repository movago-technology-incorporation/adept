// Short question form (/ask?from=…): heading and topic depend on the page the visitor came from.
export const ASK_TOPICS: Record<string, { topic: string; title: string; back: string }> = {
  "/tax/individual": { topic: "Personal tax returns", title: "Ask about your personal tax return", back: "Personal tax returns" },
  "/tax/sole-proprietor": { topic: "Sole proprietor tax returns", title: "Ask about self-employed taxes", back: "Sole proprietor tax returns" },
  "/tax/corporation": { topic: "Corporate tax returns", title: "Ask about your corporate tax return", back: "Corporate tax returns" },
  "/tax/planning": { topic: "Tax planning", title: "Ask about tax planning", back: "Tax planning" },
  "/tax": { topic: "Tax services", title: "Ask about our tax services", back: "Tax services" },
};

export const askTopic = (from?: string | null) =>
  (from && ASK_TOPICS[from]) || { topic: "General question", title: "Ask us a question", back: "" };
