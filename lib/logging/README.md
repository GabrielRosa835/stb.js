# Logging Utility (`@src/toolbox/logging`)

A robust, heavily abstracted, and dependency-free logging utility. 

## Inspiration: `Microsoft.Extensions.Logging`

This module takes heavy inspiration from the architectural patterns found in C#'s **`Microsoft.Extensions.Logging`**. Rather than treating logs simply as concatenated strings, this system embraces **State-Based Logging** alongside **Ergonomic Extension Methods**.

Key borrowed concepts include:
1. **Separation of Core vs. Extensions**: Providers only implement a barebones state logging contract (`StateLogger`), while consumers interact with a rich extension interface (`MessageLogger`).
2. **Provider & Factory Pattern**: Loggers are constructed via a `LoggerFactory` that aggregates multiple `LoggerProvider`s (like Console, File, etc.) into a single grouped interface.
3. **Format Semantics**: Message formatting fully supports `.NET`-style template strings, including positional and named parameters, and double-brace escaping.

---

## Architecture Overview

### 1. `StateLogger` (The Core Provider)
The core contract that any logging destination (e.g., Console, File, Server) must implement. It receives a raw generic `State`, an optional `Error`, and a `MessageFormatter`, deferring string interpolation to the very end to save performance if the log level is disabled.

### 2. `MessageLogger` (The Consumer Extensions)
A rich interface containing all the standard string-based logging methods developers expect: `logTrace`, `logDebug`, `logInfo`, `logWarning`, `logError`, and `logFatal`. 

### 3. `Logger` (The Unified Interface)
The union of both `StateLogger` and `MessageLogger`. When you resolve a logger from the factory, it is automatically wrapped in an `ExtendedLogger` which adapts all `MessageLogger` extension calls into standard `StateLogger` payloads.

### 4. `Log` (The Global Facade)
A static namespace acting as the application's global logging singleton. Before configuration, it defaults to a safe `NoOpLogger`. 

---

## Usage Guide

### 1. Configuration
Set up your global logger during application bootstrap by combining providers via `LoggerFactory.Default`:

```typescript
import { Log } from "./toolbox/logging/Log";
import { LoggerFactory } from "./toolbox/logging/abstractions/LoggerFactory";
import { LogTo } from "./toolbox/logging/providers/LogTo";
import { LogLevel } from "./toolbox/logging/LogLevel";

// Wire up the global logger to output to the Console (Info and above)
Log.logger = LoggerFactory.Default("App", [
    LogTo.Console(LogLevel.info)
]);
```

### 2. Standard Logging
Use the `Log` facade anywhere in the application to log messages. 

```typescript
import { Log } from "./toolbox/logging/Log";

Log.info("User logged in successfully.");
Log.error(new Error("Connection failed"), "Failed to connect to the database.");
```

### 3. Message Formatting (Positional & Named)
The default `MessageFormatter` resolves message templates safely.

**Positional Formatting:**
Matched left-to-right based on argument order.
```typescript
Log.info("Player {0} dealt {1} damage to {2}", "Arthas", 50, "Dragon");
// Outputs: Player Arthas dealt 50 damage to Dragon
```

**Named Formatting:**
Matched via object keys. Any `.NET`-style format suffixes (like `:yyyy`) are cleanly ignored for the lookup.
```typescript
Log.info("Player {Name} connected at {Time:hh:mm}", { Name: "Arthas", Time: "12:00" });
// Outputs: Player Arthas connected at 12:00
```

**Escaping Braces:**
If you need literal curly braces in your output, escape them by doubling them: `{{` and `}}`.
```typescript
Log.info("JSON Payload: {{ \"id\": 1 }}");
// Outputs: JSON Payload: { "id": 1 }
```
