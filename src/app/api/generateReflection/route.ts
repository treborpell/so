import { generateReflectionFlow } from "@/ai/dev";
import { appRoute } from "@genkit-ai/next";

export const POST = appRoute(generateReflectionFlow);
