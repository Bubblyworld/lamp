import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const apiUrl = 'https://api.openai.com/v1/chat/completions';

const initialPrompt = await fs.readFile(
  fileURLToPath(new URL('./prompt.md', import.meta.url)),
  { encoding: 'utf8' },
);

export async function ask(
  question,
  apiKey,
  model = 'gpt-4',
  conversation = null,
) {
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
    const apiHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    };
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: apiHeaders,
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error(
        `Network response was not ok: (${res.status}) ${res.statusText}`,
      );
    }

    const resData = await res.json();
    const msg = resData.choices[0].message.content;
    if (msg === null || msg === undefined) {
      throw new Error(
        `Expected response from OpenAI, but got null message instead: ${JSON.stringify(
          resData.choices[0],
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
    if (err instanceof TypeError) {
      throw new Error(`Post to ${apiUrl} failed.`, { cause: err.cause });
    }

    throw new Error(`Internal error posting to ${apiUrl}`, {
      cause: err,
    });
  }
}
