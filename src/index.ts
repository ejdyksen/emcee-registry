#!/usr/bin/env node

import { Command } from "commander";
import * as dotenv from "dotenv";
import * as path from "path";
import { AnthropicClient } from "./llm/anthropic";
import { PackageSpecGenerator } from "./spec/generator";

// Load environment variables from .env file
dotenv.config();

// Define the program
const program = new Command();

program
  .name("mcp-spec-generator")
  .description("Generate MCP server package specifications from URLs")
  .version("1.0.0");

program
  .argument("<url>", "URL to generate package specification from")
  .option("-o, --output <path>", "Output directory", "mcp-servers")
  .option("-m, --model <model>", "LLM model to use", "claude-3-opus-20240229")
  .option("-t, --temperature <temp>", "Temperature for LLM generation", "0.2")
  .option("-k, --api-key <key>", "API key for the LLM service")
  .action(async (url: string, options) => {
    try {
      // Get API key from options or environment variable
      const apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        console.error(
          "Error: API key is required. Provide it with --api-key or set ANTHROPIC_API_KEY environment variable."
        );
        process.exit(1);
      }

      // Validate temperature
      const temperature = parseFloat(options.temperature);
      if (isNaN(temperature) || temperature < 0 || temperature > 1) {
        console.error("Error: Temperature must be a number between 0 and 1.");
        process.exit(1);
      }

      try {
        // Create LLM client
        const llmClient = new AnthropicClient({
          apiKey,
          model: options.model,
          temperature,
        });

        // Create package spec generator
        const generator = new PackageSpecGenerator(llmClient);

        console.log(`Generating package specification for ${url}...`);

        // Generate package spec
        const packageSpec = await generator.generateFromUrl(url);

        // Determine output path
        const outputPath = generator.determineOutputPath(
          packageSpec,
          options.output
        );

        // Save package spec to file
        generator.saveToFile(packageSpec, outputPath);

        console.log(`✅ Success! Package specification saved to ${outputPath}`);
      } catch (error) {
        handleError(error);
      }
    } catch (error) {
      handleError(error);
    }

    // Helper function to handle errors
    function handleError(error: unknown) {
      console.error("❌ Error generating package specification:");

      if (error instanceof Error) {
        console.error(`   ${error.message}`);

        // Provide helpful suggestions based on error message
        if (error.message.includes("API key")) {
          console.error(
            "\nSuggestion: Check your API key or set it in the .env file."
          );
          console.error("Example .env file content:");
          console.error("ANTHROPIC_API_KEY=your_api_key_here");
        } else if (error.message.includes("URL")) {
          console.error(
            "\nSuggestion: Make sure the URL is valid and points to a git repository."
          );
          console.error("Example: https://github.com/username/repo");
        } else if (error.message.includes("fetch")) {
          console.error(
            "\nSuggestion: Check your internet connection or try again later."
          );
          console.error(
            "The URL might be temporarily unavailable or require authentication."
          );
        } else if (error.message.includes("JSON")) {
          console.error(
            "\nSuggestion: The LLM might have generated invalid JSON."
          );
          console.error(
            "Try again with a different temperature setting (e.g., --temperature 0.1)"
          );
        }
      } else {
        console.error("   An unknown error occurred");
      }

      process.exit(1);
    }
  });

// Parse command-line arguments
program.parse();
