import { z } from 'genkit';
import { ai } from '../genkit';

export const generateReflection = ai.defineFlow(
  {
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
  },
  async (input) => {
    // Log the input for debugging
    console.log('generateReflection input:', input);

    const context = [
      input.sThoughts ? `Self-defeating thoughts: ${input.sThoughts}` : '',
      input.sFantasies ? `Self-defeating fantasies: ${input.sFantasies}` : '',
      input.sBehaviors ? `Self-defeating behaviors: ${input.sBehaviors}` : '',
      input.dailyEvents && input.dailyEvents.length > 0 ? `Daily events: ${input.dailyEvents.join(', ')}` : '',
      input.feelings && input.feelings.length > 0 ? `Current feelings: ${input.feelings.join(', ')}` : '',
      input.previousReflections && input.previousReflections.length > 0 ? `Previous reflections for context: ${input.previousReflections.join('; ')}` : '',
    ].filter(Boolean).join('\n');

    const prompt = `
      Based on the following context from a daily journal entry, generate an EXTREMELY concise, punchy, one-sentence reflection (max 15 words).
      Focus on growth and self-awareness. Do not be preachy. Direct and impactful.
      
      Context:
      ${context}

      Also, extract only 1 or 2 most critical feelings.

      Reflection: 
      Suggested Feelings: [comma-separated list, max 2 items]
    `;

    const { text } = await ai.generate({ 
      prompt,
      config: { temperature: 0.5 } // Lower temperature for more focused output
    });

    const [reflectionPart, feelingsPart] = text.split('Suggested Feelings:', 2);
    
    const reflection = reflectionPart.replace('Reflection:', '').trim();
    const suggestedFeelings = feelingsPart 
      ? feelingsPart.split(',').map(f => f.trim()).filter(Boolean).slice(0, 2) // Enforce max 2 in code as well
      : undefined;

    return { reflection, suggestedFeelings };
  }
);
