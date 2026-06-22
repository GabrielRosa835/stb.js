import { Nest } from "./NestedAccessor";

// --- Usage ---
const user = Nest.for({
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