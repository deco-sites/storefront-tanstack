type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
let minLevel: LogLevel = "info";

export function setLogLevel(level: LogLevel) {
  minLevel = level;
}

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= LEVELS[minLevel];
}

export function debug(...args: unknown[]) {
  if (shouldLog("debug")) console.debug(...args);
}

export function info(...args: unknown[]) {
  if (shouldLog("info")) console.info(...args);
}

export function warn(...args: unknown[]) {
  if (shouldLog("warn")) console.warn(...args);
}

export function error(...args: unknown[]) {
  if (shouldLog("error")) console.error(...args);
}

export const logger = { debug, info, warn, error, setLogLevel };
export default logger;
