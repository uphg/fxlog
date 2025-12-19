import type { ColorName } from "chalk";

// types.ts
type LogConfigColor = ColorName | null

export interface LogTypeConfig {
  badge: string | null;
  color: LogConfigColor;
  label: string;
  logLevel?: LogLevel;
}

export interface LoggerConfig {
  scope?: string | string[]
  prefix?: string | string[] | (() => string | string[])
  presets?: Array<'filename' | 'date' | 'scope' | 'label' | 'badge'>
  colorScope?: 'all' | 'label-badge' | 'none'
  suffix?: string[]
  underline?: Array<'filename' | 'date' | 'scope' | 'label' | 'badge'>;
  uppercase?: Array<'filename' | 'date' | 'scope' | 'label' | 'badge'>
  types?: Record<string, LogTypeConfig>
  disabled?: boolean
  secrets?: string[]
  logLevel?: LogLevel
}

export type LogLevel = 'info' | 'debug' | 'warn' | 'error' | 'timer';

export type LogArgument = string | number | boolean | object | null | undefined;

export interface ExtendedLoggerConfig extends LoggerConfig {
  types: Record<string, LogTypeConfig>;
}

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
