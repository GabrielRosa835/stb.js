import { defineHttpClient } from './httpClient';

// --- Type Definitions for the Example ---
type User = { id: number; name: string; email: string };
type Post = { id: number; userId: number; title: string };

// ==========================================
// LEVEL 1: APPLICATION CONFIGURATION
// ==========================================
// Define the root behaviors for our entire application.
// We apply a global timeout, a base URL, and an authorization interceptor.
const createApiClient = defineHttpClient({
    baseUrl: 'http://localhost:3000/api/v1',
    requestOptions: {
        // App-level default headers
        headers: {
            'X-App-Version': '1.0.0',
            'Accept': 'application/json'
        }
    },
    requestInterceptor: (url, options) => {
        console.log(`[APP-LEVEL LOG] Outgoing request to: ${url}`);
        
        // Simulating injecting an auth token globally
        const headers = new Headers(options.headers);
        headers.set('Authorization', 'Bearer dummy-global-token');
        
        return { ...options, headers };
    }
});


// ==========================================
// LEVEL 2: CONTEXT CONFIGURATION
// ==========================================
// Create specific clients for different domains (Users vs. Posts).
// Notice how we append to the baseUrl and override headers.

const usersClient = createApiClient({
    baseUrl: 'http://localhost:3000/api/v1/users', // Context overrides App baseUrl
    requestOptions: {
        headers: {
            'X-Context': 'UsersService' // Merges with App-level headers
        }
    }
});

const postsClient = createApiClient({
    baseUrl: 'http://localhost:3000/api/v1/posts',
    responseInterceptor: async (res) => {
        // Context-specific behavior: intercepting only Post responses
        if (res.status === 403) {
            console.error('[CONTEXT-LEVEL LOG] Forbidden access to Posts API.');
        }
        return res;
    }
});


// ==========================================
// LEVEL 3: REQUEST CONFIGURATION & EXECUTION
// ==========================================
async function runExample() {
    console.log('--- Starting API Client Example ---\n');

    try {
        // 1. Standard GET request (Inherits App + Users Context)
        console.log('Fetching all users...');
        const users = await usersClient.get<User[]>('/');
        console.log('Users Response:', users);

        // 2. Request with LEVEL 3 Overrides
        console.log('\nFetching a specific user with Request-level overrides...');
        const singleUser = await usersClient.get<User>('/42', {
            requestOptions: {
                headers: {
                    'Cache-Control': 'no-cache', // Request-level header override
                    'X-Context': 'OverriddenInRequest' // Overrides the Context-level header
                }
            }
        });
        console.log('Single User:', singleUser);

        // 3. POST request utilizing auto-JSON serialization from the client
        console.log('\nCreating a new post...');
        const newPost = await postsClient.post<Post>('/', {
            title: 'Functional TypeScript is awesome',
            userId: 42
        });
        console.log('Created Post:', newPost);

        // 4. Bypassing all baseUrls with an absolute URL at the Request level
        console.log('\nFetching data from a completely different absolute URL...');
        const externalData = await usersClient.get<any>('https://jsonplaceholder.typicode.com/todos/1', {
            // Because we pass an absolute URL, the internal logic ignores the baseUrl
            requestInterceptor: (url, options) => {
                console.log(`[REQUEST-LEVEL LOG] Special interceptor just for this call: ${url}`);
                return options;
            }
        });
        console.log('External Data:', externalData);

    } catch (error) {
        console.error('\n[ERROR] Request failed:', error.message);
    }
}

// Execute the example
runExample();