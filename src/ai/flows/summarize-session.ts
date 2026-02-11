
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
  prompt: `You are an AI assistant for a user tracking their progress in an "SO Program."

  Analyze the following ledger entry and session notes:
  {{sessionDetails}}

  Provide:
  1. A "Clinical Synthesis": A bold, concise summary of the session's core breakthrough or theme.
  2. "Focus Areas": Specific items for the user to work on before the next session.

  If the notes are too sparse to provide a meaningful synthesis, set isValidSummary to false.
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
