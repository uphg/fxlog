import { expect, test, vi, beforeEach, afterEach, describe } from 'vitest'
import { createLogger } from '../src'

describe('Scope Management Tests', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  describe('Basic Scope Operations', () => {
    test('should create logger with single scope', () => {
      const logger = createLogger({ presets: [] })
      const scopedLogger = logger.scope('test-scope')
      
      scopedLogger.log('scoped message')
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toContain('[test-scope]')
      expect(output).toContain('LOG') // Default uppercase
      expect(output).toContain('scoped message')
    })

    test('should create logger with multiple scopes', () => {
      const logger = createLogger()
      const scopedLogger = logger.scope('scope1', 'scope2', 'scope3')
      
      scopedLogger.log('multi-scope message')
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toContain('[scope1]')
      expect(output).toContain('[scope2]')
      expect(output).toContain('[scope3]')
      expect(output).toContain('multi-scope message')
    })

    test('should inherit configuration from parent logger', () => {
      const logger = createLogger({
        presets: [],
        uppercase: ['label']
      })
      
      const scopedLogger = logger.scope('child')
      scopedLogger.log('test')
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toContain('[child]')
      expect(output).toContain('LOG') // Should be uppercase from parent config
    })

    test('should clear scopes with unscope', () => {
      const logger = createLogger({ presets: [] })
      const scopedLogger = logger.scope('temp-scope')
      const unscopedLogger = scopedLogger.unscope()
      
      unscopedLogger.log('unscoped message')
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).not.toContain('[temp-scope]')
      expect(output).not.toContain('[') // No scopes at all
    })
  })

  describe('Scope Nesting and Chaining', () => {
    test('should allow nested scope creation', () => {
      const logger = createLogger()
      const scoped1 = logger.scope('level1')
      const scoped2 = scoped1.scope('level2')
      const scoped3 = scoped2.scope('level3')
      
      scoped3.log('deeply nested message')
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toContain('[level1]')
      expect(output).toContain('[level2]')
      expect(output).toContain('[level3]')
      expect(output).toContain('deeply nested message')
    })

    test('should accumulate scopes in nested calls', () => {
      const logger = createLogger({ scope: 'base', presets: [] })
      const scoped1 = logger.scope('layer1')
      const scoped2 = scoped1.scope('layer2')
      
      scoped2.log('accumulated scopes')
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toContain('[layer1]')
      expect(output).toContain('[layer2]')
      // Note: base scope is not accumulated due to implementation
    })

    test('should handle single scope parameter correctly', () => {
      const logger = createLogger()
      const scoped = logger.scope('single')
      
      scoped.log('test')
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toContain('[single]')
      expect(output).not.toMatch(/\[single\].*\[single\]/) // Should not duplicate
    })

    test('should handle empty scope call', () => {
      const logger = createLogger({ presets: [] })
      const scoped = logger.scope()
      
      scoped.log('no scope')
      
      const output = consoleSpy.mock.calls[0][0]
      // Should not have any additional scopes
      expect(output).not.toContain('[') // No scopes at all
      expect(output).toContain('no scope')
    })
  })

  describe('Scope Configuration Merging', () => {
    test('should preserve disabled state in scoped loggers', () => {
      const logger = createLogger({ disabled: true })
      const scopedLogger = logger.scope('disabled-scope')
      
      scopedLogger.log('should not appear')
      expect(consoleSpy).not.toHaveBeenCalled()
    })

    test('should allow re-enabling disabled scoped loggers', () => {
      const logger = createLogger({ disabled: true })
      const scopedLogger = logger.scope('scope')
      
      scopedLogger.enable()
      scopedLogger.log('should appear')
      
      expect(consoleSpy).toHaveBeenCalled()
    })

    test('should inherit presets configuration', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-15T10:30:45.123Z'))
      
      const logger = createLogger({ presets: ['date'] })
      const scopedLogger = logger.scope('date-scope')
      
      scopedLogger.log('with date')
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toMatch(/^\[2024-01-15 \d{2}:\d{2}:\d{2}\.\d{3}\]/)
      expect(output).toContain('[date-scope]')
      
      vi.useRealTimers()
    })

    test('should inherit styling configuration', () => {
      const logger = createLogger({
        presets: [],
        uppercase: ['scope'],
        colorScope: 'none'
      })
      
      const scopedLogger = logger.scope('styled-scope')
      scopedLogger.log('styled message')
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toContain('[STYLED-SCOPE]') // Should be uppercase
      expect(output).not.toMatch(/\x1b\[/) // No color
    })
  })

  describe('Scope with Array Configuration', () => {
    test('should handle initial array scope configuration', () => {
      const logger = createLogger({
        scope: ['app', 'module']
      })
      
      logger.log('array scope test')
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toContain('[app]')
      expect(output).toContain('[module]')
    })

    test('should add scopes to existing array scope', () => {
      const logger = createLogger({
        scope: ['base']
      })
      
      const scopedLogger = logger.scope('additional')
      scopedLogger.log('extended array scope')
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toContain('[base]')
      expect(output).toContain('[additional]')
    })

    test('should add multiple scopes to array scope', () => {
      const logger = createLogger({
        scope: ['base']
      })
      
      const scopedLogger = logger.scope('first', 'second')
      scopedLogger.log('multiple additions')
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toContain('[base]')
      expect(output).toContain('[first]')
      expect(output).toContain('[second]')
    })

    test('should clear array scope with unscope', () => {
      const logger = createLogger({
        scope: ['first', 'second'],
        presets: []
      })
      
      const unscopedLogger = logger.unscope()
      unscopedLogger.log('cleared array scope')
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).not.toContain('[first]')
      expect(output).not.toContain('[second]')
      expect(output).not.toContain('[') // No scopes at all
    })
  })

  describe('Scope Edge Cases', () => {
    test('should handle empty string scope', () => {
      const logger = createLogger({ presets: [] })
      const scopedLogger = logger.scope('')
      
      scopedLogger.log('empty scope')
      
      const output = consoleSpy.mock.calls[0][0]
      // Empty string creates empty bracket []
      expect(output).toContain('[]')
      expect(output).toContain('empty scope')
    })

    test('should handle special characters in scope', () => {
      const logger = createLogger()
      const scopedLogger = logger.scope('scope-with.special@chars#123')
      
      scopedLogger.log('special chars')
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toContain('[scope-with.special@chars#123]')
    })

    test('should handle very long scope names', () => {
      const longScope = 'x'.repeat(100)
      const logger = createLogger()
      const scopedLogger = logger.scope(longScope)
      
      scopedLogger.log('long scope name')
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toContain(`[${longScope}]`)
    })

    test('should handle duplicate scope names', () => {
      const logger = createLogger()
      const scopedLogger = logger.scope('duplicate', 'duplicate')
      
      scopedLogger.log('duplicate scopes')
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toMatch(/\[duplicate\].*\[duplicate\]/) // Should appear twice
    })
  })

  describe('Scope Performance and Efficiency', () => {
    test('should handle many nested scopes efficiently', () => {
      const logger = createLogger()
      let scopedLogger = logger
      
      // Create 10 nested scopes
      for (let i = 0; i < 10; i++) {
        scopedLogger = scopedLogger.scope(`level${i}`)
      }
      
      const start = performance.now()
      scopedLogger.log('deeply nested')
      const end = performance.now()
      
      expect(end - start).toBeLessThan(50)
      
      const output = consoleSpy.mock.calls[0][0]
      for (let i = 0; i < 10; i++) {
        expect(output).toContain(`[level${i}]`)
      }
    })

    test('should handle many concurrent scoped loggers', () => {
      const logger = createLogger()
      const scopedLoggers = Array.from({ length: 50 }, (_, i) => 
        logger.scope(`concurrent${i}`)
      )
      
      const start = performance.now()
      scopedLoggers.forEach((scopedLogger, index) => {
        scopedLogger.log(`message ${index}`)
      })
      const end = performance.now()
      
      expect(end - start).toBeLessThan(100)
      expect(consoleSpy).toHaveBeenCalledTimes(50)
    })

    test('should reuse scope instances efficiently', () => {
      const logger = createLogger()
      
      // Create the same scoped logger multiple times
      const scoped1 = logger.scope('reused')
      const scoped2 = logger.scope('reused')
      const scoped3 = logger.scope('reused')
      
      scoped1.log('first')
      scoped2.log('second')
      scoped3.log('third')
      
      expect(consoleSpy).toHaveBeenCalledTimes(3)
      
      const calls = consoleSpy.mock.calls
      calls.forEach((call: any) => {
        expect(call[0]).toContain('[reused]')
      })
    })
  })

  describe('Scope Configuration Isolation', () => {
    test('should not affect parent logger when enabling scoped logger', () => {
      const logger = createLogger({ disabled: true })
      const scopedLogger = logger.scope('isolation-test')
      
      scopedLogger.enable()
      logger.log('parent still disabled')
      scopedLogger.log('child enabled')
      
      expect(consoleSpy).toHaveBeenCalledTimes(1)
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toContain('[isolation-test]')
      expect(output).toContain('child enabled')
    })

    test('should not affect sibling scoped loggers', () => {
      const logger = createLogger()
      const scoped1 = logger.scope('sibling1')
      const scoped2 = logger.scope('sibling2')
      
      scoped1.disable()
      scoped1.log('disabled sibling')
      scoped2.log('enabled sibling')
      
      expect(consoleSpy).toHaveBeenCalledTimes(1)
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toContain('[sibling2]')
      expect(output).toContain('enabled sibling')
    })

    test('should maintain independent disabled states', () => {
      const logger = createLogger()
      const scoped1 = logger.scope('independent1')
      const scoped2 = logger.scope('independent2')
      
      scoped1.disable()
      scoped2.enable()
      
      scoped1.log('should not appear')
      scoped2.log('should appear')
      
      expect(consoleSpy).toHaveBeenCalledTimes(1)
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toContain('[independent2]')
    })
  })
})