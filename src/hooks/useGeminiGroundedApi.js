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
  async function fetchGeminiGroundedList(prompt, schema, maxRetries = 2) {
    setLoading(true);
    setError(null);
    let attempt = 0;
    let links = [];
    let json = null;
    let cand = null;
    let text = null;
    let response = null;
    let lastError = null;
    while (attempt <= maxRetries) {
      try {
        const fullPrompt = `${prompt}\n\nRespond ONLY in strict JSON format as follows:\n${schema.description}\nExample:\n${JSON.stringify(schema.exampleJSON, null, 2)}`;
        console.log('fetchGeminiGroundedList: prompt', fullPrompt);
        console.log('fetchGeminiGroundedList: schema', schema);
        response = await ai.models.generateContent({
          model: modelName,
          contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
          config: { tools: [groundingTool] },
        });
        console.log('fetchGeminiGroundedList: raw response', response);
        cand = response.candidates?.[0];
        text = cand?.content?.text;
        if (!text && Array.isArray(cand?.content?.parts) && cand.content.parts[0]?.text) {
          text = cand.content.parts[0].text;
        }
        if (!text) {
          throw new Error('Gemini response missing text field.');
        }
        text = text.trim();
        // Remove markdown code block if present
        if (text.startsWith('```json')) {
          text = text.replace(/^```json|```$/g, '').trim();
        } else if (text.startsWith('```')) {
          text = text.replace(/^```|```$/g, '').trim();
        }
        try {
          json = JSON.parse(text);
        } catch (e) {
          throw new Error('Gemini response was not valid JSON.');
        }
        // Extract links from groundingMetadata
        links = cand.groundingMetadata?.groundingChunks?.map(c => c.web) || [];
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
        if (links && links.length > 0) {
          break; // Success, got links
        }
        // If no links, retry
        attempt++;
        console.warn(`No grounding links found, retrying Gemini API (attempt ${attempt})...`);
      } catch (err) {
        lastError = err;
        attempt++;
        if (attempt > maxRetries) {
          console.error('fetchGeminiGroundedList: Failed to fetch Gemini API after retries.', err);
          setError('Failed to fetch Gemini API after retries.');
          setLoading(false);
          return { json: null, links: [] };
        }
      }
    }
    setLoading(false);
    console.log('fetchGeminiGroundedList: parsed JSON', json);
    console.log('fetchGeminiGroundedList: extracted links', links);
    // --- Post-process Gemini JSON ---
    function cleanItem(item, link) {
      // Remove bracketed citations from all string fields
      const cleanStr = str => typeof str === 'string' ? str.replace(/\s*\[\d+\]/g, '').trim() : str;
      // Convert quantity to number if possible
      let quantity = cleanStr(item.quantity);
      if (typeof quantity === 'string') {
        const num = parseFloat(quantity);
        quantity = isNaN(num) ? quantity : num;
      }
      // Convert weight to number in pounds if possible
      let weight = cleanStr(item.weight ?? item.Weight);
      if (typeof weight === 'string') {
        const match = weight.match(/([\d.]+)/);
        weight = match ? parseFloat(match[1]) : weight;
      }
      // Attach link if provided
      return {
        ...item,
        quantity,
        weight,
        link: link?.uri || undefined,
      };
    }
    let processed = json;
    if (json && Array.isArray(json.items)) {
      processed.items = json.items.map((item, idx) => cleanItem(item, links[idx]));
    } else if (Array.isArray(json)) {
      processed = json.map((item, idx) => cleanItem(item, links[idx]));
    }
    // Always include links as part of the returned JSON object
    const result = { ...processed, _groundingLinks: links };
    return { json: result, links };
  }

  return { fetchGeminiGroundedList, loading, error };
}
