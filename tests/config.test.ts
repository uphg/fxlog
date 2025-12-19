import { expect, test, vi, beforeEach, afterEach, describe } from 'vitest'
import { createLogger } from '../src'
import type { LoggerConfig } from '../src/types'

describe('Configuration System Tests', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  describe('Default Configuration', () => {
    test('should use default config when no config provided', () => {
      const logger = createLogger()
      logger.log('test')
      
      // Should include date preset and default scope
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\] \[fxlog\] LOG/)
      )
    })

    test('should have all default log types', () => {
      const logger = createLogger()
      
      expect(logger.log).toBeDefined()
      expect(logger.info).toBeDefined()
      expect(logger.success).toBeDefined()
      expect(logger.warn).toBeDefined()
      expect(logger.error).toBeDefined()
    })

    test('should use default scope "fxlog"', () => {
      const logger = createLogger({ presets: [] })
      logger.log('test')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[fxlog]')
      )
    })
  })

  describe('Configuration Merging', () => {
    test('should merge user config with default config', () => {
      const userConfig: LoggerConfig = {
        scope: 'custom-scope',
        presets: []
      }
      
      const logger = createLogger(userConfig)
      logger.log('test')
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[custom-scope]')
      )
    })

    test('should preserve default types when user config has no types', () => {
      const userConfig: LoggerConfig = {
        scope: 'test',
        presets: []
      }
      
      const logger = createLogger(userConfig)
      logger.success('test')
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('✔ SUCCESS')
      )
    })

    test('should merge custom types with default types', () => {
      const userConfig: LoggerConfig = {
        presets: [],
        types: {
          debug: {
            badge: '🐛',
            color: 'magenta',
            label: 'debug'
          }
        }
      }
      
      const logger = createLogger(userConfig) as any
      logger.debug('debug message')
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🐛 debug   debug message')
      )
    })

    test('should override default types with user types', () => {
      const userConfig: LoggerConfig = {
        presets: [],
        types: {
          log: {
            badge: '●',
            color: 'blue',
            label: 'custom-log'
          }
        }
      }
      
      const logger = createLogger(userConfig)
      logger.log('test')
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('● custom-log test')
      )
    })
  })

  describe('Custom Log Types', () => {
    test('should create logger with single custom type', () => {
      const customConfig: LoggerConfig = {
        presets: [],
        types: {
          trace: {
            badge: '⚡',
            color: 'yellow',
            label: 'trace'
          }
        }
      }
      
      const logger = createLogger(customConfig) as any
      expect(logger.trace).toBeDefined()
      logger.trace('trace message')
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('⚡ trace   trace message')
      )
    })

    test('should create logger with multiple custom types', () => {
      const customConfig: LoggerConfig = {
        presets: [],
        types: {
          notice: {
            badge: '📢',
            color: 'cyan',
            label: 'notice'
          },
          critical: {
            badge: '🚨',
            color: 'red',
            label: 'critical'
          }
        }
      }
      
      const logger = createLogger(customConfig) as any
      logger.notice('notice message')
      logger.critical('critical message')
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('📢 notice  notice message')
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🚨 critical critical message')
      )
    })

    test('should handle custom types without badges', () => {
      const customConfig: LoggerConfig = {
        presets: [],
        types: {
          simple: {
            badge: null,
            color: null,
            label: 'simple'
          }
        }
      }
      
      const logger = createLogger(customConfig) as any
      logger.simple('simple message')
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('simple   simple message')
      )
    })

    test('should handle custom types without colors', () => {
      const customConfig: LoggerConfig = {
        presets: [],
        types: {
          plain: {
            badge: '○',
            color: null,
            label: 'plain'
          }
        }
      }
      
      const logger = createLogger(customConfig) as any
      logger.plain('plain message')
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('○ plain   plain message')
      )
    })
  })

  describe('Color Configuration', () => {
    test('should respect colorScope configuration', () => {
      const configAll: LoggerConfig = {
        presets: [],
        colorScope: 'all'
      }
      
      const logger = createLogger(configAll)
      logger.info('test')
      // When colorScope is 'all', the entire message gets colored
      expect(consoleSpy).toHaveBeenCalled()
    })

    test('should handle label-badge color scope', () => {
      const configLabelBadge: LoggerConfig = {
        presets: [],
        colorScope: 'label-badge'
      }
      
      const logger = createLogger(configLabelBadge)
      logger.info('test')
      expect(consoleSpy).toHaveBeenCalled()
    })

    test('should handle none color scope', () => {
      const configNone: LoggerConfig = {
        presets: [],
        colorScope: 'none'
      }
      
      const logger = createLogger(configNone)
      logger.info('test')
      expect(consoleSpy).toHaveBeenCalled()
    })
  })

  describe('Disabled State Configuration', () => {
    test('should respect initial disabled state', () => {
      const config: LoggerConfig = {
        presets: [],
        disabled: true
      }
      
      const logger = createLogger(config)
      logger.log('should not appear')
      expect(consoleSpy).not.toHaveBeenCalled()
    })

    test('should allow enabling after initial disabled state', () => {
      const config: LoggerConfig = {
        presets: [],
        disabled: true
      }
      
      const logger = createLogger(config)
      logger.log('should not appear')
      expect(consoleSpy).not.toHaveBeenCalled()
      
      logger.enable()
      logger.log('should appear')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('log     should appear')
      )
    })
  })

  describe('Complex Configuration Scenarios', () => {
    test('should handle complex nested configuration', () => {
      const complexConfig: LoggerConfig = {
        scope: ['app', 'module'],
        presets: ['date'],
        colorScope: 'label-badge',
        uppercase: ['label', 'scope'],
        underline: ['label'],
        types: {
          debug: {
            badge: '🔍',
            color: 'magenta',
            label: 'debug'
          }
        }
      }
      
      const logger = createLogger(complexConfig) as any
      logger.debug('debug message')
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\] \[APP\] \[MODULE\] 🔍 DEBUG {3}debug message$/)
      )
    })

    test('should handle empty configuration object', () => {
      const logger = createLogger({})
      logger.log('test')
      
      // Should work like default
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\] \[fxlog\] LOG/)
      )
    })
  })

  describe('Configuration Validation', () => {
    test('should handle invalid color names gracefully', () => {
      const config: LoggerConfig = {
        presets: [],
        types: {
          test: {
            badge: 'T',
            color: 'invalid-color' as any,
            label: 'test'
          }
        }
      }
      
      const logger = createLogger(config) as any
      expect(() => logger.test('message')).not.toThrow()
    })

    test('should handle null/undefined config values', () => {
      const config: LoggerConfig = {
        presets: [],
        types: {
          test: {
            badge: null,
            color: null,
            label: 'test'
          }
        }
      }
      
      const logger = createLogger(config) as any
      expect(() => logger.test('message')).not.toThrow()
    })
  })
})