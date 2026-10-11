type LogLevel = "trace" | "debug" | "info" | "warning" | "error" | "fatal";

const LogLevel = {
    display: (level: LogLevel) => {
        switch (level) {
            case "trace":
                return "TRC";
            case "debug":
                return "DBG";
            case "info":
                return "INF";
            case "warning":
                return "WAR";
            case "error":
                return "ERR";
            case "fatal":
                return "FTL";
            default:
                throw new Error();
        }
    }
}




type LogDefinition = {
    level: LogLevel;
    message: string;
    arguments?: Record<string, any> | any[];
}

interface LogDefinitionFactory {
    create(def: LogDefinition): LogDefinition;
    create(level: LogLevel, message: string, args?: Record<string, any>): LogDefinition;
    create(level: LogLevel, message: string, ...args: any[]): LogDefinition;
}

const LogDefinition: LogDefinitionFactory = {
    create(defLevel: LogLevel | LogDefinition, message?: string, ...rawArgs: any[]): LogDefinition {
        // Handling Scenario A: Single Object Configuration
        if (typeof defLevel === "object" && defLevel !== null) {
            return defLevel;
        }

        const level = defLevel;
        const msg = message!;

        // Handling Scenario B & C: Unpacking the third argument slot
        if (rawArgs.length === 0) {
            // No 3rd argument was provided at all
            return {
                level,
                message: msg,
            }
        }

        if (rawArgs.length === 1 && !Array.isArray(rawArgs[0]) && typeof rawArgs[0] === "object") {
            // Exactly one argument was passed, and it is a Record object
            return {
                level,
                message: msg,
                arguments: rawArgs[0],
            }
        }

        // Multiple arguments or an array were passed via rest parameters
        return {
            level,
            message: msg,
            arguments: rawArgs,
        };
    }
}











type Timestamper = (log: StructuredLog) => Date;

const Timestamper = {
    default: (log: StructuredLog): Date => {
        return log.timestamp;
    }
}





type FormattedMessage = {
    message: string;
    properties: Record<string, any>;
}

type MessageFormatter = (def: LogDefinition) => FormattedMessage;

const MessageFormatter = {

    default: (def: LogDefinition): FormattedMessage => {

        const properties: Record<string, any> = {};
        const parameters = def.arguments ?? {};
        let arrayIndex = 0;

        // Regular expression to match content inside curly braces {propertyName}
        const tokenRegex = /{([a-zA-Z0-9_#-]+)}/g;

        const message = def.message.replace(tokenRegex, (match, key) => {
            let value: any;

            if (Array.isArray(parameters)) {
                // Positional behavior (Array input)
                value = parameters[arrayIndex];
                properties[key] = value;
                arrayIndex++;
            } else {
                // Named behavior (Object input)
                value = parameters[key];
                properties[key] = value;
            }

            // Fallback to the original placeholder token if no data was found
            if (value === undefined) {
                return match;
            }

            // Serialize objects/arrays to strings nicely, otherwise use native toString
            return typeof value === 'object' ? JSON.stringify(value) : String(value);
        });

        return { message, properties };
    }

}










type StructuredLog = {
    level: LogLevel;
    timestamp: Date;
    context: string;
    rawMessage: string;
    formattedMessage: string;
    rawRecordArguments?: Record<string, any>;
    rawArrayArguments?: any[];
    parsedArguments: Record<string, any>;
}

const StructuredLog = {
    create(
        def: LogDefinition,
        fmt: FormattedMessage,
        context: string,
        timestamper: (log: StructuredLog) => Date)
        : StructuredLog {
        let recordArguments;
        let arrayArguments;
        if (def.arguments !== undefined) {
            if (Array.isArray(def.arguments)) {
                arrayArguments = def.arguments;
            }
            else {
                recordArguments = def.arguments;
            }
        }
        const log = {
            level: def.level,
            timestamp: new Date(),
            context: context,
            rawMessage: def.message,
            formattedMessage: fmt.message,
            rawRecordArguments: recordArguments,
            rawArrayArguments: arrayArguments,
            parsedArguments: fmt.properties,
        }
        log.timestamp = timestamper(log);
        return log;
    }
}












type Sink = (log: StructuredLog) => void;
type SinkRemover = () => void;

interface OverloadedLogger {
    log(def: LogDefinition): void;
    log(level: LogLevel, message: string, args?: Record<string, any>): void;
    log(level: LogLevel, message: string, ...args: any[]): void;

    logTrace(message: string, args?: Record<string, any>): void;
    logTrace(message: string, ...args: any[]): void;

    logDebug(message: string, args?: Record<string, any>): void;
    logDebug(message: string, ...args: any[]): void;

    logInfo(message: string, args?: Record<string, any>): void;
    logInfo(message: string, ...args: any[]): void;

    logWarning(message: string, args?: Record<string, any>): void;
    logWarning(message: string, ...args: any[]): void;

    logError(message: string, args?: Record<string, any>): void;
    logError(message: string, ...args: any[]): void;

    logFatal(message: string, args?: Record<string, any>): void;
    logFatal(message: string, ...args: any[]): void;
}

type Logger = OverloadedLogger;

const Logger = {
    create(ctx: LogContext): OverloadedLogger {

        const _ctx = ctx;

        const log = (def: LogDefinition) => {
            const formatted = _ctx.formatter(def);
            const structured = StructuredLog.create(def, formatted, _ctx.name, _ctx.timestamper);
            return _ctx.sinks.forEach(s => s(structured));
        }

        return {
            log: (arg1: any, arg2?: any, ...rest: any[]) => log(LogDefinition.create(arg1, arg2, ...rest)),
            logTrace: (message: string, ...rest: any[]) => log(LogDefinition.create("trace", message, ...rest)),
            logDebug: (message: string, ...rest: any[]) => log(LogDefinition.create("debug", message, ...rest)),
            logInfo: (message: string, ...rest: any[]) => log(LogDefinition.create("info", message, ...rest)),
            logWarning: (message: string, ...rest: any[]) => log(LogDefinition.create("warning", message, ...rest)),
            logError: (message: string, ...rest: any[]) => log(LogDefinition.create("error", message, ...rest)),
            logFatal: (message: string, ...rest: any[]) => log(LogDefinition.create("fatal", message, ...rest)),
        }
    }
}









type LogContext = {
    addSink: (sink: Sink) => SinkRemover;
    setFormatter: (formatter: MessageFormatter) => void;
    setTimestamper: (timestamper: Timestamper) => void;
    readonly timestamper: Timestamper;
    readonly formatter: MessageFormatter;
    readonly name: string;
    readonly sinks: Sink[];
}

const LogContext = {
    create(name: string): LogContext {

        const _sinks: Set<Sink> = new Set<Sink>();
        const _name = name;
        let _timestamper: Timestamper = Timestamper.default;
        let _formatter: MessageFormatter = MessageFormatter.default;

        function addSink(sink: Sink): SinkRemover {
            _sinks.add(sink);
            return () => _sinks.delete(sink);
        }
        function setFormatter(formatter: MessageFormatter) {
            _formatter = formatter;
        }
        function setTimestamper(timestamper: (log: StructuredLog) => Date) {
            _timestamper = timestamper;
        }

        return {
            addSink,
            setFormatter,
            setTimestamper,
            get sinks() { return [..._sinks]; },
            get formatter() { return _formatter; },
            get name() { return _name; },
            get timestamper() { return _timestamper; }
        }
    }
}













interface StaticLogger {
    def(def: LogDefinition): void;

    message(level: LogLevel, message: string, args?: Record<string, any>): void;
    message(level: LogLevel, message: string, ...args: any[]): void;

    trace(message: string, args?: Record<string, any>): void;
    trace(message: string, ...args: any[]): void;

    debug(message: string, args?: Record<string, any>): void;
    debug(message: string, ...args: any[]): void;

    info(message: string, args?: Record<string, any>): void;
    info(message: string, ...args: any[]): void;

    warning(message: string, args?: Record<string, any>): void;
    warning(message: string, ...args: any[]): void;

    error(message: string, args?: Record<string, any>): void;
    error(message: string, ...args: any[]): void;

    fatal(message: string, args?: Record<string, any>): void;
    fatal(message: string, ...args: any[]): void;
}

type GlobalLogContext = StaticLogger & {
    readonly context: LogContext;
    readonly logger: Logger;
}

const GlobalLogContext = {
    create(): GlobalLogContext {

        const _context = LogContext.create("GLOBAL");
        const _logger = Logger.create(_context);

        return {
            get context() { return _context; },
            get logger() { return _logger; },

            def: _logger.log,
            message: _logger.log,
            trace: _logger.logTrace,
            debug: _logger.logDebug,
            info: _logger.logInfo,
            warning: _logger.logInfo,
            error: _logger.logError,
            fatal: _logger.logFatal,
        }
    }
}


export const Log: GlobalLogContext = GlobalLogContext.create();


export const LogTo = {
    console: (log: StructuredLog) => {
        console.log(`[${log.timestamp} ${log.level}] <${log.context}> ${log.formattedMessage}`);
    }
}