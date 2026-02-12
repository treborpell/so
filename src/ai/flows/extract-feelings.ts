import { z } from 'genkit';
import { ai } from '../genkit';

export const extractFeelings = ai.defineFlow(
  {
    name: 'extractFeelings',
    inputSchema: z.object({
      text: z.string().describe('The text from which to extract feelings.'),
    }),
    outputSchema: z.object({
      feelings: z.array(z.string()).optional(),
    }),
  },
  async (input) => {
    console.log('extractFeelings input:', input);

    const prompt = `
      Analyze the following text and extract a concise list of up to 5 distinct feelings or emotions present or implied in the text. 
      Return only the comma-separated list of feelings. If no clear feelings are detected, return an empty string or an empty array.
      
      Text: """${input.text}"""
      
      Feelings:
    `;

    const { text } = await ai.generate({ 
      prompt,
      config: { temperature: 0.2 } 
    });

    const feelings = text ? text.trim().split(',').map(f => f.trim()).filter(Boolean) : [];

    return { feelings };
  }
);
