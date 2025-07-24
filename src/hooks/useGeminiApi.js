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
      console.log('fetchGeminiList: prompt', fullPrompt);
      console.log('fetchGeminiList: schema', schema);
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      });
      console.log('fetchGeminiList: raw response', response);
      const text = response.text;
      let json;
      try {
        json = JSON.parse(text.trim());
      } catch (e) {
        console.error('fetchGeminiList: Gemini response was not valid JSON.', text);
        setError('Gemini response was not valid JSON.');
        setLoading(false);
        return null;
      }
      setLoading(false);
      console.log('fetchGeminiList: parsed JSON', json);
      return json;
    } catch (err) {
      console.error('fetchGeminiList: Failed to fetch Gemini API.', err);
      setError('Failed to fetch Gemini API.');
      setLoading(false);
      return null;
    }
  }

  return { fetchGeminiList, loading, error };
}
