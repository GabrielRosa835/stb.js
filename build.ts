import { existsSync, readdirSync, readFileSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

console.log("📦 [stb.js bundler] Starting build process...");

function appendComponent(filePath: string) {
  console.log(`📄 [stb.js bundler] Reading: ${filePath}`);
  const content = readFileSync(filePath, "utf-8");
  bundledCode += content + "\n\n\n\n";
}

let bundledCode = "";
const distDir = "./dist";
const outFile = join(distDir, "stb.ts");
const files = [];

//-----------------//
//      SETUP      //
//-----------------//

if (!existsSync(distDir)) {
  mkdirSync(distDir);
  console.log(`📁 [stb.js bundler] Created ${distDir} directory.`);
}
if (existsSync(outFile)) {
  rmSync(outFile);
  console.log(`🗑️  [stb.js bundler] Removed previous build artifact.`);
}

//--------------------//
//    ADDING FILES    //
//--------------------//

files.push("Common/EqualityComparer.ts");
files.push("Common/Serializable.ts");

files.push("Global/GlobalUtilities.ts");

files.push("Validation/Validation.ts");

for (const file of readdirSync("Validation/Validators")) {
  if (file === "index.ts") continue;
  files.push(join("Validation/Validators", file));
}

files.push("Validation/Validate.ts");

files.push("ServiceProvider/ServiceProvider.ts");

files.push("Time/Time.ts");

files.push("Serialization/SerializationService.ts");
files.push("Serialization/Serialize.ts");

files.push("Resources/ResourceManager.ts");

files.push("Observer/Observer.ts");

files.push("LocalStorage/LocalStorageService.ts");

files.push("Identity/IdentityService.ts");

files.push("HttpClient/HttpClient.ts");

files.push("Enum/Enums.ts");

files.push("Accessors/NestedAccessor.ts");

for (const file of files) {
  appendComponent(file);
}

//-------------------//
// STRIPPING IMPORTS //
//-------------------//

console.log("🧹 [stb.js bundler] Stripping import statements...");

/**
 * Regex Breakdown:
 * ^import\s+          : Matches "import " at the start of a line/statement
 * (?:type\s+)?        : Optionally matches "type " for TS type imports
 * (?:\{[\s\S]*?\}|.+?): Matches multi-line braces OR single-line imports
 * \s+from\s+          : Matches " from "
 * ['"].+?['"];?       : Matches the module path and optional semicolon
 */
const importRegex = /^import\s+(?:type\s+)?(?:\{[\s\S]*?\}|.+?)\s+from\s+['"].+?['"];?$/gm;

const initialLength = bundledCode.length;
bundledCode = bundledCode.replace(importRegex, "");
const strippedBytes = initialLength - bundledCode.length;

console.log(`✂️  [stb.js bundler] Removed imports (freed approx ${strippedBytes} bytes).`);

writeFileSync(outFile, bundledCode.trim() + "\n");
console.log(`✅ [stb.js bundler] Build complete! Saved to ${outFile}`);