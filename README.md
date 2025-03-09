# Emcee repository

This repo stores the package definitions for MCP servers. The Hit

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
