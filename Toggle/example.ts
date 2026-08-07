import { Toggle } from './Toggle';

console.log("--- Testing Toggle.switch ---");

// Injecting a simple console.log as our 'onChange' listener
const mySwitch = Toggle.switch(false, (val) => {
    console.log(`[Switch Event] Value changed to: ${val}`);
});

console.log("Initial switch value:", mySwitch.value);
mySwitch.flip(); 
mySwitch.next(); // Aliased to flip
mySwitch.previous(); // Aliased to flip


console.log("\n--- Testing Toggle.list ---");

type Theme = 'light' | 'dark' | 'system';

const themeToggle = Toggle.list<Theme>(
    ['light', 'dark', 'system'], 
    (newTheme) => {
        console.log(`[Theme Event] UI updated to use '${newTheme}' theme.`);
    }
);

console.log("Initial theme:", themeToggle.value);
themeToggle.next();     // Triggers 'dark'
themeToggle.next();     // Triggers 'system'
themeToggle.next();     // Wraps around to 'light'
themeToggle.previous(); // Wraps backwards to 'system'