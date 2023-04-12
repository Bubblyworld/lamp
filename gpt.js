import axios, { AxiosError } from 'axios';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const apiKey = process.env.OPENAI_API_KEY;
const apiUrl = 'https://api.openai.com/v1/chat/completions';
const apiHeaders = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${apiKey}`,
};

const initialPrompt = await fs.readFile(
  fileURLToPath(new URL('./prompt.md', import.meta.url)),
  { encoding: 'utf8' },
);

export async function ask(question, model = 'gpt-4', conversation = null) {
  if (!conversation) {
    conversation = [{ role: 'system', content: initialPrompt }];
  }
  conversation.push({
    role: 'user',
    content: question,
  });

  try {
    const data = {
      model,
      stop: 'END_OF_MESSAGE',
      messages: conversation,
    };
    const res = await axios.post(apiUrl, data, { headers: apiHeaders });

    const msg = res.data.choices[0].message.content;
    if (msg === null || msg === undefined) {
      throw new Error(
        `Expected response from OpenAI, but got null message instead: ${JSON.stringify(
          res.data.choices[0],
          null,
          2,
        )}`,
      );
    }

    conversation.push({
      role: 'assistant',
      content: msg,
    });

    return {
      msg,
      conversation,
    };
  } catch (err) {
    if (err instanceof AxiosError) {
      const data = err.response?.data ?? {};
      throw new Error(
        `Invalid request posted to ${apiUrl}: ${data.error.message ?? ''}`,
        { cause: err },
      );
    }

    throw new Error(`Internal error posting to ${apiUrl}`, {
      cause: err,
    });
  }
}
