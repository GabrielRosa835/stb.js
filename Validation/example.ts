import { Validation } from "./Validation";

// 1. Primitive Validation
const validatePassword = Validation.compose<string>(
    Validation.required(),
    Validation.length(8, 20)
);

// 2. Complex Object Validation
type User = {
    name: string;
    contact: {
        email: string;
    };
    role: "admin" | "user";
};

const validateUser = Validation.compose<User>(
    // Validate top-level primitive
    Validation.field("name", Validation.compose(
        Validation.required(), 
        Validation.length(2, 50))),
    
    // Type-safe union validation
    Validation.field("role", Validation.oneOf(["admin", "user"])),
    
    // Deeply nested validation
    Validation.field("contact", Validation.compose(
        Validation.required(),
        Validation.field("email", Validation.compose(
            Validation.required(), 
            Validation.email()))
    ))
);

// Execution
const result = validateUser({ name: "A", contact: { email: "bad-email" }, role: "admin" });
// result.errors will contain paths like:
// { property: "contact.email", message: "Invalid email" }