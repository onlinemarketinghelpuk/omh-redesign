import type { ReactNode } from "react";
import "./voice-styles";

// Loads the voice agent stylesheets for every page under /ai-voice-agents (see ./voice-styles.ts).
export default function AiVoiceAgentsLayout({ children }: { children: ReactNode }) {
  return children;
}
