#!/usr/bin/env node
import cac from 'cac';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import pico from 'picocolors';
import { fileURLToPath } from 'url';
import { ask } from './gpt.js';
import readline from 'readline';

const dataDir = path.join(os.homedir(), '.h-data');
const latestFile = path.join(dataDir, 'latest.json');
const credsFile = path.join(dataDir, 'creds.txt');
const defaultPrompt = 'Replace this file with your prompt.';
const validModels = [
  'gpt-4',
  'gpt-4-0314',
  'gpt-4-32k',
  'gpt-4-32k-0314',
  'gpt-3.5-turbo',
  'gpt-3.5-turbo-0301',
];

let apiKey = process.env.OPENAI_API_KEY;

async function init() {
  try {
    await fs.mkdir(dataDir);
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }

  try {
    await fs.readFile(latestFile);
  } catch (err) {
    if (err.code === 'ENOENT') {
      await fs.writeFile(latestFile, ''); // touch it
    }
    throw err;
  }

  if (!apiKey) {
    try {
      apiKey = (await fs.readFile(credsFile, { encoding: 'utf-8' })).trim();
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }

    if (!apiKey) {
      console.error(
        `Unable to find a configured OpenAI API key. Either provide an API key via the OPENAI_API_KEY environment variable, or paste it into the credentials file '${credsFile}'.`,
      );
      process.exit(1);
    }
  }
}

const cli = cac(pico.green(pico.bold('lamp')));

cli
  .version(await version())
  .help(sections => {
    return sections
      .filter(section => section.title !== 'Commands')
      .filter(
        section => !(section.title && section.title.startsWith('For more')),
      )
      .map(section => {
        if (section.title) {
          section.title = pico.bold(section.title);
        }
        return section;
      });
  })
  .command('')
  .usage(
    `[...flags]

${pico.green(pico.bold('La'))}nguage ${pico.green(
      pico.bold('M'),
    )}odel ${pico.green(pico.bold('P'))}rompter.

Query GPT models from the safety of your terminal. Unix-friendly for use
within bash pipelines. Supports continuous conversation, like the OpenAI
interface, but with the benefit of being able to switch model at will.

Input will be taken from stdin by default, unless the '-p' or '-e' flags
are given. The model's response will be written to stdout.`,
  )
  .option('-m, --model <model>', 'Which GPT model to use', {
    default: 'gpt-3.5-turbo',
  })
  .option('-p, --prompt <prompt>', 'Pass a prompt to the GPT model')
  .option('-e, --edit', 'Edit a prompt for the GPT model')
  .option('-c, --continue', 'Continue from the last message')
  .action(async options => {
    try {
      if (!validModels.includes(options.model)) {
        const formattedModels = validModels.map(m => `  ${m}`).join('\n');
        throw new Error(
          `Model '${options.model}' does not exist, choose one from:\n${formattedModels}`,
        );
      }

      await init();

      let conversation;
      if (options.continue) {
        const data = await fs.readFile(latestFile, { encoding: 'utf-8' });
        if (data) {
          try {
            conversation = JSON.parse(data);
          } catch (err) {
            throw new Error(
              `Expected file "${latestFile}" to contain a JSON-encoded conversation with GPT.`,
              { cause: err },
            );
          }
        }
      }

      if (!options.prompt) {
        if (options.edit) {
          options.prompt = await openEditor();
        } else {
          let lines = [];
          await new Promise(resolve => {
            const input = readline.createInterface(process.stdin);
            input.on('line', line => lines.push(line));
            input.on('close', () => resolve(lines));
          });
          options.prompt = lines.join('\n');
        }
      }

      const data = await ask(
        options.prompt,
        apiKey,
        options.model,
        conversation,
      );
      console.log(data.msg.trim());

      await fs.writeFile(
        latestFile,
        JSON.stringify(data.conversation, null, 2),
        { encoding: 'utf-8' },
      );
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  });

cli.parse();

async function openEditor() {
  return new Promise((resolve, reject) => {
    const editor = process.env.EDITOR || 'vi';
    const tmpFile = getTempFilePath('tmp');

    fs.writeFile(tmpFile, defaultPrompt).then(() => {
      const child = spawn(editor, [tmpFile], {
        stdio: 'inherit',
      });

      child.on('exit', code => {
        (async () => {
          if (code === 0) {
            const prompt = await fs.readFile(tmpFile, 'utf-8');
            if (prompt === defaultPrompt) {
              reject(
                new Error('Stopping as the default prompt was not changed.'),
              );
            }

            const newPath = getTempFilePath(prompt);
            await fs.rename(tmpFile, newPath);

            resolve(prompt);
          } else {
            reject(new Error(`Editor exited with code: ${code}`));
          }
        })();
      });
    });
  });
}

function sanitizeFileName(input) {
  return input.replace(/[/\\?%*:|"<>]/g, '#').toLowerCase();
}

function getTempFilePath(prompt) {
  const date = new Date();
  const timestamp = date.toISOString().replace(/[:.]/g, '-');
  const words = prompt
    .split(/\s+/)
    .slice(0, 5)
    .map(sanitizeFileName)
    .map(w => w.toLowerCase())
    .join('-');

  return path.join(dataDir, `prompt_${timestamp}_${words}.txt`);
}

async function version() {
  const pjson = await fs.readFile(
    fileURLToPath(new URL('./package.json', import.meta.url)),
  );
  return JSON.parse(pjson).version;
}
