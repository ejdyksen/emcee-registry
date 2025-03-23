#!/usr/bin/env node
/**
 * Script to validate all server definition JSON files
 *
 * This script checks:
 * - That all JSON files are valid (parse without errors)
 * - That they conform to the expected structure
 * - That essential properties are present
 */

const fs = require("fs");
const path = require("path");
const glob = require("glob");

// Color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
};

console.log(`${colors.cyan}MCP Server Definition Validator${colors.reset}`);
console.log(`${colors.cyan}================================${colors.reset}\n`);

// Find all server definition files
const files = glob.sync("registry/**/*.json");
if (files.length === 0) {
  console.log(
    `${colors.yellow}No server definition files found.${colors.reset}`
  );
  process.exit(0);
}

console.log(`Found ${files.length} server definition files to validate.\n`);

let hasErrors = false;
let validFiles = 0;

// Validate each file
for (const file of files) {
  process.stdout.write(`Validating ${file}... `);

  try {
    // Check if file is valid JSON
    const content = fs.readFileSync(file, "utf8");
    let json;

    try {
      json = JSON.parse(content);
    } catch (err) {
      console.log(`${colors.red}ERROR: Invalid JSON${colors.reset}`);
      console.log(`  ${err.message}`);
      hasErrors = true;
      continue;
    }

    // Each file contains a single server definition
    const server = json;
    let fileErrors = false;

    // Check required fields as per README spec
    if (!server.id) {
      console.log(
        `${colors.red}ERROR: Missing 'id' field in ${file}${colors.reset}`
      );
      fileErrors = true;
    }

    if (!server.url) {
      console.log(
        `${colors.red}ERROR: Missing 'url' field in ${file}${colors.reset}`
      );
      fileErrors = true;
    }

    if (!server.name) {
      console.log(
        `${colors.red}ERROR: Missing 'name' field in ${file}${colors.reset}`
      );
      fileErrors = true;
    }

    if (!server.description) {
      console.log(
        `${colors.yellow}WARNING: Missing 'description' field in ${file}${colors.reset}`
      );
    }

    if (
      !server.installationOptions ||
      !Array.isArray(server.installationOptions) ||
      server.installationOptions.length === 0
    ) {
      console.log(
        `${colors.red}ERROR: Missing or invalid 'installationOptions' array in ${file}${colors.reset}`
      );
      fileErrors = true;
    } else {
      // Validate each installation option
      server.installationOptions.forEach((option, index) => {
        if (
          !option.dependencies ||
          !Array.isArray(option.dependencies) ||
          option.dependencies.length === 0
        ) {
          console.log(
            `${colors.red}ERROR: Missing or invalid 'dependencies' array in installationOption ${index} in ${file}${colors.reset}`
          );
          fileErrors = true;
        }

        if (
          !option.runCommands ||
          !Array.isArray(option.runCommands) ||
          option.runCommands.length === 0
        ) {
          console.log(
            `${colors.red}ERROR: Missing or invalid 'runCommands' array in installationOption ${index} in ${file}${colors.reset}`
          );
          fileErrors = true;
        }

        if (
          option.buildCommands &&
          (!Array.isArray(option.buildCommands) ||
            option.buildCommands.length === 0)
        ) {
          console.log(
            `${colors.yellow}WARNING: 'buildCommands' is present but empty or not an array in installationOption ${index} in ${file}${colors.reset}`
          );
        }

        if (option.envVars && typeof option.envVars !== "object") {
          console.log(
            `${colors.red}ERROR: 'envVars' is not an object in installationOption ${index} in ${file}${colors.reset}`
          );
          fileErrors = true;
        }
      });
    }

    if (fileErrors) {
      hasErrors = true;
    } else {
      console.log(`${colors.green}VALID${colors.reset}`);
      validFiles++;
    }
  } catch (err) {
    console.log(`${colors.red}ERROR: ${err.message}${colors.reset}`);
    hasErrors = true;
  }
}

// Summary
console.log("\n=== Validation Summary ===");
console.log(`Total files: ${files.length}`);
console.log(`Valid files: ${validFiles}`);
console.log(`Files with errors: ${files.length - validFiles}`);

if (hasErrors) {
  console.log(`\n${colors.red}Validation failed with errors.${colors.reset}`);
  process.exit(1);
} else {
  console.log(
    `\n${colors.green}All server definitions are valid!${colors.reset}`
  );
  process.exit(0);
}
