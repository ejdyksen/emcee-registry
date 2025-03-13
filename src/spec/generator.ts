import { LLMClient } from "../llm/interface";
import { PackageSpec } from "./types";
import * as fs from "fs";
import * as path from "path";

export class PackageSpecGenerator {
  private llmClient: LLMClient;

  constructor(llmClient: LLMClient) {
    this.llmClient = llmClient;
  }

  /**
   * Generate a package specification from a URL
   * @param url The URL to generate a package specification from
   * @returns A promise that resolves to the generated package specification
   * @throws Error if the package specification could not be generated or is invalid
   */
  public async generateFromUrl(url: string): Promise<PackageSpec> {
    try {
      // Validate URL format
      if (!this.isValidUrl(url)) {
        throw new Error(`Invalid URL format: ${url}`);
      }

      // Extract package spec from URL
      const jsonStr = await this.llmClient.extractPackageSpec(url);

      // Parse JSON
      let packageSpec: PackageSpec;
      try {
        packageSpec = JSON.parse(jsonStr) as PackageSpec;
      } catch (parseError) {
        throw new Error(
          `Failed to parse package spec JSON: ${
            parseError instanceof Error
              ? parseError.message
              : String(parseError)
          }`
        );
      }

      // Validate the package spec
      this.validatePackageSpec(packageSpec);

      return packageSpec;
    } catch (error) {
      // Enhance error message with more context
      if (error instanceof Error) {
        // Check for specific error types to provide more helpful messages
        if (error.message.includes("valid repository")) {
          throw new Error(
            `The URL does not appear to be a valid repository for an MCP server: ${url}`
          );
        } else if (error.message.includes("Invalid URL format")) {
          throw new Error(
            `Please provide a valid URL in the format http(s)://domain.com/path`
          );
        } else {
          throw new Error(`Failed to generate package spec: ${error.message}`);
        }
      }
      throw error;
    }
  }

  /**
   * Check if a string is a valid URL
   * @param url The URL to validate
   * @returns True if the URL is valid, false otherwise
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Save a package specification to a file
   * @param packageSpec The package specification to save
   * @param outputPath The path to save the package specification to
   */
  public saveToFile(packageSpec: PackageSpec, outputPath: string): void {
    try {
      // Create directory if it doesn't exist
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write the package spec to the file
      fs.writeFileSync(outputPath, JSON.stringify(packageSpec, null, 2));
      console.log(`Package specification saved to ${outputPath}`);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to save package spec: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Validate a package specification
   * @param packageSpec The package specification to validate
   * @throws Error if the package specification is invalid
   */
  private validatePackageSpec(packageSpec: PackageSpec): void {
    // Check required fields
    if (!packageSpec.id) {
      throw new Error("Package specification is missing required field: id");
    }
    if (!packageSpec.url) {
      throw new Error("Package specification is missing required field: url");
    }
    if (!packageSpec.name) {
      throw new Error("Package specification is missing required field: name");
    }
    if (!packageSpec.installationMethods) {
      throw new Error(
        "Package specification is missing required field: installationMethods"
      );
    }

    // Check that at least one installation method is defined
    const methods = packageSpec.installationMethods;
    if (!methods.nodeModule && !methods.pythonModule && !methods.docker) {
      throw new Error(
        "Package specification must define at least one installation method"
      );
    }

    // Check that if nodeModule is defined, docker is also defined
    if (methods.nodeModule && !methods.docker) {
      throw new Error(
        "Package specification with nodeModule installation method must also provide a docker installation method"
      );
    }

    // Check if this is an API-based server and requires environment variables
    const apiRelatedTerms = [
      "api",
      "search",
      "map",
      "weather",
      "chat",
      "auth",
      "token",
    ];
    const nameContainsApiTerm = apiRelatedTerms.some(
      (term) =>
        packageSpec.name.toLowerCase().includes(term) ||
        (packageSpec.description &&
          packageSpec.description.toLowerCase().includes(term))
    );

    if (nameContainsApiTerm) {
      // Check nodeModule envVars
      if (
        methods.nodeModule &&
        (!methods.nodeModule.envVars ||
          Object.keys(methods.nodeModule.envVars).length === 0)
      ) {
        throw new Error(
          "API-based server must include environment variables in nodeModule installation method"
        );
      }

      // Check docker envVars
      if (
        methods.docker &&
        (!methods.docker.envVars ||
          Object.keys(methods.docker.envVars).length === 0)
      ) {
        throw new Error(
          "API-based server must include environment variables in docker installation method"
        );
      }
    }

    // Check installation methods
    if (methods.nodeModule && !methods.nodeModule.npmPackage) {
      throw new Error(
        "nodeModule installation method is missing required field: npmPackage"
      );
    }
    if (methods.pythonModule && !methods.pythonModule.pipPackage) {
      throw new Error(
        "pythonModule installation method is missing required field: pipPackage"
      );
    }
    if (methods.docker && !methods.docker.image) {
      throw new Error(
        "docker installation method is missing required field: image"
      );
    }
  }

  /**
   * Determine the output path for a package specification
   * @param packageSpec The package specification
   * @param baseDir The base directory to save the package specification to
   * @returns The output path for the package specification
   */
  public determineOutputPath(
    packageSpec: PackageSpec,
    baseDir: string
  ): string {
    // Use the first alias if available, or a simplified version of the name
    let filename = packageSpec.name.toLowerCase().replace(/\s+/g, "-");

    // If aliases exist and the first one is a simple name, use that instead
    if (packageSpec.aliases && packageSpec.aliases.length > 0) {
      // Use the first alias but remove any "mcp" references as they're redundant
      const firstAlias = packageSpec.aliases[0]
        .replace(/-?mcp-?/, "-")
        .replace(/--/, "-");
      // If the alias doesn't start or end with a hyphen, use it
      if (!firstAlias.startsWith("-") && !firstAlias.endsWith("-")) {
        filename = firstAlias;
      }
    }

    // Extract the first letter for the subdirectory
    const firstLetter = filename.charAt(0).toLowerCase();

    // Add .json extension
    filename += ".json";

    return path.join(baseDir, firstLetter, filename);
  }
}
