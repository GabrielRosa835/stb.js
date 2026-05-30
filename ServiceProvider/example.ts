import { ServiceCollection } from './ServiceProvider';

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
type RequestContext = { id: number; getUser: () => string };
type RandomNumberGenerator = { id: number; getNum: () => number };
type ApplicationLogic = { execute: () => void };

type AppServices = {
    singletonDb: DatabaseService;
    scopedContext: RequestContext;
    transientRng: RandomNumberGenerator;
    appMain: ApplicationLogic;
    
    // Circular dependency test
    circleA: any;
    circleB: any;
};

// --- 3. Container Configuration ---
const serviceProviderFactory = ServiceCollection.create<AppServices>()
    .addSingleton("singletonDb", () => {
        singletonCounter++;
        logCreation(`DatabaseService (Singleton) - ID: ${singletonCounter}`);
        return { 
            id: singletonCounter, 
            query: () => `Data from DB #${singletonCounter}` 
        };
    })
    .addScoped("scopedContext", () => {
        scopedCounter++;
        logCreation(`RequestContext (Scoped) - ID: ${scopedCounter}`);
        return { 
            id: scopedCounter, 
            getUser: () => `User in Scope #${scopedCounter}` 
        };
    })
    .addTransient("transientRng", () => {
        transientCounter++;
        logCreation(`RandomNumberGenerator (Transient) - ID: ${transientCounter}`);
        return { 
            id: transientCounter, 
            getNum: () => Math.random() 
        };
    })
    .addTransient("appMain", (sp) => {
        // Resolution inside a factory
        const { singletonDb: db, scopedContext: ctx } = sp;
        return {
            execute: () => {
                console.log(`      Executing App -> DB: ${db.id} | Context: ${ctx.id}`);
            }
        };
    })
    .addTransient("circleA", (sp) => sp.resolve('circleB'))
    .addTransient("circleB", (sp) => sp.resolve('circleA'))
    .build();

// --- 4. Execution & Verification ---
async function runTests() {
    console.log(`\n${colors.magenta}=== FUNCTIONAL DI CONTAINER TESTS ===${colors.reset}\n`);

    logAction("Initializing Scope 1...");
    const scopedProvider1 = serviceProviderFactory();

    logAction("Testing Proxy Destructuring & Initial Creation (Scope 1)...");
    // This should trigger creations
    const { singletonDb, scopedContext, transientRng } = scopedProvider1;
    logSuccess(`Resolved via Destructuring: DB=${singletonDb.id}, Context=${scopedContext.id}, RNG=${transientRng.id}\n`);

    logAction("Testing Cache Behavior (Scope 1)...");
    const { singletonDb: db1_again, scopedContext: ctx1_again, transientRng: rng1_again } = scopedProvider1;
    
    const isDbCached = singletonDb.id === db1_again.id;
    const isCtxCached = scopedContext.id === ctx1_again.id;
    const isRngNew = transientRng.id !== rng1_again.id;

    if (isDbCached) logSuccess("Singleton was cached correctly.");
    if (isCtxCached) logSuccess("Scoped was cached correctly in Scope 1.");
    if (isRngNew) logSuccess("Transient generated a new instance correctly.\n");

    logAction("Initializing Scope 2...");
    const scopedProvider2 = serviceProviderFactory();

    logAction("Testing Cross-Scope Behavior...");
    const { singletonDb: db2, scopedContext: ctx2 } = scopedProvider2;
    
    if (singletonDb.id === db2.id) logSuccess("Singleton remained the same across scopes.");
    if (scopedContext.id !== ctx2.id) logSuccess("Scoped generated a NEW instance for Scope 2.\n");

    logAction("Testing Nested Dependency Resolution...");
    const { appMain } = scopedProvider1;
    appMain.execute();
    logSuccess("App executed successfully using injected dependencies.\n");

    logAction("Testing Circular Dependency Detection...");
    try {
        const { circleA } = scopedProvider1;
        logError("Circular dependency failed to throw!");
    } catch (error: any) {
        logSuccess(`Caught expected error: ${error.message}\n`);
    }

    console.log(`${colors.magenta}=== TESTS COMPLETE ===${colors.reset}\n`);
}

runTests();