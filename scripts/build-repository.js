#!/usr/bin/env node
/**
 * Script to build the combined repository.json file
 *
 * This script:
 * 1. Validates all server definition files
 * 2. Creates a combined repository.json file from all server definitions
 * 3. Generates a simple index.html page for GitHub Pages
 * 4. Outputs files to the specified output directory
 *
 * Usage: node build-repository.js [output-dir]
 * Default output directory is "build"
 */

const fs = require("fs");
const path = require("path");
const glob = require("glob");
const { spawnSync } = require("child_process");

// Get output directory from arguments or use default
const outputDir = process.argv[2] || "build";
console.log(`Using output directory: ${outputDir}`);

// First validate the JSON files
console.log("🔍 Validating JSON files...");
const validateScript = path.join(__dirname, "validate-json.js");

// Check if validate-json.js exists
if (!fs.existsSync(validateScript)) {
  console.error(`❌ Validation script not found: ${validateScript}`);
  process.exit(1);
}

// Run the validation script
const validateResult = spawnSync("node", [validateScript], {
  stdio: "inherit",
});
if (validateResult.status !== 0) {
  console.error("❌ Validation failed. Aborting build.");
  process.exit(1);
}
console.log("✅ Validation completed successfully\n");

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`Created output directory: ${outputDir}`);
}

// Create initial empty structure
const outputPath = path.join(outputDir, "repository.json");
const output = { mcpServers: {} };
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

// Find and process all server definition files
const files = glob.sync("mcp-servers/**/*.json");

console.log(`Found ${files.length} server definition files:`);
for (const file of files) {
  console.log(`- ${file}`);
  const content = JSON.parse(fs.readFileSync(file, "utf8"));

  // Merge the content into the output
  Object.assign(output.mcpServers, content);
}

// Write the combined output
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
console.log(
  `\n✅ Combined ${files.length} server definitions into ${outputPath}`
);

// Create a simple index.html pointing to the JSON file
const indexHtml = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>MCP Server Definitions</title>
    <style>
      body {
        font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <p>
      <a href="repository.json">repository.json</a>
    </p>
  </body>
</html>

`;
fs.writeFileSync(path.join(outputDir, "index.html"), indexHtml);
console.log("📄 Created index.html");

// Print output directory contents for verification
console.log("\nOutput directory contents:");
const outputFiles = fs.readdirSync(outputDir);
outputFiles.forEach((file) => {
  const stats = fs.statSync(path.join(outputDir, file));
  console.log(`- ${file} (${stats.size} bytes)`);
});

console.log("\n🎉 Build completed successfully!");

// If running locally (not in CI), provide a convenience message
if (process.env.CI !== "true") {
  console.log(`\nYou can open the files locally with:`);
  console.log(`  open ${path.resolve(outputDir)}/index.html`);
}
