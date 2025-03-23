/**
 * Types for MCP server package specifications
 */

export interface EnvironmentVariables {
  [key: string]: string;
}

export type Dependency =
  | "docker"
  | "node"
  | "python"
  | "docker-compose"
  | string;

export interface InstallationOption {
  dependencies: Dependency[];
  buildCommands?: string[];
  runCommands: string[];
  envVars?: EnvironmentVariables;
}

export interface PackageSpec {
  id: string;
  url: string;
  name: string;
  aliases?: string[];
  description?: string;
  installationOptions: InstallationOption[];
}

export interface Repository {
  [id: string]: PackageSpec;
}
