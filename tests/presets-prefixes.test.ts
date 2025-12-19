import { expect, test, vi, beforeEach, afterEach, describe } from 'vitest'
import { createLogger } from '../src'

describe('Presets and Prefixes Tests', () => {
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

  describe('Date Preset', () => {
    test('should include date in output when date preset is enabled', () => {
      const logger = createLogger({
        scope: undefined,
        presets: ['date']
      })
      
      logger.log('test message')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^\[2024-01-15 \d{2}:\d{2}:\d{2}\.\d{3}\] LOG {7}test message$/)
      )
    })

    test('should format date correctly with milliseconds', () => {
      const logger = createLogger({
        scope: undefined,
        presets: ['date']
      })
      
      logger.info('test')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^\[2024-01-15 \d{2}:\d{2}:\d{2}\.\d{3}\] ℹ INFO {4}test$/)
      )
    })
  })

  describe('Filename Preset', () => {
    test('should include filename when filename preset is enabled', () => {
      const logger = createLogger({
        scope: undefined,
        presets: ['filename']
      })
      
      logger.log('test message')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^\[.*\] LOG {7}test message$/)
      )
    })

    test('should handle filename extraction properly', () => {
      const logger = createLogger({
        scope: undefined,
        presets: ['filename']
      })
      
      logger.error('error message')
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toMatch(/^\[.*\] ✘ ERROR {3}error message$/)
    })
  })

  describe('Multiple Presets', () => {
    test('should combine date and filename presets', () => {
      const logger = createLogger({
        scope: undefined,
        presets: ['date', 'filename']
      })
      
      logger.log('test message')
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toMatch(/^\[2024-01-15 \d{2}:\d{2}:\d{2}\.\d{3}\] \[.*\] LOG {7}test message$/)
    })

    test('should include date with scope', () => {
      const logger = createLogger({
        scope: 'test-scope',
        presets: ['date']
      })
      
      logger.log('test')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^\[2024-01-15 \d{2}:\d{2}:\d{2}\.\d{3}\] \[test-scope\] LOG {7}test$/)
      )
    })
  })

  describe('Static Prefix Configuration', () => {
    test('should handle string prefix', () => {
      const logger = createLogger({
        scope: undefined,
        presets: [],
        prefix: '[PREFIX]'
      })
      
      logger.log('test message')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^\[PREFIX\] LOG {7}test message$/)
      )
    })

    test('should handle array of string prefixes', () => {
      const logger = createLogger({
        scope: undefined,
        presets: [],
        prefix: ['[PRE1]', '[PRE2]']
      })
      
      logger.log('test message')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^\[PRE1\] \[PRE2\] LOG {7}test message$/)
      )
    })

    test('should combine prefix with presets', () => {
      const logger = createLogger({
        scope: undefined,
        presets: ['date'],
        prefix: '[CUSTOM]'
      })
      
      logger.log('test message')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^\[CUSTOM\] \[2024-01-15 \d{2}:\d{2}:\d{2}\.\d{3}\] LOG {7}test message$/)
      )
    })
  })

  describe('Performance and Efficiency', () => {
    test('should handle many prefixes efficiently', () => {
      const manyPrefixes = Array.from({ length: 20 }, (_, i) => `[PREF${i}]`)
      const logger = createLogger({
        scope: undefined,
        presets: [],
        prefix: manyPrefixes
      })
      
      const start = performance.now()
      logger.log('test')
      const end = performance.now()
      
      expect(end - start).toBeLessThan(50)
      expect(consoleSpy).toHaveBeenCalled()
    })
  })
})