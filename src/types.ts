import type { ColorName } from "chalk";

// types.ts
type LogConfigColor = ColorName | null

type LogPrefixType = 'date' | 'scope' | 'badge'

export interface LogTypeConfig {
  badge: string | null;
  color: LogConfigColor;
  label: string;
  logLevel?: LogLevel;
}

export interface LoggerConfig {
  scope?: string | string[]
  prefix?: string | string[] | (() => string | string[])
  presets?: Array<LogPrefixType>
  colorScope?: 'all' | 'badge' | 'none'
  suffix?: string[]
  underline?: Array<LogPrefixType>;
  uppercase?: Array<LogPrefixType>
  types?: Record<string, LogTypeConfig>
  disabled?: boolean
  secrets?: string[]
  logLevel?: LogLevel
}

export type LogLevel = 'info' | 'debug' | 'warn' | 'error' | 'timer';

export type LogArgument = string | number | boolean | object | null | undefined;

export interface Logger {
  log: (...args: LogArgument[]) => void;
  info: (...args: LogArgument[]) => void;
  success: (...args: LogArgument[]) => void;
  warn: (...args: LogArgument[]) => void;
  error: (...args: LogArgument[]) => void;
  time: (label?: string) => string;
  timeEnd: (label?: string) => TimerResult | undefined;
  scope: (...scopes: string[]) => Logger;
  unscope: () => Logger;
  disable: () => void;
  enable: () => void;
}

export interface TimerResult {
  label: string;
  span: number;
}
