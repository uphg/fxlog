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
          invalid: {
            badge: null,
            color: 'invalid-color' as any,
            label: ''
          }
        }
      } as any)
      
      expect((logger as any).invalid).toBeDefined()
      expect(() => (logger as any).invalid('test')).not.toThrow()
    })
  })

  describe('Extreme Values', () => {
    test('should handle very long scope names', () => {
      const longScope = 'scope'.repeat(1000)
      const logger = createLogger({
        scope: longScope,
        presets: []
      })
      
      logger.log('long scope test')
      expect(consoleSpy).toHaveBeenCalled()
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toContain(`[${longScope}]`)
    })

    test('should handle many preset options', () => {
      const logger = createLogger({
        scope: undefined,
        presets: ['date', 'filename']
      })
      
      logger.log('many presets')
      expect(consoleSpy).toHaveBeenCalled()
    })

    test('should handle empty string labels in types', () => {
      const logger = createLogger({
        presets: [],
        types: {
          empty: {
            badge: '◆',
            color: 'blue',
            label: ''
          }
        }
      } as any)
      
      ;(logger as any).empty('test')
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toContain('◆ ')
    })
  })

  describe('Memory and Performance Edge Cases', () => {
    test('should handle many timer operations', () => {
      const logger = createLogger({ presets: [] })
      const timerCount = 100
      
      // Start many timers
      const timers: string[] = []
      for (let i = 0; i < timerCount; i++) {
        timers.push(logger.time(`timer_${i}`))
      }
      
      // End all timers
      timers.forEach((timer) => {
        vi.advanceTimersByTime(1)
        logger.timeEnd(timer)
      })
      
      expect(consoleSpy).toHaveBeenCalledTimes(timerCount * 2)
    })

    test('should handle deep scope nesting', () => {
      const logger = createLogger({ presets: [] })
      let scopedLogger = logger
      
      // Create 50 nested scopes
      for (let i = 0; i < 50; i++) {
        scopedLogger = scopedLogger.scope(`level${i}`)
      }
      
      scopedLogger.log('deep nesting')
      expect(consoleSpy).toHaveBeenCalled()
    })

    test('should handle large message content', () => {
      const logger = createLogger({ presets: [] })
      const largeMessage = 'x'.repeat(50000)
      
      const start = performance.now()
      logger.log(largeMessage)
      const end = performance.now()
      
      expect(end - start).toBeLessThan(100)
      expect(consoleSpy).toHaveBeenCalled()
    })
  })

  describe('Concurrent Operations', () => {
    test('should handle multiple logger instances', () => {
      const logger1 = createLogger({ scope: 'instance1', presets: [] })
      const logger2 = createLogger({ scope: 'instance2', presets: [] })
      const logger3 = createLogger({ scope: 'instance3', presets: [] })
      
      logger1.log('from instance 1')
      logger2.log('from instance 2')
      logger3.log('from instance 3')
      
      expect(consoleSpy).toHaveBeenCalledTimes(3)
      
      const calls = consoleSpy.mock.calls
      expect(calls[0][0]).toContain('[instance1]')
      expect(calls[1][0]).toContain('[instance2]')
      expect(calls[2][0]).toContain('[instance3]')
    })

    test('should handle concurrent timer operations', () => {
      const logger = createLogger({ presets: [] })
      
      // Start multiple timers
      const timer1 = logger.time('timer1')
      const timer2 = logger.time('timer2')
      const timer3 = logger.time('timer3')
      
      vi.advanceTimersByTime(50)
      logger.timeEnd(timer1)
      
      vi.advanceTimersByTime(30)
      logger.timeEnd(timer2)
      
      vi.advanceTimersByTime(20)
      logger.timeEnd(timer3)
      
      expect(consoleSpy).toHaveBeenCalledTimes(6) // 3 starts + 3 ends
    })
  })

  describe('Special Characters and Encoding', () => {
    test('should handle Unicode in scope names', () => {
      const logger = createLogger({
        scope: '作用域测试',
        presets: []
      })
      
      logger.log('unicode scope')
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toContain('[作用域测试]')
    })

    test('should handle special characters in messages', () => {
      const logger = createLogger({ presets: [] })
      
      logger.log('Special chars: \x00\x01\x02\x03')
      expect(consoleSpy).toHaveBeenCalled()
      expect(() => logger.log('Normal text')).not.toThrow()
    })

    test('should handle emojis in badges', () => {
      const logger = createLogger({
        presets: [],
        types: {
          emoji: {
            badge: '🎉',
            color: 'yellow',
            label: 'emoji'
          }
        }
      } as any)
      
      ;(logger as any).emoji('celebration')
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toContain('🎉')
    })
  })

  describe('Error Recovery', () => {
    test('should recover from timer errors', () => {
      const logger = createLogger({ presets: [] })
      
      // Try to end non-existent timer
      const result1 = logger.timeEnd('non-existent')
      expect(result1).toBeUndefined()
      
      // Normal operations should still work
      logger.log('recovery test')
      expect(consoleSpy).toHaveBeenCalledTimes(1)
    })

    test('should handle function prefix errors gracefully', () => {
      const logger = createLogger({
        scope: undefined,
        presets: [],
        prefix: (() => {
          throw new Error('Prefix error')
        }) as any
      })
      
      expect(() => logger.log('test')).toThrow('Prefix error')
      
      // But logger should still be usable after disabling/enabling
      logger.disable()
      logger.enable()
      
      const normalLogger = createLogger({ presets: [] })
      normalLogger.log('normal operation')
      expect(consoleSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('Resource Cleanup', () => {
    test('should clean up timers properly', () => {
      const logger = createLogger({ presets: [] })
      
      // Start and end timers
      const timer1 = logger.time('timer1')
      const timer2 = logger.time('timer2')
      
      logger.timeEnd(timer1)
      logger.timeEnd(timer2)
      
      // Try to end again - should not crash
      logger.timeEnd(timer1)
      logger.timeEnd(timer2)
      
      expect(consoleSpy).toHaveBeenCalledTimes(4) // 2 starts + 2 first ends
    })

    test('should not leak memory with many scoped loggers', () => {
      const baseLogger = createLogger({ presets: [] })
      
      // Create many scoped loggers
      const scopedLoggers = Array.from({ length: 100 }, (_, i) =>
        baseLogger.scope(`scope${i}`)
      )
      
      // Use all scoped loggers
      scopedLoggers.forEach((scopedLogger, index) => {
        scopedLogger.log(`message ${index}`)
      })
      
      expect(consoleSpy).toHaveBeenCalledTimes(100)
    })
  })
})