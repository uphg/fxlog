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
      expect(output).toMatch(/\.\d{3}\]/) // Should have 3 digits
    })
  })

  describe('Filename Extraction', () => {
    test('should extract filename from call stack', () => {
      const logger = createLogger({
        scope: undefined,
        presets: ['filename']
      })
      
      logger.log('test')
      
      const output = consoleSpy.mock.calls[0][0]
      // Should contain a filename with .test.ts extension
      expect(output).toMatch(/\[.*\.test\.ts\]/)
    })

    test('should include filename in brackets', () => {
      const logger = createLogger({
        scope: undefined,
        presets: ['filename']
      })
      
      logger.log('test')
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toMatch(/\[.*\.test\.ts\]/)
    })

    test('should work with different log types', () => {
      const logger = createLogger({
        scope: undefined,
        presets: ['filename']
      })
      
      logger.info('info test')
      logger.warn('warn test')
      logger.error('error test')
      
      const calls = consoleSpy.mock.calls
      calls.forEach((call: any) => {
        expect(call[0]).toMatch(/\[.*\.test\.ts\]/)
      })
    })
  })

  describe('Object Serialization', () => {
    test('should serialize objects using inspect', () => {
      const logger = createLogger({ presets: [] })
      
      const testObj = {
        name: 'test',
        value: 123,
        nested: { inner: true }
      }
      
      logger.log(testObj)
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toContain("{ name: 'test', value: 123, nested: { inner: true } }")
    })

    test('should serialize arrays correctly', () => {
      const logger = createLogger({ presets: [] })
      
      const testArray = [1, 'two', { three: true }]
      
      logger.log(testArray)
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toContain("[ 1, 'two', { three: true } ]")
    })

    test('should handle circular references gracefully', () => {
      const logger = createLogger({ presets: [] })
      
      const circular: any = { name: 'circular' }
      circular.self = circular
      
      // Should not throw and should handle circular reference
      expect(() => logger.log(circular)).not.toThrow()
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
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toContain('level1')
    })
  })

  describe('Message Construction', () => {
    test('should handle empty arguments', () => {
      const logger = createLogger({ presets: [] })
      
      logger.log()
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toContain('LOG') // Should contain LOG with padding
    })

    test('should handle single argument', () => {
      const logger = createLogger({ presets: [] })
      
      logger.log('single')
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toMatch(/LOG\s+single$/)
    })

    test('should handle multiple arguments of different types', () => {
      const logger = createLogger({ presets: [] })
      
      logger.log('string', 42, true, null, undefined, { key: 'value' })
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toContain('string')
      expect(output).toContain('42')
      expect(output).toContain('true')
      expect(output).toContain('null')
      expect(output).toContain('undefined')
      expect(output).toContain("{ key: 'value' }")
    })

    test('should handle special characters in arguments', () => {
      const logger = createLogger({ presets: [] })
      
      logger.log('special chars: \n\t\r\'"\\')
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toContain('special chars: \n\t\r\'"\\')
    })

    test('should handle Unicode characters', () => {
      const logger = createLogger({ presets: [] })
      
      logger.log('unicode: 🚀 💻 🎉 中文测试')
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toContain('unicode: 🚀 💻 🎉 中文测试')
    })
  })

  describe('Performance Considerations', () => {
    test('should handle large numbers of arguments efficiently', () => {
      const logger = createLogger({ presets: [] })
      
      const manyArgs = Array.from({ length: 100 }, (_, i) => `arg${i}`)
      
      const start = performance.now()
      logger.log(...manyArgs)
      const end = performance.now()
      
      expect(end - start).toBeLessThan(100) // Should complete in reasonable time
      expect(consoleSpy).toHaveBeenCalled()
    })

    test('should handle very long strings efficiently', () => {
      const logger = createLogger({ presets: [] })
      
      const longString = 'x'.repeat(10000)
      
      const start = performance.now()
      logger.log(longString)
      const end = performance.now()
      
      expect(end - start).toBeLessThan(50)
      expect(consoleSpy).toHaveBeenCalled()
    })

    test('should handle complex objects efficiently', () => {
      const logger = createLogger({ presets: [] })
      
      const complexObj = {
        array: Array.from({ length: 1000 }, (_, i) => ({ id: i, value: `item${i}` })),
        nested: { level1: { level2: { level3: { data: 'deep' } } } }
      }
      
      const start = performance.now()
      logger.log(complexObj)
      const end = performance.now()
      
      expect(end - start).toBeLessThan(200) // Complex objects may take longer
      expect(consoleSpy).toHaveBeenCalled()
    })
  })
})