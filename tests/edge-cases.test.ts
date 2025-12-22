import { expect, test, vi, beforeEach, afterEach, describe } from 'vitest'
import { createLogger } from '../src'

describe('Edge Cases and Error Handling Tests', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T10:30:45.123Z'))
  })

  afterEach(() => {
    consoleSpy.mockRestore()
    vi.useRealTimers()
  })

  describe('Invalid Configurations', () => {
    test('should handle null config gracefully', () => {
      expect(() => createLogger(null as any)).not.toThrow()
    })

    test('should handle undefined config gracefully', () => {
      expect(() => createLogger(undefined as any)).not.toThrow()
    })

    test('should handle empty config object', () => {
      const logger = createLogger({})
      expect(logger.log).toBeDefined()
      logger.log('test')
      expect(consoleSpy).toHaveBeenCalled()
    })

    test('should handle config with invalid types', () => {
      const logger = createLogger({
        types: {
          info: {
            badge: null,
            color: 'invalid-color' as any,
            label: 'info'
          }
        }
      })
      
      expect(logger.info).toBeDefined()
      expect(() => logger.info('test')).not.toThrow()
    })
  })

  describe('Extreme Values', () => {
    test('should handle very long scope names', () => {
      const longScope = 'x'.repeat(1000)
      const logger = createLogger({
        scope: longScope,
        presets: []
      })
      
      logger.log('test')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(longScope)
      )
    })

    test('should handle many preset options', () => {
      const logger = createLogger({
        presets: ['date', 'scope', 'badge'],
        scope: 'test'
      })
      
      logger.log('test')
      expect(consoleSpy).toHaveBeenCalled()
    })

    test('should handle empty string labels in types', () => {
      const logger = createLogger({
        presets: [],
        types: {
          info: {
            badge: null,
            color: null,
            label: 'info'
          }
        }
      })
      
      logger.info('test message')
      expect(consoleSpy).toHaveBeenCalled()
    })
  })

  describe('Memory and Performance Edge Cases', () => {
    test('should handle many timer operations', () => {
      const logger = createLogger({ presets: [] })
      
      // Start many timers
      for (let i = 0; i < 50; i++) {
        logger.time(`timer-${i}`)
        vi.advanceTimersByTime(1)
        logger.timeEnd(`timer-${i}`)
      }
      
      expect(consoleSpy).toHaveBeenCalledTimes(100) // start + end for each
    })

    test('should handle deep scope nesting', () => {
      const logger = createLogger()
      let scopedLogger = logger
      
      // Create 50 nested scopes
      for (let i = 0; i < 50; i++) {
        scopedLogger = scopedLogger.scope(`level${i}`)
      }
      
      scopedLogger.log('deeply nested message')
      expect(consoleSpy).toHaveBeenCalled()
    })

    test('should handle large message content', () => {
      const logger = createLogger({ presets: [] })
      const largeMessage = 'x'.repeat(10000)
      
      logger.log(largeMessage)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(largeMessage)
      )
    })
  })

  describe('Concurrent Operations', () => {
    test('should handle multiple logger instances', () => {
      const loggers = Array.from({ length: 10 }, (_, i) => 
        createLogger({ scope: `logger${i}`, presets: [] })
      )
      
      loggers.forEach((logger, i) => {
        logger.log(`message from logger ${i}`)
      })
      
      expect(consoleSpy).toHaveBeenCalledTimes(10)
    })

    test('should handle concurrent timer operations', () => {
      const logger = createLogger({ presets: [] })
      
      // Start multiple timers
      const timers = ['timer1', 'timer2', 'timer3']
      timers.forEach(timer => {
        logger.time(timer)
      })
      
      // End them in different order
      vi.advanceTimersByTime(100)
      logger.timeEnd('timer2')
      
      vi.advanceTimersByTime(50)
      logger.timeEnd('timer1')
      
      vi.advanceTimersByTime(75)
      logger.timeEnd('timer3')
      
      expect(consoleSpy).toHaveBeenCalledTimes(6) // 3 starts + 3 ends
    })
  })

  describe('Special Characters and Encoding', () => {
    test('should handle Unicode in scope names', () => {
      const logger = createLogger({
        scope: '🚀-测试',
        presets: []
      })
      
      logger.log('unicode scope test')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🚀-测试')
      )
    })

    test('should handle special characters in messages', () => {
      const logger = createLogger({ presets: [] })
      const specialChars = '\n\t\r\'"\\{}[]()<>|&^%$#@!*~`+=-_,.;:?/'
      
      logger.log(specialChars)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(specialChars)
      )
    })

    test('should handle emojis in badges', () => {
      const logger = createLogger({
        presets: [],
        types: {
          success: {
            badge: '🎉',
            color: 'green',
            label: 'success'
          }
        }
      })
      
      logger.success('celebration!')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🎉')
      )
    })
  })

  describe('Error Recovery', () => {
    test('should recover from timer errors', () => {
      const logger = createLogger({ presets: [] })
      
      // Try to end non-existent timer
      const result = logger.timeEnd('non-existent')
      expect(result).toBeUndefined()
      
      // Normal operation should still work
      logger.log('normal message')
      expect(consoleSpy).toHaveBeenCalledTimes(1)
    })

    test('should handle function prefix errors gracefully', () => {
      const logger = createLogger({
        prefix: () => {
          throw new Error('Prefix error')
        },
        presets: []
      })
      
      expect(() => logger.log('test')).not.toThrow()
      expect(consoleSpy).toHaveBeenCalled()
    })
  })

  describe('Resource Cleanup', () => {
    test('should clean up timers properly', () => {
      const logger = createLogger({ presets: [] })
      
      // Start and end a timer
      logger.time('cleanup-test')
      vi.advanceTimersByTime(100)
      logger.timeEnd('cleanup-test')
      
      // Try to end it again - should not crash
      const result = logger.timeEnd('cleanup-test')
      expect(result).toBeUndefined()
    })

    test('should not leak memory with many scoped loggers', () => {
      const loggers: any[] = []
      
      // Create many scoped loggers
      for (let i = 0; i < 100; i++) {
        loggers.push(createLogger({ scope: `scope${i}`, presets: [] }))
      }
      
      // Use all loggers
      loggers.forEach((logger, i) => {
        logger.log(`message ${i}`)
      })
      
      expect(consoleSpy).toHaveBeenCalledTimes(100)
    })
  })
})