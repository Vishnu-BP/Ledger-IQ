/**
 * @file logger.ts — Tagged logger factory for consistent log lines.
 * @module lib
 *
 * Per CLAUDE.md, no raw console.* anywhere in application code. Every log line
 * is prefixed with a subsystem tag so production output is trivially greppable.
 *
 * @dependencies none
 * @related CLAUDE.md §"Tagged Loggers"
 */

export type LogTag =
  | "AUTH"
  | "API"
  | "UPLOAD"
  | "PARSER"
  | "CATEGORIZE"
  | "RECONCILE"
  | "ANOMALY"
  | "GST"
  | "REPORT"
  | "DB"
  | "LLM"
  | "MW"
  | "UI"
  | "CHAT";

interface Logger {
  info: (message: string, context?: Record<string, unknown>) => void;
  warn: (message: string, context?: Record<string, unknown>) => void;
  error: (message: string, context?: Record<string, unknown>) => void;
}

function format(
  tag: LogTag,
  level: "INFO" | "WARN" | "ERROR",
  message: string,
  context?: Record<string, unknown>,
): string {
  const timestamp = new Date().toISOString();
  const ctx = context ? ` ${JSON.stringify(context)}` : "";
  return `[${timestamp}] [${tag}] [${level}] ${message}${ctx}`;
}

export function createLogger(tag: LogTag): Logger {
  return {
    info: (message, context) => {
      console.log(format(tag, "INFO", message, context));
    },
    warn: (message, context) => {
      console.warn(format(tag, "WARN", message, context));
    },
    error: (message, context) => {
      console.error(format(tag, "ERROR", message, context));
    },
  };
}
