import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: "AIzaSyBA-NXbq_d7oWnQHsTWHJ_NtMvl6mkthdg" }),
  ],
  model: 'googleai/gemini-2.5-flash',
});
