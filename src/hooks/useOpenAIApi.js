// useOpenAIApi.js
import { useState } from 'react';

export function useOpenAIApi() {
  const [loading, setLoading] = useState(false);

  async function fetchOpenAIList(prompt, schema) {
    setLoading(true);
    try {
      const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
      const model = process.env.REACT_APP_OPENAI_MODEL || 'gpt-3.5-turbo';
      const url = 'https://api.openai.com/v1/chat/completions';
      const messages = [
        { role: 'system', content: 'You are a helpful assistant that only responds with valid JSON.' },
        { role: 'user', content: prompt }
      ];
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.2,
          max_tokens: 1200,
          response_format: { type: 'json_object' }
        })
      });
      const data = await response.json();
      let content = data.choices?.[0]?.message?.content?.trim();
      // Try to parse JSON
      try {
        if (content.startsWith('```json')) {
          content = content.replace(/^```json|```$/g, '').trim();
        } else if (content.startsWith('```')) {
          content = content.replace(/^```|```$/g, '').trim();
        }
        return JSON.parse(content);
      } catch (err) {
        console.error('OpenAI response was not valid JSON:', content);
        return null;
      }
    } catch (error) {
      console.error('OpenAI API error:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { fetchOpenAIList, loading };
}
