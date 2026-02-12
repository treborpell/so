import { z } from 'genkit'; 

const GENKIT_API_BASE_URL = process.env.NEXT_PUBLIC_GENKIT_API_BASE_URL || "/api";

interface FlowResponse<T> {
  result?: T;
  error?: { message: string; code: string };
}

export async function callFlow<Input, Output>(flowName: string, input: Input): Promise<FlowResponse<Output>> {
  try {
    // Construct URL. appRoute exposes flow at /api/{flowName}
    // We assume GENKIT_API_BASE_URL is "/api"
    const response = await fetch(`${GENKIT_API_BASE_URL}/${flowName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Genkit's on-demand API expects input wrapped in a 'data' field
      body: JSON.stringify({ data: input }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`Genkit flow [${flowName}] failed:`, JSON.stringify(data, null, 2));
      return { error: { message: data.message || "Unknown Genkit error", code: data.code || "GENKIT_ERROR" } };
    }

    // appRoute might return the result directly or wrapped. 
    // Usually it returns the result object directly or { result: ... }
    // Let's assume standard Genkit response format: { result: ... }
    // If appRoute returns the raw output, we might need to adjust.
    // Based on docs, appRoute returns { result: output }.
    
    return { result: data.result as Output };
  } catch (error: any) {
    console.error(`Error calling Genkit flow [${flowName}]:`, error);
    return { error: { message: error.message, code: "NETWORK_ERROR" } };
  }
}
