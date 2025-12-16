// types.ts
import { mainSymbols } from 'figures';

type defaultColor = 'green' | 'blue' | 'yellowBright' | 'red' | null

export interface LogTypeConfig {
  badge: string | null;
  color: defaultColor;
  label: string;
  logLevel?: LogLevel;
}

export interface LoggerConfig {
  scope?: string | string[];
  prefix?: string | string[] | (() => string | string[])
  presets?: Array<'filename' | 'date' | 'datetime'>;
  colorScope?: 'all' | 'label-badge' | 'badge' | 'label' | 'none'
  suffix?: string[];
  underline?: Array<'scope' | 'label' | 'message' | 'prefix' | 'suffix'>;
  uppercase?: Array<'label' | 'scope'>;
  types?: Record<string, LogTypeConfig>;
  disabled?: boolean;
  secrets?: string[];
  logLevel?: LogLevel;
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

// 默认配置
export const defaultConfig = {
  scope: 'fxlog',
  prefix: ['filename', 'date', 'datetime'] as const,
  underline: ['scope', 'label', 'message', 'prefix', 'suffix'] as const,
  uppercase: ['label'] as const,
  types: {
    log: {
      badge: null,
      color: null,
      label: 'log',
    },
    success: {
      badge: mainSymbols.tick,
      color: 'green',
      label: 'success'
    },
    info: {
      badge: mainSymbols.info,
      color: 'blue',
      label: 'info'
    },
    warn: {
      badge: mainSymbols.warning,
      color: 'yellowBright',
      label: 'warn'
    },
    error: {
      badge: mainSymbols.cross,
      color: 'red',
      label: 'error'
    },
  } as const
} satisfies Omit<LoggerConfig, 'types'> & { types: Record<string, LogTypeConfig> };