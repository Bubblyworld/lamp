#!/usr/bin/env node
import cac from 'cac';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import ask from './gpt.js';

const dataDir = path.join(os.homedir(), '.h-data');
const latestDir = path.join(dataDir, 'latest.json');

async function init() {
  try {
    await fs.mkdir(dataDir);
  } catch (err) {
    if (err.code === 'EEXIST') {
      return; // great
    }

    throw err;
  }
}

const cli = cac('h');

cli
  .command('', 'Query GPT from the terminal')
  .option('-m, --model <model>', 'Which GPT model to use', { default: 'gpt-4' })
  .option('-p, --prompt [prompt]', 'The prompt to send GPT')
  .option('-c, --continue', 'Continue from the last conversation')
  .action(async options => {
    try {
      await init();
    } catch (err) {
      bomb(err);
    }

    if (options.continue) {
    }

    if (!options.prompt) {
      try {
        options.prompt = await openEditor();
      } catch (err) {
        bomb(err);
      }
    }

    console.log(await ask(options.prompt, options.model));
  });

cli.help();
cli.parse();

async function openEditor() {
  return new Promise((resolve, reject) => {
    const editor = process.env.EDITOR || 'vi';
    const tmpFile = getTempFilePath('');

    fs.writeFile(tmpFile, 'Replace this file with your prompt.').then(() => {
      const child = spawn(editor, [tmpFile], {
        stdio: 'inherit',
      });

      child.on('exit', code => {
        (async () => {
          if (code === 0) {
            const prompt = await fs.readFile(tmpFile, 'utf-8');
            const newPath = getTempFilePath(prompt);
            await fs.rename(tmpFile, newPath);

            console.log(`Saving prompt to: ${newPath}`);
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

function bomb(err) {
  console.error(err.message);
  process.exit(1);
}
