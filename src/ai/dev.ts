import { dev } from '../node_modules/@genkit-ai/core';
import { firebase } from '../node_modules/@genkit-ai/firebase';
import { geminiPro } from '../node_modules/@genkit-ai/google-genai';
import { generateReflection } from './flows/generate-reflection';
import { extractFeelings } from './flows/extract-feelings';

dev({
  plugins: [
    firebase(),
    geminiPro(),
  ],
  flows: {
    generateReflection,
    extractFeelings,
  },
});
