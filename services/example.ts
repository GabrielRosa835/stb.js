import { ServiceCollection } from "./ServiceCollection";
import { ServiceScopeFactory } from "./ServiceScopeFactory";
import { ServiceType } from "./ServiceType";

// --- 1. Utilities for Visual Logging ---
const colors = {
    reset: "\x1b[0m",
    cyan: "\x1b[36m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    magenta: "\x1b[35m"
};

const logAction = (msg: string) => console.log(`${colors.cyan}➤ ${msg}${colors.reset}`);
const logCreation = (msg: string) => console.log(`${colors.yellow}   [CREATED] ${msg}${colors.reset}`);
const logSuccess = (msg: string) => console.log(`${colors.green}   ✔ ${msg}${colors.reset}`);
const logError = (msg: string) => console.log(`${colors.red}   ✖ ${msg}${colors.reset}`);

// --- 2. Mock Services & Types ---
let transientCounter = 0;
let scopedCounter = 0;
let singletonCounter = 0;

type DatabaseService = { id: number; query: () => string };
namespace DatabaseService {
    export const Type = ServiceType.of<DatabaseService>(Symbol("DatabaseService"));
}

type RequestContext = { id: number; getUser: () => string };
namespace RequestContext {
    export const Type = ServiceType.of<RequestContext>(Symbol("RequestContext"));
}

type RandomNumberGenerator = { id: number; getNum: () => number };
namespace RandomNumberGenerator {
    export const Type = ServiceType.of<RandomNumberGenerator>(Symbol("RandomNumberGenerator"));
}

type ApplicationLogic = { execute: () => void };
namespace ApplicationLogic {
    export const Type = ServiceType.of<ApplicationLogic>(Symbol("ApplicationLogic"));
}

type CircledA = any;
namespace CircledA {
    export const Type = ServiceType.of<CircledA>(Symbol("CircledA"));
}

type CircledB = any;
namespace CircledB {
    export const Type = ServiceType.of<CircledB>(Symbol("CircledB"));
}

// --- 3. Container Configuration ---
const serviceProvider = ServiceCollection.create()
    .addSingleton(DatabaseService.Type, () => {
        singletonCounter++;
        logCreation(`DatabaseService (Singleton) - ID: ${singletonCounter}`);
        return {
            id: singletonCounter,
            query: () => `Data from DB #${singletonCounter}`
        };
    })
    .addScoped(RequestContext.Type, () => {
        scopedCounter++;
        logCreation(`RequestContext (Scoped) - ID: ${scopedCounter}`);
        return {
            id: scopedCounter,
            getUser: () => `User in Scope #${scopedCounter}`
        };
    })
    .addTransient(RandomNumberGenerator.Type, () => {
        transientCounter++;
        logCreation(`RandomNumberGenerator (Transient) - ID: ${transientCounter}`);
        return {
            id: transientCounter,
            getNum: () => Math.random()
        };
    })
    .addTransient(ApplicationLogic.Type, (sp) => {
        // Resolution inside a factory
        const [db, ctx] = sp.get(DatabaseService.Type, RequestContext.Type);
        return {
            execute: () => {
                console.log(`      Executing App -> DB: ${db.id} | Context: ${ctx.id}`);
            }
        };
    })
    .addTransient(CircledA.Type, (sp) => sp.get(CircledB.Type))
    .addTransient(CircledB.Type, (sp) => sp.get(CircledA.Type))
    .build();

// --- 4. Execution & Verification ---
async function runTests() {

    const scopeFactory = serviceProvider.get(ServiceScopeFactory.Type);

    console.log(`\n${colors.magenta}=== FUNCTIONAL DI CONTAINER TESTS ===${colors.reset}\n`);

    logAction("Initializing Scope 1...");
    const scope1 = scopeFactory.createScope();

    logAction("Testing Proxy Destructuring & Initial Creation (Scope 1)...");
    
    // This should trigger creations
    const [db, ctx, rng] = scope1.provider.get(DatabaseService.Type, RequestContext.Type, RandomNumberGenerator.Type);

    logSuccess(`Resolved via Destructuring: DB=${db.id}, Context=${ctx.id}, RNG=${rng.id}\n`);

    logAction("Testing Cache Behavior (Scope 1)...");
    const [db1_again, ctx1_again, rng1_again] = scope1.provider.get(DatabaseService.Type, RequestContext.Type, RandomNumberGenerator.Type);

    const isDbCached = db.id === db1_again.id;
    const isCtxCached = ctx.id === ctx1_again.id;
    const isRngNew = rng.id !== rng1_again.id;

    if (isDbCached) logSuccess("Singleton was cached correctly.");
    if (isCtxCached) logSuccess("Scoped was cached correctly in Scope 1.");
    if (isRngNew) logSuccess("Transient generated a new instance correctly.\n");

    logAction("Initializing Scope 2...");
    const scope2 = scopeFactory.createScope();

    logAction("Testing Cross-Scope Behavior...");
    const [db2, ctx2] = scope2.provider.get(DatabaseService.Type, RequestContext.Type);

    if (db.id === db2.id) logSuccess("Singleton remained the same across scopes.");
    if (ctx.id !== ctx2.id) logSuccess("Scoped generated a NEW instance for Scope 2.\n");

    logAction("Testing Nested Dependency Resolution...");
    const appMain = scope1.provider.get(ApplicationLogic.Type);
    appMain.execute();
    logSuccess("App executed successfully using injected dependencies.\n");

    logAction("Testing Circular Dependency Detection...");
    try {
        const circleA = scope1.provider.get(CircledA.Type);
        logError("Circular dependency failed to throw!");
    } catch (error: any) {
        logSuccess(`Caught expected error: ${error.message}\n`);
    }

    console.log(`${colors.magenta}=== TESTS COMPLETE ===${colors.reset}\n`);
}

runTests();