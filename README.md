# h

Query GPT models from the safety of your terminal. Unix-friendly for use 
within bash pipelines. Supports continuous conversation, like the OpenAI 
interface, but with the benefit of being able to switch model at will.

```bash=
h/1.0.0-alpha

Usage:
  $ h [...flags]

Options:
  -m, --model <model>    Which GPT model to use (default: gpt-3.5-turbo)
  -p, --prompt <prompt>  The prompt to give to the GPT model
  -c, --continue         Continue from the last message
  -v, --version          Display version number
  -h, --help             Display this message
```

## Installation

`npm install -g h`

## Configuration

`export OPENAI_API_KEY=your_api_key_here`

or

```
echo "your_api_key_here" > ~/.h-data/creds.txt
```

## Usage

The model's response will always be printed to `stdout`, with no embellishment, making `h` suitable for unix-style piping. The prompt is read from `stdin` by default, but a file can be provided with the `-p/--prompt` flag.

To continue a conversation, simply call `h` again with the `-c/--continue` flag enabled. This has the same behaviour as a once-off call, but the current conversation will be passed to GPT along with the prompt for context.

```bash=
TODO conversation example
```

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
