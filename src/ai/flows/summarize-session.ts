// Summarize key discussion points and action items from group therapy sessions.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeSessionInputSchema = z.object({
  sessionDetails: z
    .string()
    .describe('Details of the therapy session, including discussion points and notes.'),
});

export type SummarizeSessionInput = z.infer<typeof SummarizeSessionInputSchema>;

const SummarizeSessionOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the key discussion points from the therapy session.'),
  actionItems: z.string().describe('A list of action items identified during the therapy session.'),
  isValidSummary: z.boolean().describe('Whether the session details are sufficient for a valid summary.'),
});

export type SummarizeSessionOutput = z.infer<typeof SummarizeSessionOutputSchema>;

export async function summarizeSession(input: SummarizeSessionInput): Promise<SummarizeSessionOutput> {
  return summarizeSessionFlow(input);
}

const summarizeSessionPrompt = ai.definePrompt({
  name: 'summarizeSessionPrompt',
  input: {schema: SummarizeSessionInputSchema},
  output: {schema: SummarizeSessionOutputSchema},
  prompt: `You are an AI assistant for a therapist who leads group therapy sessions. Your goal is to summarize the sessions so the therapist can quickly review highlights and track progress.

  Analyze the session details provided below:
  {{sessionDetails}}

  Based on the details, provide a summary of the key discussion points and a list of action items.

  If the session details are insufficient to create a valid summary, set the isValidSummary output field to false.

  Otherwise, set it to true.
  `,
});

const summarizeSessionFlow = ai.defineFlow(
  {
    name: 'summarizeSessionFlow',
    inputSchema: SummarizeSessionInputSchema,
    outputSchema: SummarizeSessionOutputSchema,
  },
  async input => {
    const {output} = await summarizeSessionPrompt(input);
    return output!;
  }
);
