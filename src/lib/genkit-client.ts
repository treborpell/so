import { z } from 'zod';

const GENKIT_API_BASE_URL = process.env.NEXT_PUBLIC_GENKIT_API_BASE_URL || "http://localhost:3400/api/v1alpha";

interface FlowResponse<T> {
  result?: T;
  error?: { message: string; code: string };
}

export async function callFlow<Input, Output>(flowName: string, input: Input): Promise<FlowResponse<Output>> {
  try {
    const response = await fetch(`${GENKIT_API_BASE_URL}/flows/${flowName}:run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`Genkit flow [${flowName}] failed:`, data);
      return { error: { message: data.message || "Unknown Genkit error", code: data.code || "GENKIT_ERROR" } };
    }

    return { result: data.result as Output };
  } catch (error: any) {
    console.error(`Error calling Genkit flow [${flowName}]:`, error);
    return { error: { message: error.message, code: "NETWORK_ERROR" } };
  }
}
