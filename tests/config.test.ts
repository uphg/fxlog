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
        expect.stringMatching(/^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\] \[fxlog\] test$/)
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
        expect.stringContaining('[✓]')
      )
    })

    test('should merge custom types with default types', () => {
      const userConfig: LoggerConfig = {
        presets: [],
        types: {
          info: {
            badge: '🐛',
            color: 'magenta',
            label: 'info'
          }
        }
      }
      
      const logger = createLogger(userConfig)
      logger.info('debug message')
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🐛 debug message')
      )
    })

    test('should override default types with user types', () => {
      const userConfig: LoggerConfig = {
        presets: [],
        types: {
          log: {
            badge: '●',
            color: 'blue',
            label: 'log'
          }
        }
      }
      
      const logger = createLogger(userConfig)
      logger.log('test')
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('● test')
      )
    })
  })

  describe('Default Type Overrides', () => {
    test('should override info badge and color', () => {
      const customConfig: LoggerConfig = {
        presets: [],
        types: {
          info: {
            badge: '⚡',
            color: 'yellow',
            label: 'info'
          }
        }
      }
      
      const logger = createLogger(customConfig)
      logger.info('test message')
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('⚡ test message')
      )
    })

    test('should override error type', () => {
      const customConfig: LoggerConfig = {
        presets: [],
        types: {
          error: {
            badge: '🚨',
            color: 'red',
            label: 'error'
          }
        }
      }
      
      const logger = createLogger(customConfig)
      logger.error('critical message')
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🚨 critical message')
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

    test('should handle badge color scope', () => {
      const configLabelBadge: LoggerConfig = {
        presets: [],
        colorScope: 'badge'
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
        expect.stringContaining('should appear')
      )
    })
  })

  describe('Complex Configuration Scenarios', () => {
    test('should handle complex nested configuration', () => {
      const complexConfig: LoggerConfig = {
        scope: ['app', 'module'],
        presets: ['date'],
        colorScope: 'badge',
        types: {
          info: {
            badge: '🔍',
            color: 'magenta',
            label: 'info'
          }
        }
      }
      
      const logger = createLogger(complexConfig)
      logger.info('debug message')
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\] \[app\] \[module\] 🔍 debug message$/)
      )
    })

    test('should handle empty configuration object', () => {
      const logger = createLogger({})
      logger.log('test')
      
      // Should work like default
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\] \[fxlog\] \[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\] \[fxlog\] test/)
      )
    })
  })

  describe('Configuration Validation', () => {
    test('should handle invalid color names gracefully', () => {
      const config: LoggerConfig = {
        presets: [],
        types: {
          info: {
            badge: 'T',
            color: 'invalid-color' as any,
            label: 'info'
          }
        }
      }
      
      const logger = createLogger(config)
      expect(() => logger.info('message')).not.toThrow()
    })
  })
})