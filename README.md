# Emcee registry

This repo stores the package definitions for MCP servers.

## Package Specification

| Field                   | Description                                                          |
| ----------------------- | -------------------------------------------------------------------- |
| **id**                  | Unique identifier for the server. Shorthanded for Github, see below. |
| **url**                 | HTTPS URL to the git repository that hosts the MCP server            |
| **name**                | Human-readable name of the server                                    |
| **installationOptions** | Array of different ways to install and run the server                |
| aliases                 | List of alternative names for the server                             |
| description             | Description of the server                                            |

### id

Note: If the server is hosted on GitHub, the `id` field is a shorthand like this:

```
github:username/repo#subdirectory
```

Subdirectories are optional but useful for repositories that host more than one MCP server (like [the official MCP server repo](http://github.com/modelcontextprotocol/servers)).

If the server is hosted elsewhere, the `id` field should just be a url (like `https://gitlab.com/username/repo`).

For brevity, the `id` field should not include the words `mcp` or `server` even though authors will typically add these to their repo name.

We use this format because git is really the only common denominator with MCP servers, given they could be packaged/distributed any number of ways (Docker, NPM, etc).

### aliases

If the MCP server is an official project (e.g. the [Cloudflare MCP server](https://github.com/cloudflare/mcp-server-cloudflare)), or published by the Model Context Protocol project, or otherwise very well known, we can give it an alias so that it can be installed easily. Not all servers will have aliases, but it's a nice-to-have for the most common:

```
emcee install filesystem
```

### installationOptions

The `installationOptions` field provides multiple ways that a server can be installed and run. Each option in the array is an object with the following structure:

| Field         | Description                                                 |
| ------------- | ----------------------------------------------------------- |
| dependencies  | Array of required dependencies (docker, node, python, etc.) |
| buildCommands | Array of commands to run once during installation           |
| runCommands   | Array of commands to run the server                         |
| envVars       | Key/value list of environment variables to set              |

The Emcee CLI can examine these options and choose the most appropriate one based on the user's system and preferences. For example, if a user prefers Docker, the CLI can select an option with Docker dependencies.

- **dependencies**: Lists the tooling required to be installed on the system before the MCP server can be built or run (e.g., "docker", "node", "python", "docker-compose"). The Emcee CLI is responsible for ensuring these dependencies are available.

- **buildCommands**: Commands that run once during installation. These might include tasks like:

  - Cloning repositories
  - Installing packages/dependencies
  - Building from source
  - Pulling Docker images

- **runCommands**: Commands that run each time the MCP server is started.

- **envVars**: Environment variables are key/value pairs that should be set when running the MCP server. These are typically used for configuration, like setting the port or the database connection string.

## Example Package

```json
{
  "id": "modelcontextprotocol/servers#time",
  "url": "https://github.com/modelcontextprotocol/servers/tree/main/src/time",
  "name": "Time",
  "aliases": ["time"],
  "description": "Time server",
  "installationOptions": [
    {
      "dependencies": ["python"],
      "buildCommands": ["pip install mcp-server-time"],
      "runCommands": ["python -m mcp_server_time"],
      "envVars": {}
    },
    {
      "dependencies": ["docker"],
      "buildCommands": ["docker pull mcp/time"],
      "runCommands": ["docker run mcp/time"],
      "envVars": {}
    }
  ]
}
```

## Complex Example with Docker Compose

```json
{
  "id": "alexei-led/aws-mcp-server",
  "url": "https://github.com/alexei-led/aws-mcp-server",
  "name": "AWS",
  "aliases": ["aws"],
  "description": "A lightweight service that enables AI assistants to execute AWS CLI commands through the Model Context Protocol (MCP)",
  "installationOptions": [
    {
      "dependencies": ["docker", "docker-compose"],
      "buildCommands": [
        "git clone https://github.com/alexei-led/aws-mcp-server.git",
        "cd aws-mcp-server && docker-compose build"
      ],
      "runCommands": ["cd aws-mcp-server && docker-compose up -d"],
      "envVars": {
        "AWS_ACCESS_KEY_ID": "Your AWS access key",
        "AWS_SECRET_ACCESS_KEY": "Your AWS secret key",
        "AWS_REGION": "Your AWS region"
      }
    }
  ]
}
```

## Output

These package specs are combined and served at `[https://api.emcee-cli.com/registry.json](https://api.emcee-cli.com/registry.json)`. The `id` field is the key for each package.
