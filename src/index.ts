import chalk from 'chalk'
import type { Logger, LoggerConfig,  TimerResult, LogArgument } from './types'
import { inspect } from 'node:util'
import { isNil, merge } from 'xfunc'

const defaultConfig: LoggerConfig = {
  scope: 'fxlog',
  presets: ['date', 'scope', 'badge'],
  colorScope: 'all',
  types: {
    log: {
      badge: null,
      color: null,
      label: 'log',
    },
    success: {
      badge: '[✓]' ,
      color: 'green',
      label: 'success'
    },
    info: {
      badge: '[i]',
      color: 'blue',
      label: 'info'
    },
    warn: {
      badge: '[!]',
      color: 'yellow',
      label: 'warn'
    },
    error: {
      badge: '[×]',
      color: 'red',
      label: 'error'
    }
  }
}

function test() {
  const logger = createLogger()

  logger.time()
  logger.log('普通消息')
  logger.success('普通消息')
  logger.info('普通消息')
  logger.warn('普通消息')
  logger.error('普通消息')
  logger.timeEnd()
}

test()

export function createLogger(userConfig: LoggerConfig = {}) {
  const config = merge({}, defaultConfig, userConfig)
  const currentScope: string | string[] | undefined = config.scope;
  const timers = new Map<string, number>()
  let isDisabled = config.disabled || false;

  function buildPrefix(type?: string) {
    const prefixParts: string[] = []
    const typeConfig = config.types![type!]

    config.presets?.forEach((item) => {
      let value = null
      switch(item) {
        case 'date': {
          const date = formatDate()
          value = `[${shouldApplyStyle('date', config) ? chalk.underline(date) : date}]`;
          break
        }
        case 'scope': {
          value = `[${shouldApplyStyle('scope', config) ? chalk.underline(currentScope) : currentScope}]`;
          break
        }
        case 'badge': {
          if (!(type && typeConfig?.badge)) break
          value = config.colorScope === 'badge' && typeConfig?.color
            ? chalk[typeConfig.color](typeConfig.badge)
            : typeConfig.badge
          break 
        }
      }

      const userPrefix = typeof config.prefix == 'function' ? config.prefix() : config.prefix

      if (userPrefix?.length) {
        const values = Array.isArray(userPrefix) ? userPrefix : [userPrefix]
        const prefixs = values.map(item => chalk.underline(item))
        prefixParts.push(...prefixs)
      }

      if (!value) return
      prefixParts.push(value)
    })

    return prefixParts
  }

  function buildMessage(type: string, ...args: LogArgument[]) {
    const typeConfig = config.types![type]
    if (!typeConfig) throw new Error(`Unknown log type: ${type}`)

    const prefixParts = buildPrefix(type);
    const messageParts: string[] = [];

    if (prefixParts?.length) {
      messageParts.push(...prefixParts);
    }

    const messageContent = args
      .map(arg => typeof arg === 'string' ? arg : inspect(arg, { colors: false }))
      .join(' ');
    
    const styledMessage = shouldApplyStyle('message', config)
      ? chalk.underline(messageContent)
      : messageContent

    messageParts.push(styledMessage)

    const notNullMessageParts = messageParts.filter(item => !!item)
    const finalMessage = mergeMessage(notNullMessageParts);
    const coloredMessage = config.colorScope === 'all' ? (typeConfig.color && chalk[typeConfig.color]
      ? chalk[typeConfig.color](finalMessage)
      : finalMessage) : finalMessage

    return {
      message: coloredMessage,
      logLevel: typeConfig.logLevel || 'info'
    };
  }

  function createLogFn(type: string) {
    return (...args: LogArgument[]) => {
      if (isDisabled) return;
      
      const { message } = buildMessage(type, ...args);
      console.log(message);
    };
  }
  const logger = {
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
      const messages = [
        ...prefixParts,
        chalk.green('▶'),
        chalk.green(timerLabel),
        'Initialized timer...'
      ]
      
      console.log(mergeMessage(messages));
      return timerLabel;
    },

    timeEnd: (label?: string): TimerResult | undefined => {
      if (isDisabled) return undefined;
      
      const timerLabel = getTimeLabel(label, timers)
      if (!timerLabel) return
      
      const startTime = timers.get(timerLabel)
      if (isNil(startTime)) {
        console.warn(`Cannot find startTime, timeEnd must be called after the time method`)
        return
      }
      const span = Date.now() - startTime
      timers.delete(timerLabel);
      
      const prefixParts = buildPrefix('timeEnd');
      const messages = [
        ...prefixParts,
        chalk.red('■'),
        chalk.red(timerLabel),
        'Timer run for:',
        chalk.yellow(span < 1000 ? `${span}ms` : `${(span / 1000).toFixed(2)}s`)
      ]
      console.log(messages.join(' '));
      return { label: timerLabel, span };
    },

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

    disable: () => {
      isDisabled = true;
    },
    
    enable: () => {
      isDisabled = false;
    }
  }

  return logger as Logger;
}

function mergeMessage(messages: string[]) {
  return messages.join(' ')
}

function getTimeLabel(label: string | null | undefined, timers: Map<string, number>) {
  let timerLabel = label;
  if (!timerLabel && timers.size > 0) {
    const timerKeys = Array.from(timers.keys());
    timerLabel = timerKeys.find(key => key.startsWith('timer_')) || timerKeys[timerKeys.length - 1];
  }
      
  if (!timerLabel || !timers.has(timerLabel)) {
    return undefined;
  }

  return timerLabel
}

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


function shouldApplyStyle(element: 'date' | 'scope' | 'label' | 'message' | 'prefix' | 'suffix', config: Record<string, unknown>): boolean {
  const configList = config.underline as Array<'date' | 'scope' | 'label' | 'message' | 'prefix' | 'suffix'> || [];
  return configList.includes(element);
}