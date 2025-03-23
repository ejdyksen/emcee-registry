# Emcee registry

This repo stores the package definitions for MCP servers.

## Package Specification

| Field           | Description                                                          |
| --------------- | -------------------------------------------------------------------- |
| **id**          | Unique identifier for the server. Shorthanded for Github, see below. |
| **url**         | HTTPS åßURL to the git repository that hosts the MCP server          |
| **description** | A brief description of this MCP server                               |
| aliases         | List of alternative names for the server.                            |
| description     | Description of the server.                                           |
| envVars         | Key/value list of environment variables (and values) to set          |

| **installationMethods** | Methods to install the server. See below |

### id

Note: If the server is hosted on GitHub, the `id` field is a shorthand like this:

```
github:username/repo#subdirectory
```

Subdirectories are optional but useful for repositories that host more than one MCP server (like [the official MCP server repo](http://github.com/modelcontextprotocol/servers)).

If the server is hosted elsewhere, the `id` field should just be a url (like `https://gitlab.com/username/repo`).

For brevity, he `id` field should not include the words `mcp` or `server` even though authors will typically add these to their repo name.

We use this format because git is really the only common denominator with MCP servers, given they could be packaged/distributed any number of ways (Docker, NPM, etc).

### aliases

If the MCP server is an official project (e.g. the [Cloudflare MCP server](https://github.com/cloudflare/mcp-server-cloudflare)), or published by the Model Context Protocol project, or otherwise very well known, we can give it an alias so that it can be installed easily. Not all servers will have aliases, but it's a nice-to-have for the most common:

```
emcee install filesystem
```

## Environment variables

Environment variables are key/value pairs that should be set when running the MCP server. These are typically used for configuration, like setting the port or the database connection string.

## Installation Methods

Installation methods are as generic as possible, and do not include specific commands (like `npx` or `uv`), as these are left up to the Emcee CLI (and the user's preferences). For example, just knowing it's a runnable NPM module is sufficient information for a client to install and run. At least one installation method is required.

### Container

This method relies on Docker to run the MCP server.

| Field     | Description                                  |
| --------- | -------------------------------------------- |
| **image** | Docker image to use. Defaults to Docker Hub. |

### Node Module

This method relies on having a published NPM package that can be run with `npx` or similar.

| Field          | Description                                                               |
| -------------- | ------------------------------------------------------------------------- |
| **npmPackage** | Name of the npm package, sufficient to run `npm install` or `npx` against |

### Python Module

This method relies on having a published Python package that can be run with `pip install` or `uvx` or `pipx`.

| Field          | Description                                                                         |
| -------------- | ----------------------------------------------------------------------------------- |
| **pipPackage** | Name of the pip package, sufficient to run `pip install` or `uvx` or `pipx` against |

### Vanilla Node

This method (referenced as `vanillaNode` in the JSON) is for projects that need to be cloned, optionally built, and run with Node.js directly.

| Field             | Description                                                     |
| ----------------- | --------------------------------------------------------------- |
| **url**           | Not usually needed, as the git repo should be the same as above |
| **buildCommands** | Commands to run to build the server, if needed.                 |
| **envVars**       | Environment variables required to run the server                |

## Output

These package specs are combined and served at `[https://api.emcee-cli.com/registry.json](https://api.emcee-cli.com/registry.json)`. The `id` field is the key for each package.
