import { LLMClient, LLMClientOptions } from "./interface";
import Anthropic from "@anthropic-ai/sdk";
import axios from "axios";

export class AnthropicClient implements LLMClient {
  private client: Anthropic;
  private model: string;
  private maxTokens: number;
  private temperature: number;
  public customPrompt?: string; // Add a property for custom prompt

  constructor(options: LLMClientOptions) {
    if (!options.apiKey) {
      throw new Error("Anthropic API key is required");
    }

    this.client = new Anthropic({
      apiKey: options.apiKey,
    });

    this.model = options.model || "claude-3-opus-20240229";
    this.maxTokens = options.maxTokens || 4096;
    this.temperature = options.temperature || 0.2;
  }

  /**
   * Fetch README content from a git repository URL
   * @param url The repository URL
   * @returns A promise that resolves to the README content
   */
  public async fetchReadmeContent(url: string): Promise<string> {
    try {
      // Convert URL to raw content URL for README.md
      let readmeUrl = "";

      // Handle GitHub URLs
      if (url.includes("github.com")) {
        // Transform github.com/user/repo to raw.githubusercontent.com/user/repo/main/README.md
        const githubRegex = /github\.com\/([^\/]+)\/([^\/\#]+)/;
        const match = url.match(githubRegex);

        if (match) {
          const [_, user, repo] = match;
          // Try main branch first (GitHub's default branch name)
          readmeUrl = `https://raw.githubusercontent.com/${user}/${repo}/main/README.md`;

          try {
            const response = await axios.get(readmeUrl);
            return response.data;
          } catch (mainError) {
            // If main branch doesn't work, try master branch (older default branch name)
            readmeUrl = `https://raw.githubusercontent.com/${user}/${repo}/master/README.md`;
            const response = await axios.get(readmeUrl);
            return response.data;
          }
        }
      }

      // Handle GitLab URLs
      if (url.includes("gitlab.com")) {
        // Transform gitlab.com/user/repo to gitlab.com/user/repo/-/raw/main/README.md
        const gitlabRegex = /gitlab\.com\/([^\/]+)\/([^\/\#]+)/;
        const match = url.match(gitlabRegex);

        if (match) {
          const [_, user, repo] = match;
          // Try main branch first
          readmeUrl = `https://gitlab.com/${user}/${repo}/-/raw/main/README.md`;

          try {
            const response = await axios.get(readmeUrl);
            return response.data;
          } catch (mainError) {
            // If main branch doesn't work, try master branch
            readmeUrl = `https://gitlab.com/${user}/${repo}/-/raw/master/README.md`;
            const response = await axios.get(readmeUrl);
            return response.data;
          }
        }
      }

      // If we couldn't determine a README URL or it's not GitHub/GitLab
      throw new Error(
        `Could not determine README URL for repository: ${url}. Only GitHub and GitLab repositories are currently supported.`
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        let errorMessage = `Failed to fetch README content: ${error.message}`;

        if (statusCode === 404) {
          errorMessage = `README.md not found in the repository (404 error). The repository may be private, empty, or structured differently.`;
        } else if (statusCode === 403) {
          errorMessage = `Access forbidden (403 error). The repository may require authentication or have access restrictions.`;
        } else if (statusCode === 429) {
          errorMessage = `Rate limit exceeded (429 error). Too many requests to the git hosting service.`;
        }

        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  /**
   * Fetch package.json content from a git repository URL
   * @param url The repository URL
   * @returns A promise that resolves to the package.json content as an object
   */
  public async fetchPackageJson(url: string): Promise<any> {
    // Only handle GitHub URLs for now
    if (!url.includes("github.com")) {
      throw new Error(
        "Only GitHub repositories are supported for package.json fetching"
      );
    }

    // Extract user and repo from the URL
    const githubRegex = /github\.com\/([^\/]+)\/([^\/\#]+)/;
    const match = url.match(githubRegex);

    if (!match) {
      throw new Error(`Could not parse GitHub repository URL: ${url}`);
    }

    const [_, user, repo] = match;
    const packageJsonUrl = `https://raw.githubusercontent.com/${user}/${repo}/main/package.json`;

    try {
      const response = await axios.get(packageJsonUrl);
      return response.data;
    } catch (mainError) {
      // Try master branch as fallback
      try {
        const packageJsonUrl = `https://raw.githubusercontent.com/${user}/${repo}/master/package.json`;
        const response = await axios.get(packageJsonUrl);
        return response.data;
      } catch (masterError) {
        throw new Error(`Could not fetch package.json from repository: ${url}`);
      }
    }
  }

  /**
   * Extract package specification from a URL
   * @param url The URL to extract package specification from
   * @returns A promise that resolves to the extracted package specification as JSON string
   */
  public async extractPackageSpec(url: string): Promise<string> {
    try {
      // If a custom prompt is provided, use it instead of the default
      if (this.customPrompt) {
        console.log("Using custom prompt for extraction");

        const response = await this.client.messages.create({
          model: this.model,
          max_tokens: this.maxTokens,
          temperature: this.temperature,
          system:
            "You are a helpful assistant that extracts MCP server package specifications from URLs. Your task is to analyze the provided URL and generate a valid package specification in JSON format.",
          messages: [
            {
              role: "user",
              content: this.customPrompt,
            },
          ],
        });

        // Extract the text from the response
        const content =
          response.content[0].type === "text" ? response.content[0].text : "";

        // Find JSON in the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error(
            "Could not extract valid JSON from the LLM response using custom prompt."
          );
        }

        // Validate and return the JSON
        const jsonStr = jsonMatch[0];
        JSON.parse(jsonStr); // This will throw if the JSON is invalid
        return jsonStr;
      }

      // Gather information from the repository
      let readmeContent = "";
      let packageJson = null;

      // Try to fetch README
      try {
        readmeContent = await this.fetchReadmeContent(url);
        console.log(`Successfully fetched README from repository: ${url}`);
      } catch (error) {
        console.warn(
          `Warning: Could not fetch README content: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }

      // Try to fetch package.json for npm packages
      if (url.includes("github.com")) {
        try {
          packageJson = await this.fetchPackageJson(url);
          console.log(`Successfully fetched package.json: ${packageJson.name}`);
        } catch (error) {
          console.warn(
            `Warning: Could not fetch package.json: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      }

      // Build prompt with all available context
      let packageJsonContent = "";
      if (packageJson) {
        packageJsonContent = JSON.stringify(packageJson, null, 2);
      }

      // Build prompt with all available context
      const prompt = this.buildPrompt(url, readmeContent, packageJsonContent);

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        system:
          "You are a helpful assistant that extracts MCP server package specifications from URLs. Your task is to analyze the provided URL and generate a valid package specification in JSON format.",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      // Extract the text from the response
      const content =
        response.content[0].type === "text" ? response.content[0].text : "";

      // Check if the model indicated failure
      if (content.includes("Failed to extract package spec")) {
        // Extract failure explanation if available
        const failureMatch = content.match(
          /Failed to extract package spec(.+)/i
        );
        const failureReason =
          failureMatch && failureMatch[1] ? failureMatch[1].trim() : "";

        throw new Error(
          `The URL does not appear to be a valid repository for an MCP server${
            failureReason ? ": " + failureReason : ""
          }`
        );
      }

      // Find JSON in the response (in case the model adds explanatory text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error(
          "Could not extract valid JSON from the LLM response. The model may not have generated a proper JSON structure."
        );
      }

      // Validate the JSON
      const jsonStr = jsonMatch[0];
      try {
        JSON.parse(jsonStr);
      } catch (parseError) {
        throw new Error(
          `Invalid JSON in LLM response: ${
            parseError instanceof Error
              ? parseError.message
              : String(parseError)
          }`
        );
      }

      return jsonStr;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to extract package spec: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Build the prompt for the LLM
   * @param url The URL to extract package specification from
   * @param readmeContent Optional README content fetched from the repository
   * @param packageJsonContent Optional package.json content fetched from the repository
   * @returns The prompt for the LLM
   */
  private buildPrompt(
    url: string,
    readmeContent?: string,
    packageJsonContent?: string
  ): string {
    let prompt = `
I need you to generate a package specification for an MCP server based on the following URL:
${url}

If this URL is not a git repository (or similar), please end in failure (just output "Failed to extract package spec: [reason]") where [reason] explains why you couldn't generate the spec.

The package specification should be in JSON format and include the following fields:
- id: A unique identifier for the server (if GitHub, use format "username/repo#subdirectory" for github, or "gitlab.com/user/repo" or similar for non-github)
- url: URL to the server's source code
- name: Name of the server
- aliases: List of alternative names for the server - use simple, short names without "mcp" in them (e.g., "mongodb" instead of "mongodb-mcp")
- description: Description of the server
- installationMethods: Methods to install the server (nodeModule, pythonModule, or docker)

IMPORTANT: YOU MUST INCLUDE ALL APPLICABLE INSTALLATION METHODS in the installationMethods object.

1. If you find references to npm packages, package.json, or npx commands, include a nodeModule installation method.
2. If you find references to Python, pip, requirements.txt, or .py files, include a pythonModule installation method.
3. If you find references to Docker, Dockerfile, docker-compose, or docker run commands, include a docker installation method.
4. CRITICAL: For any server that has a nodeModule installation method, ALWAYS INCLUDE a docker installation method as well, using the same package name but with a "modelcontextprotocol/" prefix for the Docker image. All MCP servers support both nodeModule and Docker installation methods.
5. IMPORTANT: For any server that interfaces with external APIs (search APIs, weather APIs, etc.), ALWAYS INCLUDE the necessary API key environment variables in BOTH nodeModule and docker installation methods. If the server name suggests it interfaces with a service (like "Brave Search", "Google Maps", etc.), assume it requires an API key even if not explicitly mentioned in the documentation.

Many repositories support multiple installation methods - be sure to include ALL that apply, not just one. For example, if a repository has both npm package and Docker support, include BOTH nodeModule and docker installation methods.

For nodeModule installation method, include:
- npmPackage: Name of the npm package (usually found in package.json, often matches the repository name, could include scope like @username/package-name)
- envVars: Key/value list of environment variables mentioned in documentation (if applicable)

For pythonModule installation method, include:
- pipPackage: Name of the pip package (usually found in setup.py or pyproject.toml)
- envVars: Key/value list of environment variables mentioned in documentation (if applicable)

For docker installation method, include:
- image: Docker image to use (often the repo name)
- envVars: Key/value list of environment variables mentioned in documentation (if applicable)

Examples of valid installationMethods objects:

For an npm package:
"installationMethods": {
  "nodeModule": {
    "npmPackage": "@username/package-name",
    "envVars": {
      "API_KEY": "Description of the API key",
      "OTHER_VAR": "Description of other variable"
    }
  }
}

For a package that could be installed via npm or Docker:
"installationMethods": {
  "nodeModule": {
    "npmPackage": "package-name"
  },
  "docker": {
    "image": "username/package-name"
  }
}

Please respond with ONLY the JSON object, no additional text or explanations.
`;

    if (readmeContent) {
      prompt += `\nHere is the README content from the repository to help with your analysis:\n${readmeContent.substring(
        0,
        10000
      )}`;
    }

    if (packageJsonContent) {
      prompt += `\nHere is the package.json content from the repository:\n${packageJsonContent}`;
    }

    return prompt;
  }
}
