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
        expect.stringMatching(/^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\].*test message$/)
      )
    })

    test('should format date correctly with milliseconds', () => {
      const logger = createLogger({
        scope: undefined,
        presets: ['date']
      })
      
      logger.info('test')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\].*test$/)
      )
    })
  })

  describe('Scope Preset', () => {
    test('should include scope in output', () => {
      const logger = createLogger({
        scope: 'test-scope',
        presets: ['scope']
      })
      
      logger.log('test message')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^\[.*\].*test message$/)
      )
    })

    test('should include date with scope', () => {
      const logger = createLogger({
        scope: 'test-scope',
        presets: ['date', 'scope']
      })
      
      logger.log('test')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\].*\[test-scope\].*test$/)
      )
    })
  })

  describe('Badge Preset', () => {
    test('should include badge for log types that have them', () => {
      const logger = createLogger({
        scope: undefined,
        presets: ['badge']
      })
      
      logger.success('test message')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^\[✓\].*test message$/)
      )
    })

    test('should not include badge for log type without badge', () => {
      const logger = createLogger({
        scope: undefined,
        presets: ['badge']
      })
      
      logger.log('test message')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^.*test message$/)
      )
    })
  })

  describe('Static Prefix Configuration', () => {
    test('should handle string prefix', () => {
      const logger = createLogger({
        prefix: 'PREFIX',
        presets: []
      })
      
      logger.log('test message')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^PREFIX.*test message$/)
      )
    })

    test('should handle array of string prefixes', () => {
      const logger = createLogger({
        prefix: ['PRE1', 'PRE2'],
        presets: []
      })
      
      logger.log('test message')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^PRE1 PRE2.*test message$/)
      )
    })

    test('should combine prefix with presets', () => {
      const logger = createLogger({
        prefix: 'CUSTOM',
        presets: ['scope']
      })
      
      logger.log('test message')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^CUSTOM.*\[.*\].*test message$/)
      )
    })
  })

  describe('Performance and Efficiency', () => {
    test('should handle many prefixes efficiently', () => {
      const manyPrefixes = Array.from({ length: 100 }, (_, i) => `PRE${i}`)
      const logger = createLogger({
        prefix: manyPrefixes,
        presets: []
      })
      
      const start = performance.now()
      logger.log('test message')
      const end = performance.now()
      
      expect(end - start).toBeLessThan(50) // Should complete quickly
      expect(consoleSpy).toHaveBeenCalled()
    })
  })
})