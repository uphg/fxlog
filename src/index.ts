import { mainSymbols } from 'figures'
import chalk from 'chalk';
import type { Logger, LoggerConfig, LogLevel, TimerResult } from './types';
import { inspect } from 'node:util';
import path from 'node:path';

const defaultConfig = {
  scope: 'fxlog',
  presets: ['filename', 'date', 'datetime'],
  colorScope: 'all',
  underline: ['scope', 'label', 'message', 'prefix', 'suffix'],
  uppercase: ['label'],
  types: {
    log: {
      badge: null,
      color: null,
      label: 'log',
    },
    success: {
      badge: mainSymbols.tick ,
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
  }
} as const

test()

function test() {
  const logger = createLogger({
    prefix: ['hi', 'hello']
  })
  logger.log('通用日志')
  logger.success('成功消息')
  logger.info('一般信息')
  logger.warn('警告信息')
  logger.error('错误报告')
}

function createLogger(userConfig: LoggerConfig = {}) {
   // 合并配置
  const config = {
    ...defaultConfig,
    ...userConfig,
    types: {
      ...defaultConfig.types,
      ...userConfig.types
    }
  };

  let currentScope: string | string[] = config.scope;
  let isDisabled = config.disabled || false;
  const timers = new Map<string, number>();

    // 计算最长的 label
  const longestLabel = Object.values(config.types).reduce((longest, type) => type.label.length > longest.length ? type.label : longest, '')

  // 构建前缀
  function buildPrefix() {
    const prefixParts: string[] = [];

    const userPrefix = typeof config.prefix == 'function' ? config.prefix() : config.prefix 
    
    if (userPrefix?.length) {
      const values = Array.isArray(userPrefix) ? userPrefix : [userPrefix]
      prefixParts.push(...values)
    }
    
    // 处理配置的前缀
    config.presets?.forEach(item => {
      let value = '';
      switch (item) {
        case 'date':
          value = `[${formatDate()}]`;
          break;
        case 'datetime':
          value = `[${formatDateTime()}]`;
          break;
        case 'filename':
          value = `[${getFilename()}]`;
          break;
      }
      if (value && shouldApplyStyle('prefix', config)) {
        value = chalk.underline(value);
      }
      if (value) prefixParts.push(value);
    });

    // 处理 scope
    if (currentScope) {
      const scopes = Array.isArray(currentScope) ? currentScope : [currentScope];
      const scopeStr = scopes.map(s => `[${shouldUppercase('scope', config) ? s.toUpperCase() : s}]`).join(' ');
      prefixParts.push(shouldApplyStyle('scope', config) ? chalk.underline(scopeStr) : scopeStr);
    }
    
    return prefixParts;
  }

  function buildMessage(type: string, ...args: any[]): { message: string; logLevel: LogLevel } {
    const typeConfig = config.types[type];
    if (!typeConfig) throw new Error(`Unknown log type: ${type}`);
    
    const prefixParts = buildPrefix();
    const messageParts: string[] = [];
    
    // 添加前缀
    if (prefixParts.length > 0) {
      messageParts.push(prefixParts.join(' '));
    }

    // 处理 label
    let label = typeConfig.label;
    if (shouldUppercase('label', config)) {
      label = label.toUpperCase();
    }
    
    const badgeAndlabel = typeConfig.badge ?  `${typeConfig.badge} ${label}` : label
      
    // 对齐 label
    const paddedLabel = badgeAndlabel.padEnd(longestLabel.length + 2);
    const styledPaddedLabel = shouldApplyStyle('label', config)
      ? chalk.underline(paddedLabel)
      : paddedLabel;

    const coloredLabel = typeConfig.color && chalk[typeConfig.color]
      ? (chalk[typeConfig.color] as any)(styledPaddedLabel)
      : styledPaddedLabel;
    
    messageParts.push(coloredLabel);
    
    // 构建实际消息
    let messageContent = args
      .map(arg => typeof arg === 'string' ? arg : inspect(arg, { colors: false }))
      .join(' ');
    
    // 应用消息样式
    const styledMessage = shouldApplyStyle('message', config)
      ? chalk.underline(messageContent)
      : messageContent;
    
    messageParts.push(styledMessage);
    
    // 应用颜色
    const finalMessage = messageParts.join(' ');
    // const coloredMessage = typeConfig.color && chalk[typeConfig.color]
    //   ? (chalk[typeConfig.color] as any)(finalMessage)
    //   : finalMessage;
    
    return {
      message: finalMessage,
      logLevel: typeConfig.logLevel || 'info'
    };
  };

  function createLogFn(type: string) {
    return (...args: any[]) => {
      if (isDisabled) return;
      
      const { message } = buildMessage(type, ...args);
      console.log(message);
    };
  }

   const logger: any = {
    log: createLogFn('log'),
    info: createLogFn('info'),
    success: createLogFn('success'),
    warn: createLogFn('warn'),
    error: createLogFn('error'),
    
    // Timer 方法
    time: (label?: string): string => {
      if (isDisabled) return '';
      
      const timerLabel = label || `timer_${timers.size}`;
      timers.set(timerLabel, Date.now());
      
      const prefixParts = buildPrefix();
      const messageParts = [...prefixParts];
      
      messageParts.push('[TIMER]');
      messageParts.push(chalk.green('▶'));
      messageParts.push(chalk.green(timerLabel));
      messageParts.push('Initialized timer...');
      
      console.log(messageParts.join(' '));
      return timerLabel;
    },
    
    timeEnd: (label?: string): TimerResult | undefined => {
      if (isDisabled) return undefined;
      
      let timerLabel = label;
      if (!timerLabel && timers.size > 0) {
        const timerKeys = Array.from(timers.keys());
        timerLabel = timerKeys.find(key => key.startsWith('timer_')) || timerKeys[timerKeys.length - 1];
      }
      
      if (!timerLabel || !timers.has(timerLabel)) {
        return undefined;
      }
      
      const startTime = timers.get(timerLabel)!;
      const span = Date.now() - startTime;
      timers.delete(timerLabel);
      
      const prefixParts = buildPrefix();
      const messageParts = [...prefixParts];
      
      messageParts.push('[TIMER]');
      messageParts.push(chalk.red('■'));
      messageParts.push(chalk.red(timerLabel));
      messageParts.push('Timer run for:');
      messageParts.push(chalk.yellow(span < 1000 ? `${span}ms` : `${(span / 1000).toFixed(2)}s`));
      
      console.log(messageParts.join(' '));
      
      return { label: timerLabel, span };
    },
    
    // Scope 方法
    scope: (...scopes: string[]): Logger => {
      const newScopes = (Array.isArray(currentScope) 
        ? [...currentScope, ...scopes]
        : scopes.length === 1 
          ? [scopes[0]]
          : scopes
      ) as LoggerConfig['scope']
      return createLogger({
        ...config,
        scope: newScopes,
        disabled: isDisabled,
      } as any)
    },
    
    unscope: (): Logger => {
      return createLogger({
        ...config,
        scope: undefined,
        disabled: isDisabled
      } as any)
    },
    
    // 控制方法
    disable: () => {
      isDisabled = true;
    },
    
    enable: () => {
      isDisabled = false;
    },
  };

  return logger as Logger;
}

// 工具函数
function formatDate(): string {
  const date = new Date();
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-');
};

function formatDateTime(): string {
  const date = new Date();
  const dateStr = formatDate();
  const timeStr = [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map(n => n.toString().padStart(2, '0'))
    .join(':');
  return `${dateStr} ${timeStr}`;
};

function getFilename(): string {
  const _prepareStackTrace = Error.prepareStackTrace;
  Error.prepareStackTrace = (_, stack) => stack;
  const stack = new Error().stack as any;
  Error.prepareStackTrace = _prepareStackTrace;

  const callers = stack.map((frame: any) => frame.getFileName());
  const firstExternal = callers.find((file: string) => file !== callers[0]);
  
  return firstExternal ? path.basename(firstExternal) : 'anonymous';
}

function shouldApplyStyle(
  element: 'scope' | 'label' | 'message' | 'prefix' | 'suffix',
  config: any
): boolean {
  const configList = config.underline || [];
  return configList.includes(element);
};

function shouldUppercase(
  element: 'label' | 'scope',
  config: any
): boolean {
  const configList = config.uppercase || [];
  return configList.includes(element);
};