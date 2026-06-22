import { ServiceCollection } from './ServiceProvider';

// Define some interfaces
interface IDatabase { query: () => string; }
interface IUserRepository { getUser: () => string; }
interface IEmailService { send: () => void; }

type Services = {
    "db": IDatabase;
    "emailProvider": IEmailService;
    "userRepo": IUserRepository;
}

// 1. Build the collection fluently
const containerFactory = ServiceCollection.create<Services>()
    // Services that have zero dependencies
    .addSingleton('db', (): IDatabase => ({ 
        query: () => "SELECT * FROM Users" 
    }))
    .addTransient('emailProvider', (): IEmailService => ({ 
        send: () => console.log("Email sent!") 
    }))
    
    // 2. The `sp` injected here is strongly typed with 'db' and 'emailProvider'!
    .addScoped('userRepo', (sp): IUserRepository => {
        // We can safely destructure previously registered services
        const { db } = sp; 
        return { 
            getUser: () => `User fetched via: ${db.query()}` 
        };
    })
    
    // 3. Compile the container
    .build();

// --- Usage ---

// Create a new scope
const scope = containerFactory();

// Destructuring works flawlessly, fully typed!
const { userRepo, emailProvider } = scope;

console.log(userRepo.getUser());
emailProvider.send();