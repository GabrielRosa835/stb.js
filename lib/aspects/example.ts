import { Nest } from "./Nest";
import { Schema } from "./Schema";
import { Template } from "./Template";

// ===== Utilities for Visual Logging =====

const colors = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m"
};

const logSection = (msg: string) => console.log(`\n${colors.magenta}=== ${msg} ===${colors.reset}\n`);
const logAction = (msg: string) => console.log(`${colors.cyan}➤ ${msg}${colors.reset}`);
const logSuccess = (msg: string) => console.log(`${colors.green}   ✔ ${msg}${colors.reset}`);
const logFailure = (msg: string) => console.log(`${colors.red}   ✖ ${msg}${colors.reset}`);
const logData = (label: string, data: unknown) => console.log(`${colors.yellow}   [DATA] ${label}:${colors.reset} ${JSON.stringify(data)}`);



// ===== Nest ===== 

// --- Usage ---
const user = Nest.of({
  id: 1,
  profile: {
    name: 'Ana',
    contact: {
      email: 'ana@example.com',
      phone: '9999-9999'
    }
  }
});

// 🟢 Valid: Returns `string` (Type fully inferred!)
console.log(user['profile.name']);

// 🟢 Valid: Returns `{ email: string, phone: string }`
console.log(user['profile.contact']);

// 🔴 TypeScript Error: Property 'profile.contact.mail' does not exist...
// const badProp = user['profile.contact.mail'];

const unwrappedUser = Nest.unwrap(user);

// 🔴 TypeScript Error: Property 'profile.contact.email' does not exist...
// console.log(unwrappedUser['profile.contact.email']);



// ===== Schema / Template =====

logSection("1. DIRECT FUNCTIONAL SCHEMA TESTS");

logAction("Validating primitives and literals");
const string = Schema.string();
const validStr = string.validate("Hello RPG");
if (validStr.isSuccess) logSuccess(`Valid string: "${validStr.value}"`);

const invalidNum = Schema.number().validate("not-a-number");
if (invalidNum.isFailure) logSuccess(`Caught expected error: ${String(invalidNum.value)}`);

logAction("Validating Either (Union) Schema");
const damageSchema = Schema.either(
  Schema.literal("fire"),
  Schema.literal("cold"),
  Schema.literal("physical")
);

const validDamage = damageSchema.validate("cold");
if (validDamage.isSuccess) logSuccess(`Damage union valid: "${validDamage.value}"`);

const invalidDamage = damageSchema.validate("poison");
if (invalidDamage.isFailure) logSuccess(`Rejected invalid union candidate: ${String(invalidDamage.value)}`);

// ----------------------------------------------------
logSection("2. TEMPLATE AST DEFINITIONS & TYPE INFERENCE");

logAction("Building a complete, serializable Character Event Template");
const CharacterEventTemplate = Template.object({
  id: Template.string(),
  name: Template.string(),
  nickname: Template.optional(Template.string()),
  level: Template.number(),
  damageType: Template.either(
    Template.literal("fire"),
    Template.literal("cold"),
    Template.literal("physical")
  ),
  equipment: Template.array(Template.string()),
  extraNotes: Template.nullable(Template.string()),
});

// Verify static type inference at compile time
type InferredCharacter = Template.Infer<typeof CharacterEventTemplate>;

logSuccess("Template defined with inferred static TypeScript types:");
const sampleData: InferredCharacter = {
  id: "char-101",
  name: "Valeros",
  level: 5,
  damageType: "fire",
  equipment: ["Longsword", "Shield"],
  extraNotes: null,
  // nickname is optional, omitted here
};
logData("Sample Inferred Object", sampleData);

// ----------------------------------------------------
logSection("3. TEMPLATE SERIALIZATION & PARSING (JSON WIRE FORMAT)");

logAction("Serializing Template to JSON string for network/storage transport");
const serialized = Template.serialize(CharacterEventTemplate);
logData("Serialized JSON Wire Format", serialized);

logAction("Parsing raw JSON back into a validated Template AST");
const parseResult = Template.parse(serialized);
if (parseResult.isSuccess) {
  logSuccess("Successfully parsed and validated template AST from JSON");
} else {
  logFailure(`Parse failed: ${parseResult.value.message}`);
}

// ----------------------------------------------------
logSection("4. TEMPLATE COMPILATION TO EXECUTABLE SCHEMA");

logAction("Compiling parsed Template into an active Schema validator");
const compiledSchema = Template.compile(CharacterEventTemplate);

logAction("Testing valid payload against compiled schema");
const verification = compiledSchema.validate(sampleData);
if (verification.isSuccess) {
  logSuccess(`Payload verified successfully! Name: ${verification.value.name}, Level: ${verification.value.level}`);
} else {
  logFailure(`Unexpected verification failure: ${String(verification.value)}`);
}

logAction("Testing invalid payload (corrupted fields)");
const corruptedPayload = {
  name: "Corrupted Rogue",
  level: "not-a-number",
  damageType: "arcane-laser",
  equipment: [123],
};

const corruptVerification = compiledSchema.validate(corruptedPayload);
if (corruptVerification.isFailure) {
  logSuccess(`Correctly rejected corrupt payload: ${String(corruptVerification.value)}`);
} else {
  logFailure("Expected corrupted payload to fail validation, but it passed!");
}

logSection("ALL SCHEMA & TEMPLATE TESTS COMPLETED");