// ----- example.ts -----
import { Attempt } from "./Attempt";

// --- Mock Functions ---

type User = { name: string; age: number };

// 1. A function that might fail to parse
function parseUser(jsonString: string): Attempt<User, string> {
    try {
        const parsed = JSON.parse(jsonString);
        if (!parsed.name || !parsed.age) {
            return Attempt.failure("Missing required fields");
        }
        return Attempt.success<User, string>(parsed);
    } catch (err) {
        return Attempt.failure("Invalid JSON format");
    }
}

// 2. A validation step for flatMap
function validateAge(user: User): Attempt<User, string> {
    if (user.age < 18) {
        return Attempt.failure("User is too young");
    }
    return Attempt.success(user);
}

// --- Testing the Combinators ---

console.log("--- Testing .map() ---");
const validJson = `{"name": "Alice", "age": 30}`;
const parsedAttempt = parseUser(validJson);

// map transforms {name, age} -> string. 
// Hover over 'greetingAttempt' to see TS infer: Attempt<string, string>
const greetingAttempt = Attempt.map(parsedAttempt, user => `Hello, ${user.name}!`);

if (greetingAttempt.isSuccess) {
    console.log("Map Success:", greetingAttempt.value); // "Hello, Alice!"
}


console.log("\n--- Testing .flatMap() ---");
const underageJson = `{"name": "Bob", "age": 16}`;
const underageAttempt = parseUser(underageJson);

// flatMap chains operations that can fail.
const validatedAttempt = Attempt.flatMap(underageAttempt, validateAge);

if (validatedAttempt.isFailure) {
    console.log("FlatMap Failure (Expected):", validatedAttempt.value); // "User is too young"
}


console.log("\n--- Testing .unwrapOr() ---");
const brokenJson = `{"name": "Charlie", oops...}`;
const brokenAttempt = parseUser(brokenJson);

// Extracts the value or defaults to a fallback.
// TS Infers: { name: string, age: number }
const guaranteedUser = Attempt.unwrapOr(brokenAttempt, { name: "Guest", age: 18 });

console.log("UnwrapOr Result:", guaranteedUser); // { name: 'Guest', age: 18 }