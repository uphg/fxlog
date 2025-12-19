import { mainSymbols } from 'figures'
import chalk from 'chalk';
import type { Logger, LoggerConfig, LogLevel, TimerResult, LogArgument } from './types';
import { inspect } from 'node:util';

const defaultConfig: LoggerConfig = {
  scope: 'fxlog',
  presets: ['date', 'label', 'badge'],
  colorScope: 'all',
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
      color: 'yellow',
      label: 'warn'
    },
    error: {
      badge: mainSymbols.cross,
      color: 'red',
      label: 'error'
    },
  }
}

export function createLogger(userConfig: LoggerConfig = {}) {
  const config = {
    ...defaultConfig,
    ...userConfig,
    types: {
      ...defaultConfig.types,
      ...userConfig.types
    }
  };

  const currentScope: string | string[] | undefined = config.scope;
  let isDisabled = config.disabled || false;
  const timers = new Map<string, number>();

  // 计算最长的 label
  const longestLabel = Object.values(config.types).reduce((longest, type) => type.label.length > longest.length ? type.label : longest, '')
  
  const longestBadgeAndScope = Object.values(config.types).reduce((longest, type) => ((type.badge?.length ?? 0) + (config.scope?.length ?? 0)) > longest.length ? type.label : longest, '')

  function buildPrefix(type: string) {
    const prefixParts: string[] = [];

    const userPrefix = typeof config.prefix == 'function' ? config.prefix() : config.prefix 
    
    if (userPrefix?.length) {
      const values = Array.isArray(userPrefix) ? userPrefix : [userPrefix]
      prefixParts.push(...values)
    }
    const typeConfig = config.types[type as keyof typeof config.types]
    config.presets?.forEach(item => {
      let value = null;
      
      switch (item) {
        case 'date':
          value = `[${formatDate()}]`;
          break
        case 'badge': {
          value = config.colorScope === 'label-badge' && typeConfig.color
            ? chalk[typeConfig.color](typeConfig.badge)
            : typeConfig.badge
          break 
        }
        case 'label': {
          let label = typeConfig.label;
          if (shouldUppercase('label', config)) {
            label = label.toUpperCase();
          }
          const paddedLabel = label.padEnd(longestLabel.length);
          const styledPaddedLabel = shouldApplyStyle('label', config)
            ? chalk.underline(paddedLabel)
            : paddedLabel

          value = (config.colorScope === 'all' || config.colorScope === 'none')
            ? styledPaddedLabel
            : (typeConfig.color && chalk[typeConfig.color]
              ? chalk[typeConfig.color](styledPaddedLabel)
              : styledPaddedLabel)
          break        
        }
      }
      if (value && shouldApplyStyle('prefix', config)) {
        value = chalk.underline(value);
      }
      if (value) prefixParts.push(value);
    });

    if (currentScope) {
      const scopes = Array.isArray(currentScope) ? currentScope : [currentScope];
      const scopeStr = scopes.map(s => `[${shouldUppercase('scope', config) ? s.toUpperCase() : s}]`).join(' ');
      const paddedScope = config.presets?.includes('badge') && !typeConfig?.badge ? scopeStr.padStart(longestBadgeAndScope.length + 2) : scopeStr

      prefixParts.push(shouldApplyStyle('scope', config) ? chalk.underline(paddedScope) : paddedScope);
    }
    
    return prefixParts;
  }

  function buildMessage(type: string, ...args: LogArgument[]): { message: string; logLevel: LogLevel } {
    const typeConfig = config.types[type as keyof typeof config.types]
    if (!typeConfig) throw new Error(`Unknown log type: ${type}`);
    
    const prefixParts = buildPrefix(type);
    const messageParts: string[] = [];
    
    if (prefixParts.length > 0) {
      messageParts.push(prefixParts.join(' '));
    }

    // let label = typeConfig.label;
    // if (shouldUppercase('label', config)) {
    //   label = label.toUpperCase();
    // }

    // const styledPaddedLabel = shouldApplyStyle('label', config)
    //   ? chalk.underline(label)
    //   : label

    // const coloredLabel = (config.colorScope === 'all' || config.colorScope === 'none')
    //   ? styledPaddedLabel
    //   : (typeConfig.color && chalk[typeConfig.color]
    //     ? chalk[typeConfig.color](styledPaddedLabel)
    //     : styledPaddedLabel)
        
    // messageParts.push(coloredLabel);
    
    const messageContent = args
      .map(arg => typeof arg === 'string' ? arg : inspect(arg, { colors: false }))
      .join(' ');
    
    const styledMessage = shouldApplyStyle('message', config)
      ? chalk.underline(messageContent)
      : messageContent;
    
    messageParts.push(styledMessage);
    
    const finalMessage = messageParts.join(' ');
    const coloredMessage = config.colorScope === 'all' ? (typeConfig.color && chalk[typeConfig.color]
      ? chalk[typeConfig.color](finalMessage)
      : finalMessage) : finalMessage
    
    return {
      message: coloredMessage,
      logLevel: typeConfig.logLevel || 'info'
    };
  };

  function createLogFn(type: string) {
    return (...args: LogArgument[]) => {
      if (isDisabled) return;
      
      const { message } = buildMessage(type, ...args);
      console.log(message);
    };
  }

  const logger: Logger = {
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
      } as LoggerConfig)
    },
    
    unscope: (): Logger => {
      return createLogger({
        ...config,
        scope: undefined,
        disabled: isDisabled
      } as LoggerConfig)
    },
    
    // 控制方法
    disable: () => {
      isDisabled = true;
    },
    
    enable: () => {
      isDisabled = false;
    }
  };

  return logger as Logger;
}

// 工具函数
function formatDate(): string {
  const now = new Date()

  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
    
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
    
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`
}

function shouldApplyStyle(element: 'scope' | 'label' | 'message' | 'prefix' | 'suffix', config: Record<string, unknown>): boolean {
  const configList = config.underline as Array<'scope' | 'label' | 'message' | 'prefix' | 'suffix'> || [];
  return configList.includes(element);
}

function shouldUppercase(element: 'label' | 'scope', config: Record<string, unknown>): boolean {
  const configList = config.uppercase as Array<'label' | 'scope'> || [];
  return configList.includes(element);
}