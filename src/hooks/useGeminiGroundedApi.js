// useGeminiGroundedApi.js
// Hook for communicating with Google Gemini API using Google Search grounding

import { useState } from 'react';
import { GoogleGenAI } from '@google/genai';

export function useGeminiGroundedApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  const modelName = process.env.REACT_APP_GOOGLE_MODEL_NAME || 'gemini-pro';
  const ai = new GoogleGenAI({ apiKey });
  const groundingTool = { googleSearch: {} };

  // prompt: string, schema: {description, exampleJSON}
  async function fetchGeminiGroundedList(prompt, schema) {
    setLoading(true);
    setError(null);
    try {
      const fullPrompt = `${prompt}\n\nRespond ONLY in strict JSON format as follows:\n${schema.description}\nExample:\n${JSON.stringify(schema.exampleJSON, null, 2)}`;
      console.log('fetchGeminiGroundedList: prompt', fullPrompt);
      console.log('fetchGeminiGroundedList: schema', schema);
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
        config: { tools: [groundingTool] },
      });
      console.log('fetchGeminiGroundedList: raw response', response);
      const cand = response.candidates?.[0];
      let text = cand?.content?.text;
      if (!text && Array.isArray(cand?.content?.parts) && cand.content.parts[0]?.text) {
        text = cand.content.parts[0].text;
      }
      if (!text) {
        console.error('fetchGeminiGroundedList: Gemini response missing text field.', cand);
        setError('Gemini response missing text field.');
        setLoading(false);
        return { json: null, links: [] };
      }
      text = text.trim();
      // Remove markdown code block if present
      if (text.startsWith('```json')) {
        text = text.replace(/^```json|```$/g, '').trim();
      } else if (text.startsWith('```')) {
        text = text.replace(/^```|```$/g, '').trim();
      }
      let json;
      try {
        json = JSON.parse(text);
      } catch (e) {
        console.error('fetchGeminiGroundedList: Gemini response was not valid JSON.', text);
        setError('Gemini response was not valid JSON.');
        setLoading(false);
        return { json: null, links: [] };
      }
      setLoading(false);
      console.log('fetchGeminiGroundedList: parsed JSON', json);
      // Extract links from groundingMetadata
      let links = cand.groundingMetadata?.groundingChunks?.map(c => c.web) || [];
      // If no links found, try to extract from renderedContent HTML
      if ((!links || links.length === 0) && cand.groundingMetadata?.searchEntryPoint?.renderedContent) {
        const html = cand.groundingMetadata.searchEntryPoint.renderedContent;
        // Simple regex to extract <a class="chip" href="...">text</a>
        const regex = /<a[^>]*class=["']chip["'][^>]*href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/g;
        let match;
        links = [];
        while ((match = regex.exec(html)) !== null) {
          links.push({ uri: match[1], title: match[2] });
        }
      }
      console.log('fetchGeminiGroundedList: extracted links', links);
      // Always include links as part of the returned JSON object
      const result = { ...json, _groundingLinks: links };
      return { json: result, links };
    } catch (err) {
      console.error('fetchGeminiGroundedList: Failed to fetch Gemini API.', err);
      setError('Failed to fetch Gemini API.');
      setLoading(false);
      return { json: null, links: [] };
    }
  }

  return { fetchGeminiGroundedList, loading, error };
}
