import { defineFlow, generate } from '../node_modules/@genkit-ai/flow';
import { geminiPro } from '../node_modules/@genkit-ai/google-genai';
import { z } from 'zod';

export const generateReflection = defineFlow({
  name: 'generateReflection',
  inputSchema: z.object({
    previousReflections: z.array(z.string()).optional(),
    sThoughts: z.string().optional(),
    sFantasies: z.string().optional(),
    sBehaviors: z.string().optional(),
    dailyEvents: z.array(z.string()).optional(),
    feelings: z.array(z.string()).optional(),
  }),
  outputSchema: z.object({
    reflection: z.string(),
    suggestedFeelings: z.array(z.string()).optional(),
  }),
  // This is where you would deploy to Firebase Cloud Functions for production
  // https://firebase.google.com/docs/genkit/deploy-web
}).before(async (input) => {
  // Log the input for debugging
  console.log('generateReflection input:', input);
}).do(async ({ input }) => {
  const context = [
    input.sThoughts ? `Self-defeating thoughts: ${input.sThoughts}` : '',
    input.sFantasies ? `Self-defeating fantasies: ${input.sFantasies}` : '',
    input.sBehaviors ? `Self-defeating behaviors: ${input.sBehaviors}` : '',
    input.dailyEvents && input.dailyEvents.length > 0 ? `Daily events: ${input.dailyEvents.join(', ')}` : '',
    input.feelings && input.feelings.length > 0 ? `Current feelings: ${input.feelings.join(', ')}` : '',
    input.previousReflections && input.previousReflections.length > 0 ? `Previous reflections for context: ${input.previousReflections.join('; ')}` : '',
  ].filter(Boolean).join('\n');

  const prompt = `
    Based on the following context from a daily journal entry, generate a concise yet insightful and supportive reflection. 
    Focus on growth, self-awareness, and constructive processing. Do not be overly clinical or preachy. Keep it to 2-3 sentences.
    
    Context:
    ${context}

    Also, from the generated reflection, extract a list of up to 5 key feelings that are present or implied.

    Reflection: 
    Suggested Feelings: [comma-separated list]
  `;

  const llmResponse = await generate({ 
    model: geminiPro, 
    prompt,
    config: { temperature: 0.7 }
  });

  const responseText = llmResponse.text();
  const [reflectionPart, feelingsPart] = responseText.split('Suggested Feelings:', 2);
  
  const reflection = reflectionPart.replace('Reflection:', '').trim();
  const suggestedFeelings = feelingsPart 
    ? feelingsPart.split(',').map(f => f.trim()).filter(Boolean) 
    : undefined;

  return { reflection, suggestedFeelings };
});
