/**
 * Types for MCP server package specifications
 */

export interface EnvironmentVariables {
  [key: string]: string;
}

export interface NodeModuleInstallation {
  npmPackage: string;
  envVars?: EnvironmentVariables;
}

export interface PythonModuleInstallation {
  pipPackage: string;
  envVars?: EnvironmentVariables;
}

export interface DockerInstallation {
  image: string;
  envVars?: EnvironmentVariables;
}

export interface InstallationMethods {
  nodeModule?: NodeModuleInstallation;
  pythonModule?: PythonModuleInstallation;
  docker?: DockerInstallation;
}

export interface PackageSpec {
  id: string;
  url: string;
  name: string;
  aliases?: string[];
  description?: string;
  installationMethods: InstallationMethods;
}

export interface Repository {
  [id: string]: PackageSpec;
}
