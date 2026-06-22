import { Validate } from "./Validate";

// 1. Primitive Validation
const validatePassword = Validate.all<string>(
    Validate.required(),
    Validate.length({ min: 8, max: 20 }));

// 2. Complex Object Validation
type User = {
    name: string;
    contact: {
        email: string;
    };
    role: "admin" | "user";
};

const validateUser = Validate.all<User>(
    
    Validate.field("name", Validate.all(
        Validate.required(),
        Validate.length({ min: 2, max: 50 }),
    )),

    // Type-safe union validation
    Validate.field("role", Validate.oneOf(["admin", "user"])),

    // Deeply nested validation
    Validate.field("contact", Validate.all(
        Validate.required(),
        Validate.field("email", Validate.all(
            Validate.required(),
            Validate.email()))
    ))
);

// Execution
const result = validateUser({ name: "A", contact: { email: "bad-email" }, role: "admin" });
// result.errors will contain paths like:
// { property: "contact.email", message: "Invalid email" }