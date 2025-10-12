// Minimal, safe "LLM" for local/dev use.
// - If you pass a response_json_schema with a "recommendations" array,
//   it returns 3 mock recommendations.
// - Otherwise it just echoes your prompt as text.

export type InvokeLLMArgs = {
  prompt: string;
  response_json_schema?: any; // keep loose so you don't fight TS while iterating
  model?: string;
  temperature?: number;
  max_tokens?: number;
};

export type Recommendation = {
  title: string;
  description: string;
  type: string;        // e.g., "project" | "event" | "connection"
  match_score: number; // 0..1
  reason: string;
};

export type InvokeLLMResult = {
  text?: string;
  recommendations?: Recommendation[];
  // allow extra keys so your UI can evolve without type errors
  [key: string]: any;
};

const MOCK_RECOMMENDATIONS: Recommendation[] = [
  {
    title: "Pair on AI Matchmaker",
    description: "Help ship the recommendations service and write tests.",
    type: "project",
    match_score: 0.92,
    reason: "Your tags include AI and web.",
  },
  {
    title: "Speak at AI/ML Summit Lightning Talks",
    description: "Share your experience with model tooling.",
    type: "event",
    match_score: 0.87,
    reason: "You’ve attended AI events and built ML tools.",
  },
  {
    title: "Contribute to DesignForge",
    description: "Add new UI tokens and a Button variant.",
    type: "project",
    match_score: 0.8,
    reason: "You use Tailwind/shadcn in your projects.",
  },
  {
    title: "Join FinTech Builders Meetup",
    description: "Discuss APIs, compliance, and risk in modern fintech.",
    type: "event",
    match_score: 0.78,
    reason: "You follow fintech and backend topics.",
  },
  {
    title: "Open a PR on SecureVault",
    description: "Implement hardware key support and tests.",
    type: "project",
    match_score: 0.83,
    reason: "You’ve starred security projects and use WebCrypto.",
  },
];

function pickN<T>(arr: T[], n: number): T[] {
  // deterministic-ish slice so UI is stable across renders
  return arr.slice(0, Math.max(0, Math.min(n, arr.length)));
}

export async function InvokeLLM(args: InvokeLLMArgs): Promise<InvokeLLMResult> {
  const { prompt, response_json_schema } = args || {};

  // If caller asked for recommendations in the schema, return mock recs.
  const wantsRecs =
    response_json_schema &&
    response_json_schema.properties &&
    response_json_schema.properties.recommendations &&
    response_json_schema.properties.recommendations.type === "array";

  if (wantsRecs) {
    return {
      recommendations: pickN(MOCK_RECOMMENDATIONS, 3),
    };
  }

  // Default: echo back some text so the UI has something to show.
  return {
    text: `Echo: ${String(prompt ?? "").slice(0, 500)}`,
  };
}
