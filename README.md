# LaMP

**La**nguage **M**odel **P**rompter.

Query GPT models from the safety of your terminal. Unix-friendly for use 
within bash pipelines. Supports continuous conversation, like the OpenAI 
interface, but with the benefit of being able to switch model at will.

```
lamp/1.0.0

Usage:
  $ lamp [...flags]

Input will be taken from stdin by default, unless the '-p' or '-e' flags
are given. The model's response will be written to stdout.

Options:
  -m, --model <model>    Which GPT model to use (default: gpt-3.5-turbo)
  -p, --prompt <prompt>  Pass a prompt to the GPT model
  -e, --edit             Edit a prompt for the GPT model
  -c, --continue         Continue from the last message
  -v, --version          Display version number
  -h, --help             Display this message
```

## Installation

`npm install -g lamp`

## Configuration

`export OPENAI_API_KEY=your_api_key_here`

or

```
echo "your_api_key_here" > ~/.lamp-data/creds.txt
```

## Usage

The model's response will always be printed to `stdout`, with no embellishment, making `lamp` suitable for unix-style piping. Prompts are read from `stdin` by default:

```bash
$ echo "Write me a poem about crows." > prompt.txt
$ cat prompt.txt | lamp
Crows in the sky,
Dark as the night.
Silent they fly,
In endless flight.
```

Prompts can be given directly as an argument with the `-p/--prompt` flag, and you can bring up your configured `EDITOR` to write a prompt with the `-e/--edit` flag. To change the model from the default of `gpt-3.5-turbo`, you can use the `-m/--model` flag:

```bash
$ lamp -m gpt-4 -p "Write me a poem about crows."
In twilight skies, the crows emerge,
Their shadows dance, as darkness surge,
They caw and gather, velvet wing,
A murder's wary offering.
```

To continue a conversation, simply call `lamp` again with the `-c/--continue` flag enabled. This has the same behaviour as a once-off call, but the current conversation will be passed to GPT along with the prompt for context.

```bash
$ lamp -m gpt-4 -p "Write me a javascript function that lists all of the primes between 1 and n."
function listPrimes(n) {
  const primes = [];
  for (let i = 2; i <= n; i++) {
    let isPrime = true;
    for (let j = 2; j * j <= i; j++) {
      if (i % j === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) {
      primes.push(i);
    }
  }
  return primes;
}

$ lamp -c -p "Now modify it to return the primes in reverse order."
function listReversedPrimes(n) {
  const primes = [];
  for (let i = 2; i <= n; i++) {
    let isPrime = true;
    for (let j = 2; j * j <= i; j++) {
      if (i % j === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) {
      primes.push(i);
    }
  }
  return primes.reverse();
}
```

Note that in this last example, the first response was generated using `gpt-4`, but the second response was generated with the default `gpt-3.5-turbo` model. You can switch models mid-conversation whenever you like.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgement

Based on some funny article I read on Hacker News about using and abusing LLMs at the command line. I can't remember the link, and couldn't find it, so if you know what I'm talking about let me know.
