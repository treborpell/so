import { defineFlow, generate } from '../node_modules/@genkit-ai/flow';
import { geminiPro } from '../node_modules/@genkit-ai/google-genai';
import { z } from 'zod';

export const extractFeelings = defineFlow({
  name: 'extractFeelings',
  inputSchema: z.object({
    text: z.string().describe('The text from which to extract feelings.'),
  }),
  outputSchema: z.object({
    feelings: z.array(z.string()).optional(),
  }),
  // This is where you would deploy to Firebase Cloud Functions for production
  // https://firebase.google.com/docs/genkit/deploy-web
}).before(async (input) => {
  // Log the input for debugging
  console.log('extractFeelings input:', input);
}).do(async ({ input }) => {
  const prompt = `
    Analyze the following text and extract a concise list of up to 5 distinct feelings or emotions present or implied in the text. 
    Return only the comma-separated list of feelings. If no clear feelings are detected, return an empty string or an empty array.
    
    Text: """${input.text}"""
    
    Feelings:
  `;

  const llmResponse = await generate({ 
    model: geminiPro, 
    prompt,
    config: { temperature: 0.2 } 
  });

  const responseText = llmResponse.text().trim();
  const feelings = responseText ? responseText.split(',').map(f => f.trim()).filter(Boolean) : [];

  return { feelings };
});
