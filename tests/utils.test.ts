import { expect, test, vi, beforeEach, afterEach, describe } from 'vitest'
import { createLogger } from '../src'

describe('Utility Functions Tests', () => {
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

  describe('Date Formatting', () => {
    test('should format date correctly with all components', () => {
      const logger = createLogger({
        scope: undefined,
        presets: ['date']
      })
      
      logger.log('test message')
      
      const output = consoleSpy.mock.calls[0][0]
      // Should match format: [YYYY-MM-DD HH:mm:ss.SSS]
      expect(output).toMatch(/^\[2024-01-15 \d{2}:\d{2}:\d{2}\.\d{3}\]/)
    })

    test('should pad single digit months with zero', () => {
      vi.setSystemTime(new Date('2024-01-05T10:30:45.123Z'))
      
      const logger = createLogger({
        scope: undefined,
        presets: ['date']
      })
      
      logger.log('test')
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toMatch(/^\[2024-01-05 /) // Month should be 05
    })

    test('should pad single digit days with zero', () => {
      vi.setSystemTime(new Date('2024-02-05T10:30:45.123Z'))
      
      const logger = createLogger({
        scope: undefined,
        presets: ['date']
      })
      
      logger.log('test')
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toMatch(/^\[2024-02-05 /) // Day should be 05
    })

    test('should pad hours, minutes, and seconds with zeros', () => {
      vi.setSystemTime(new Date('2024-01-15T01:02:03.004Z'))
      
      const logger = createLogger({
        scope: undefined,
        presets: ['date']
      })
      
      logger.log('test')
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toMatch(/^\[2024-01-15 \d{2}:02:03\.004\]/) // Hours may vary by timezone
    })

    test('should pad milliseconds to 3 digits', () => {
      vi.setSystemTime(new Date('2024-01-15T10:30:45.007Z'))
      
      const logger = createLogger({
        scope: undefined,
        presets: ['date']
      })
      
      logger.log('test')
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toMatch(/\.007\]/) // Milliseconds should be 007
    })
  })

  describe('Object Serialization', () => {
    test('should serialize objects using inspect', () => {
      const logger = createLogger({ presets: [] })
      const obj = { name: 'test', value: 123 }
      
      logger.log(obj)
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("{ name: 'test', value: 123 }")
      )
    })

    test('should serialize arrays correctly', () => {
      const logger = createLogger({ presets: [] })
      const arr = [1, 2, 3, { nested: 'value' }]
      
      logger.log(arr)
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ 1, 2, 3, { nested: \'value\' } ]')
      )
    })

    test('should handle circular references gracefully', () => {
      const logger = createLogger({ presets: [] })
      const obj: any = { name: 'test' }
      obj.self = obj // Create circular reference
      
      logger.log(obj)
      
      expect(consoleSpy).toHaveBeenCalled()
      // Should not throw and should handle circular reference
    })

    test('should handle deep objects', () => {
      const logger = createLogger({ presets: [] })
      const deepObj = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: 'deep value'
              }
            }
          }
        }
      }
      
      logger.log(deepObj)
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('deep value')
      )
    })
  })

  describe('Message Construction', () => {
    test('should handle empty arguments', () => {
      const logger = createLogger({
        scope: 'fxlog',
        presets: ['date']
      })
      
      logger.log()
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toContain('[fxlog]')
    })

    test('should handle single argument', () => {
      const logger = createLogger({
        scope: 'fxlog',
        presets: ['date']
      })
      
      logger.log('single')
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toContain('single')
    })

    test('should handle multiple arguments of different types', () => {
      const logger = createLogger({ presets: [] })
      
      logger.log('string', 42, true, { key: 'value' }, null, undefined)
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('string 42 true { key: \'value\' } null undefined')
      )
    })

    test('should handle special characters in arguments', () => {
      const logger = createLogger({ presets: [] })
      
      logger.log('Special: \n\t\r\'"\\')
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Special: \n\t\r\'"\\')
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

  describe('Performance Considerations', () => {
    test('should handle large numbers of arguments efficiently', () => {
      const logger = createLogger({ presets: [] })
      const manyArgs = Array.from({ length: 100 }, (_, i) => `arg${i}`)
      
      const start = performance.now()
      logger.log(...manyArgs)
      const end = performance.now()
      
      expect(end - start).toBeLessThan(100) // Should complete quickly
      expect(consoleSpy).toHaveBeenCalled()
    })

    test('should handle very long strings efficiently', () => {
      const logger = createLogger({ presets: [] })
      const longString = 'x'.repeat(10000)
      
      const start = performance.now()
      logger.log(longString)
      const end = performance.now()
      
      expect(end - start).toBeLessThan(50) // Should complete very quickly
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(longString)
      )
    })

    test('should handle complex objects efficiently', () => {
      const logger = createLogger({ presets: [] })
      const complexObj = {
        data: Array.from({ length: 100 }, (_, i) => ({ id: i, value: `item${i}` })),
        metadata: {
          timestamp: Date.now(),
          version: '1.0.0',
          tags: ['test', 'performance', 'utils']
        }
      }
      
      const start = performance.now()
      logger.log(complexObj)
      const end = performance.now()
      
      expect(end - start).toBeLessThan(200) // Should complete reasonably quickly
      expect(consoleSpy).toHaveBeenCalled()
    })
  })
})