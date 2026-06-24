import { Validate } from "./Validate";
import { Validation } from "./Validation";

// ---------------------------------------------------------------------------
// 1. Context Setup & Localization
// ---------------------------------------------------------------------------

// We create a specific context for Portuguese users.
const ptBRContext = Validation.createContext({ lang: "pt-BR" });

// We use the interceptor to format messages based on the attached codes.
ptBRContext.addFormatter((error) => {
    switch (error.code) {
        case Validate.required.CODE:
            return `O campo '${error.property || 'desconhecido'}' é estritamente obrigatório.`;
        case Validate.email.CODE:
            return `O formato de email fornecido (${error.attempted}) é inválido.`;
        case Validate.length.CODE:
            return `O campo '${error.property}' possui um tamanho inválido. Valor enviado: "${error.attempted}".`;
        default:
            return; // Fallback to default message
    }
});

// Let's also add a global formatter for English (fallback) just in case
Validation.addFormatter((error) => {
    if (error.code === Validate.required.CODE) {
        return `Property [${error.property}] cannot be empty.`;
    }
    return;
});

// ---------------------------------------------------------------------------
// 2. Schema Definition (Highly Composable)
// ---------------------------------------------------------------------------

type OnboardingPayload = {
    username: string;
    profile: {
        email: string;
        bio: string;
    };
};

// Notice the clean, curried functional composition
const validateOnboarding = Validate.all<OnboardingPayload>(
    Validate.field("username", Validate.all(
        Validate.required(),
        Validate.length({ min: 3, max: 15 })
    )),
    
    // Deeply nested validation
    Validate.field("profile", Validate.all(
        Validate.required(),
        Validate.field("email", Validate.all(
            Validate.required(),
            Validate.email())),
        Validate.field("bio", Validate.length({ max: 100 }))
    ))
);

// ---------------------------------------------------------------------------
// 3. Execution (The "Runnable" Part)
// ---------------------------------------------------------------------------

console.log("--- Executing Validation Library Test ---");

const invalidData: OnboardingPayload = {
    username: "ab", // Fails length (min 3)
    profile: {
        email: "not-an-email", // Fails email regex
        bio: ""
    }
};

console.log("\n[TEST 1] Validating with Global Context (English Fallback)");
const globalResult = validateOnboarding(invalidData);
console.log(`Is Valid? ${globalResult.isValid}`);
globalResult.errors.forEach(err => console.log(` - [${err.code}] ${err.message}`));

console.log("\n[TEST 2] Validating with Localized Context (pt-BR)");
// Simply passing the custom context completely changes the output formatting
const localizedResult = validateOnboarding(invalidData, ptBRContext);
console.log(`Is Valid? ${localizedResult.isValid}`);
localizedResult.errors.forEach(err => console.log(` - [${err.code}] ${err.message}`));