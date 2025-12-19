import { expect, test, vi, beforeEach, afterEach, describe } from 'vitest'
import { createLogger } from '../src'

describe('Styling System Tests', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  describe('Uppercase Configuration', () => {
    test('should uppercase label when configured', () => {
      const logger = createLogger({
        scope: undefined,
        presets: [],
        uppercase: ['label']
      })
      
      logger.info('test message')
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toContain('INFO')
      expect(output).not.toContain('info')
    })

    test('should uppercase scope when configured', () => {
      const logger = createLogger({
        scope: 'test-scope',
        presets: [],
        uppercase: ['scope']
      })
      
      logger.log('test message')
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toContain('[TEST-SCOPE]')
      expect(output).not.toContain('[test-scope]')
    })

    test('should handle default uppercase configuration', () => {
      const logger = createLogger({
        scope: 'test-scope',
        presets: []
      })
      
      logger.log('test message')
      
      const output = consoleSpy.mock.calls[0][0]
      // Default should uppercase label but not scope
      expect(output).toContain('[test-scope]')
      expect(output).toContain('LOG')
    })
  })

  describe('Color Scope Configuration', () => {
    test('should not apply color when colorScope is "none"', () => {
      const logger = createLogger({
        scope: undefined,
        presets: [],
        colorScope: 'none'
      })
      
      logger.info('test message')
      
      const output = consoleSpy.mock.calls[0][0]
      // No color should be applied
      expect(output).not.toMatch(/\x1b\[\d+m/)
    })

    test('should apply different colorScope configurations', () => {
      const loggerAll = createLogger({
        scope: undefined,
        presets: [],
        colorScope: 'all'
      })
      
      const loggerLabelBadge = createLogger({
        scope: undefined,
        presets: [],
        colorScope: 'label-badge'
      })
      
      const loggerNone = createLogger({
        scope: undefined,
        presets: [],
        colorScope: 'none'
      })
      
      loggerAll.info('test all')
      loggerLabelBadge.info('test label-badge')
      loggerNone.info('test none')
      
      const calls = consoleSpy.mock.calls
      // All should produce output without crashing
      expect(calls).toHaveLength(3)
      calls.forEach((call: any) => {
        expect(call[0]).toContain('INFO')
      })
    })
  })

  describe('Styling Integration', () => {
    test('should combine uppercase and color styling', () => {
      const logger = createLogger({
        scope: 'test-scope',
        presets: [],
        uppercase: ['scope', 'label'],
        colorScope: 'label-badge'
      })
      
      logger.info('test message')
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toContain('[TEST-SCOPE]')
      expect(output).toContain('INFO')
    })

    test('should handle styling with multiple scopes', () => {
      const logger = createLogger({
        scope: ['scope1', 'scope2'],
        presets: [],
        uppercase: ['scope']
      })
      
      logger.log('test message')
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toContain('[SCOPE1]')
      expect(output).toContain('[SCOPE2]')
    })

    // Custom log types are handled in config tests
  })

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty styling arrays', () => {
      const logger = createLogger({
        scope: 'test',
        presets: [],
        uppercase: [],
        colorScope: 'none'
      })
      
      logger.log('test')
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toContain('[test]')
      expect(output).toContain('log')
      expect(output).not.toMatch(/\x1b\[\d+m/)
    })

    test('should handle invalid uppercase values', () => {
      const logger = createLogger({
        scope: undefined,
        presets: [],
        uppercase: ['invalid' as any]
      })
      
      logger.log('test')
      // Should not crash and should work normally
      expect(consoleSpy).toHaveBeenCalled()
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toContain('log')
    })
  })

  describe('Performance and Efficiency', () => {
    test('should handle styling efficiently with many elements', () => {
      const logger = createLogger({
        scope: Array.from({ length: 10 }, (_, i) => `scope${i}`),
        presets: [],
        uppercase: ['scope', 'label'],
        colorScope: 'label-badge'
      })
      
      const start = performance.now()
      logger.log('test message')
      const end = performance.now()
      
      expect(end - start).toBeLessThan(50)
      expect(consoleSpy).toHaveBeenCalled()
    })

    test('should not apply styling when disabled', () => {
      const logger = createLogger({
        scope: 'test',
        presets: [],
        uppercase: ['label'],
        colorScope: 'all',
        disabled: true
      })
      
      logger.log('should not appear')
      expect(consoleSpy).not.toHaveBeenCalled()
    })
  })
})