// useGeminiApi.js
// Hook for communicating with Google Gemini API and enforcing strict JSON output

import { useState } from 'react';
import { GoogleGenAI } from '@google/genai';

export function useGeminiApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  const modelName = process.env.REACT_APP_GOOGLE_MODEL_NAME || 'gemini-pro';
  const ai = new GoogleGenAI({ apiKey });

  // prompt: string, schema: {description, exampleJSON}
  async function fetchGeminiList(prompt, schema) {
    setLoading(true);
    setError(null);
    try {
      const fullPrompt = `${prompt}\n\nRespond ONLY in strict JSON format as follows:\n${schema.description}\nExample:\n${JSON.stringify(schema.exampleJSON, null, 2)}`;
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      });
      const text = response.text;
      let json;
      try {
        json = JSON.parse(text);
      } catch (e) {
        setError('Gemini response was not valid JSON.');
        setLoading(false);
        return null;
      }
      setLoading(false);
      return json;
    } catch (err) {
      setError('Failed to fetch Gemini API.');
      setLoading(false);
      return null;
    }
  }

  return { fetchGeminiList, loading, error };
}
