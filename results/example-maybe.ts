import { Maybe } from "./Maybe";

type Employee = { id: number; name: string; managerId?: number };

// --- Mock Database / API ---
const mockDb = new Map<number, Employee>([
    [1, { id: 1, name: "Alice", managerId: 2 }],
    [2, { id: 2, name: "Bob" }], // Bob has no manager
]);

function findUserById(id: number): Maybe<Employee> {
    // perhaps instantly handles the undefined returned by Map.get()
    return Maybe.perhaps(mockDb.get(id));
}

// --- Testing the Combinators ---

console.log("--- Testing .map() & .perhaps() ---");
const aliceMaybe = findUserById(1);

// Extract just the name
const aliceName = Maybe.map(aliceMaybe, user => user.name);
if (aliceName.isPresent) {
    console.log("Found user name:", aliceName.value); // "Alice"
}


console.log("\n--- Testing .flatMap() ---");
// We want to find Alice's manager's name safely.
const alicesManagerName = Maybe.flatMap(findUserById(1), alice => 
    Maybe.flatMap(Maybe.perhaps(alice.managerId), managerId => 
        Maybe.map(findUserById(managerId), manager => manager.name)
    )
);

console.log("Alice's Manager is:", Maybe.unwrapOr(alicesManagerName, "No Manager Found")); // "Bob"

const bobsManagerName = Maybe.flatMap(findUserById(2), bob => 
    Maybe.flatMap(Maybe.perhaps(bob.managerId), managerId => 
        Maybe.map(findUserById(managerId), manager => manager.name)
    )
);
console.log("Bob's Manager is:", Maybe.unwrapOr(bobsManagerName, "No Manager Found")); // "No Manager Found"


console.log("\n--- Testing the throwing .unwrap() ---");
try {
    const missingUser = findUserById(999);
    // This will throw because user 999 does not exist
    const forcedValue = Maybe.unwrap(missingUser); 
    console.log(forcedValue);
} catch (error: any) {
    console.log("Unwrap threw successfully:", error.message);
}