# Emcee repository

This repo stores the package definitions for MCP servers.

## Package Specification

| Field                   | Description                               |
| ----------------------- | ----------------------------------------- |
| **id**                  | Unique identifier for the server.         |
| **url**                 | URL to the server's source code.          |
| **name**                | Name of the server.                       |
| aliases                 | List of alternative names for the server. |
| description             | Description of the server.                |
| **installationMethods** | Methods to install the server.            |

Note: If the server is hosted on GitHub, the `id` field is a shorthand like this:

```
github:username/repo#subdirectory
```

Subdirectories are optional but useful for repositories that host more than one MCP server (like [the official MCP server repo](http://github.com/modelcontextprotocol/servers)).

If the server is hosted elsewhere, the `id` field should just be a url (like `https://gitlab.com/username/repo`).

We use this format because git is really the only common denominator with MCP servers, given they could be packaged/distributed any number of ways (Docker, NPM, etc).

## Installation Methods

Installation methods are as generic as possible, and do not include specific commands (like `npx` or `uv`), as these are left up to the Emcee CLI (and the user's preferences). For example, just knowing it's a runnable NPM module is sufficient information for a client to install and run. At least one installation method is required.

### Container

| Field     | Description                                                 |
| --------- | ----------------------------------------------------------- |
| **image** | Docker image to use. Defaults to Docker Hub.                |
| envVars   | Key/value list of environment variables (and values) to set |

### Node Module

| Field          | Description                                                               |
| -------------- | ------------------------------------------------------------------------- |
| **npmPackage** | Name of the npm package, sufficient to run `npm install` or `npx` against |
| envVars        | Key/value list of environment variables (and values) to set               |

### Python Module

| Field          | Description                                                                         |
| -------------- | ----------------------------------------------------------------------------------- |
| **pipPackage** | Name of the pip package, sufficient to run `pip install` or `uvx` or `pipx` against |
| envVars        | Key/value list of environment variables (and values) to set                         |

## Output

These package specs are combined and served at `[https://api.emcee-cli.com/repository.json](https://api.emcee-cli.com/repository.json)`. The `id` field is the key for each package.
