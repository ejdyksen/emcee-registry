# MCP Server Package Specification Generator

This tool generates MCP server package specifications from URLs using a large language model (LLM). It extracts relevant information from the URL and creates a package specification file in the format required by the Emcee repository.

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   pnpm install
   ```
3. Build the TypeScript code:
   ```
   pnpm build:ts
   ```

## Configuration

Create a `.env` file in the root directory with your Anthropic API key:

```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

Alternatively, you can provide the API key as a command-line argument.

## Usage

```
pnpm start <url> [options]
```

### Arguments

- `<url>`: The URL to generate a package specification from

### Options

- `-o, --output <path>`: Output directory (default: "mcp-servers")
- `-m, --model <model>`: LLM model to use (default: "claude-3-opus-20240229")
- `-t, --temperature <temp>`: Temperature for LLM generation (default: "0.2")
- `-k, --api-key <key>`: API key for the LLM service

### Examples

Generate a package specification for a GitHub repository:

```
pnpm start https://github.com/modelcontextprotocol/servers
```

Specify an output directory:

```
pnpm start https://github.com/modelcontextprotocol/servers -o custom-output-dir
```

Use a different model:

```
pnpm start https://github.com/modelcontextprotocol/servers -m claude-3-sonnet-20240229
```

## Architecture

The tool is designed with a modular architecture to allow for easy swapping of different LLM providers:

- `src/index.ts`: Main entry point that parses command-line arguments and orchestrates the process
- `src/llm/interface.ts`: Interface for LLM clients
- `src/llm/anthropic.ts`: Anthropic API client implementation
- `src/spec/types.ts`: Types for package specifications
- `src/spec/generator.ts`: Package specification generator

To add support for a different LLM provider, create a new implementation of the `LLMClient` interface.

## Error Handling

The tool includes comprehensive error handling to provide helpful feedback when things go wrong:

- **URL Validation**: Checks if the provided URL is valid and points to a git repository
- **API Key Validation**: Ensures the Anthropic API key is provided and valid
- **JSON Parsing**: Validates that the LLM response contains valid JSON
- **Package Spec Validation**: Ensures the generated package specification contains all required fields
- **Helpful Error Messages**: Provides specific error messages with suggestions for fixing common issues

Examples of error messages:

```
❌ Error generating package specification:
   The URL does not appear to be a valid repository for an MCP server: https://example.com

Suggestion: Make sure the URL is valid and points to a git repository.
Example: https://github.com/username/repo
```

```
❌ Error generating package specification:
   Failed to extract package spec: Could not extract valid JSON from the LLM response.

Suggestion: The LLM might have generated invalid JSON.
Try again with a different temperature setting (e.g., --temperature 0.1)
```

## Output

The tool generates a package specification file in JSON format and saves it to the specified output directory. The file is organized in a subdirectory based on the first letter of the package name, following the convention used in the Emcee registry.

For example, a package named "GitHub" would be saved to `mcp-servers/g/github.json`.
