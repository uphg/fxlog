import { expect, test, vi, beforeEach, afterEach, describe } from 'vitest'
import { createLogger } from '../src'

describe('Basic Logging Tests', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  describe('Log Types and Badge Display', () => {
    test('should display log without badge', () => {
      const logger = createLogger({ 
        presets: [],
        scope: undefined,
        uppercase: []
      })
      logger.log('Simple log message')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Simple log message')
      )
    })

    test('should display success with checkmark badge', () => {
      const logger = createLogger({ 
        presets: [],
        scope: undefined,
        uppercase: []
      })
      logger.success('Success operation')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[✓] Success operation')
      )
    })

    test('should display info with info badge', () => {
      const logger = createLogger({ 
        presets: [],
        scope: undefined,
        uppercase: []
      })
      logger.info('Information message')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[i] Information message')
      )
    })

    test('should display warning with warning badge', () => {
      const logger = createLogger({ 
        presets: [],
        scope: undefined,
        uppercase: []
      })
      logger.warn('Warning condition')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[!] Warning condition')
      )
    })

    test('should display error with cross badge', () => {
      const logger = createLogger({ 
        presets: [],
        scope: undefined,
        uppercase: []
      })
      logger.error('Error occurred')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[×] Error occurred')
      )
    })
  })

  describe('Message Content Handling', () => {
    test('should handle string arguments', () => {
      const logger = createLogger({ presets: [] })
      logger.log('Simple string')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Simple string')
      )
    })

    test('should handle number arguments', () => {
      const logger = createLogger({ presets: [] })
      logger.log(42)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('42')
      )
    })

    test('should handle boolean arguments', () => {
      const logger = createLogger({ presets: [] })
      logger.log(true)
      logger.log(false)
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('true')
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('false')
      )
    })

    test('should handle null and undefined arguments', () => {
      const logger = createLogger({ presets: [] })
      logger.log(null)
      logger.log(undefined)
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('null')
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('undefined')
      )
    })

    test('should handle object arguments with inspect', () => {
      const logger = createLogger({ presets: [] })
      const obj = { name: 'test', value: 123 }
      logger.log(obj)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('{ name: \'test\', value: 123 }')
      )
    })

    test('should handle array arguments', () => {
      const logger = createLogger({ presets: [] })
      const arr = [1, 2, 3, { nested: 'value' }]
      logger.log(arr)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ 1, 2, 3, { nested: \'value\' } ]')
      )
    })

    test('should handle mixed argument types', () => {
      const logger = createLogger({ presets: [] })
      logger.log('string', 123, true, { key: 'value' }, null)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('string 123 true { key: \'value\' } null')
      )
    })
  })

  describe('Empty and Special Messages', () => {
    test('should handle empty string', () => {
      const logger = createLogger({ presets: [] })
      logger.log('')
      expect(consoleSpy).toHaveBeenCalled()
    })

    test('should handle special characters', () => {
      const logger = createLogger({ presets: [] })
      logger.log('Special chars: \n\t\r\'"\\')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Special chars: \n\t\r\'"\\')
      )
    })

    test('should handle Unicode characters', () => {
      const logger = createLogger({ presets: [] })
      logger.log('Unicode: 🚀 💻 🎉')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unicode: 🚀 💻 🎉')
      )
    })
  })

  describe('Message Length and Performance', () => {
    test('should handle very long messages', () => {
      const logger = createLogger({ presets: [] })
      const longMessage = 'x'.repeat(10000)
      logger.log(longMessage)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(longMessage)
      )
    })

    test('should handle many arguments efficiently', () => {
      const logger = createLogger({ presets: [] })
      const manyArgs = Array.from({ length: 100 }, (_, i) => `arg${i}`)
      
      const start = performance.now()
      logger.log(...manyArgs)
      const end = performance.now()
      
      expect(end - start).toBeLessThan(100) // Should complete in less than 100ms
      expect(consoleSpy).toHaveBeenCalled()
    })
  })
})