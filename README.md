# Emcee repository

This repo stores the package definitions for MCP servers.

## Combined Repository JSON

This URL provides a single JSON file containing all server definitions, which is automatically updated whenever changes are pushed to the repository.

### How It Works

The repository uses two separate GitHub Actions workflows:

1. **Build Workflow**: Triggered when changes are made to JSON files in the `mcp-servers` directory.

   - Validates all JSON files to ensure they're correctly formatted
   - Combines them into a single `repository.json` file
   - Creates a build artifact that contains the result

2. **Deploy Workflow**: Triggered after the build workflow completes successfully.
   - Downloads the build artifact from the build workflow
   - Deploys the combined repository.json to GitHub Pages

This separation allows for better diagnostics if any issues occur during the build or deploy process.

### Local Development

To test the build process locally without pushing to GitHub:

```bash
# Install dependencies
npm install

# Run validation only
npm run validate

# Run the full build process
npm run build
# Or run directly with a custom output directory:
# node scripts/build-repository.js my-output-dir

# Open the generated index.html to preview the result
open build/index.html

# Clean up build artifacts when done
npm run clean
```

## Repository Format

The repository contains detailed information about available MCP servers, their installation methods, and required environment variables:

```json
{
  "mcpServers": {
    "https://github.com/modelcontextprotocol/servers/tree/main/src/github": {
      "name": "github",
      "description": "GitHub server",
      "installationMethods": {
        "nodeModule": {
          "npmPackage": "@modelcontextprotocol/server-github",
          "envVars": {
            "GITHUB_PERSONAL_ACCESS_TOKEN": "Your personal access token to Github"
          }
        },
        "docker": {
          "image": "modelcontextprotocol/server-github",
          "envVars": {
            "GITHUB_PERSONAL_ACCESS": "Your personal access token to Github"
          }
        }
      }
    },
    "https://github.com/modelcontextprotocol/servers/tree/main/src/time": {
      "name": "time",
      "description": "Time server",
      "installationMethods": {
        "pythonModule": {
          "pipPackage": "mcp-server-time"
        },
        "docker": {
          "image": "mcp/time"
        }
      }
    }
  }
}
```

### Repository Format Description

- **mcpServers**: A map where:
  - **Key**: The URL path to the server (which serves as a unique identifier)
  - **Value**: Server definition object with:
    - `name`: Human-readable server name (e.g., "github", "time")
    - `description`: Brief description of the server's purpose
    - `installationMethods`: Map of available installation methods:
      - **Key**: Method name (e.g., "nodeModule", "pythonModule", "docker")
      - **Value**: Method-specific configuration:
        - For Node-based methods:
          - `npmPackage`: NPM package name
          - `envVars`: Required environment variables
        - For Python-based methods:
          - `pipPackage`: Python package name
        - For Docker-based methods:
          - `image`: Docker image name
          - `envVars`: Required environment variables
