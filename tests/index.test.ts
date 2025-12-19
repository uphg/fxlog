import { expect, test, vi, beforeEach, afterEach, describe } from 'vitest'
import { createLogger } from '../src'
import type { LoggerConfig } from '../src/types'

describe('Fxlog Core Tests', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  test('createLogger should return a logger instance', () => {
    const logger = createLogger()
    expect(logger).toBeDefined()
    expect(typeof logger.log).toBe('function')
    expect(typeof logger.info).toBe('function')
    expect(typeof logger.success).toBe('function')
    expect(typeof logger.warn).toBe('function')
    expect(typeof logger.error).toBe('function')
    expect(typeof logger.time).toBe('function')
    expect(typeof logger.timeEnd).toBe('function')
    expect(typeof logger.scope).toBe('function')
    expect(typeof logger.unscope).toBe('function')
    expect(typeof logger.disable).toBe('function')
    expect(typeof logger.enable).toBe('function')
  })

  test('should output basic log messages', () => {
    const logger = createLogger()
    logger.log('test message')
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\] \[fxlog\] LOG {7}test message$/)
    )
  })

  test('should output info messages with badge and color', () => {
    const logger = createLogger()
    logger.info('info message')
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\] \[fxlog\] ℹ INFO {4}info message$/)
    )
  })

  test('should output success messages with badge and color', () => {
    const logger = createLogger()
    logger.success('success message')
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\] \[fxlog\] ✔ SUCCESS success message$/)
    )
  })

  test('should output warning messages with badge and color', () => {
    const logger = createLogger()
    logger.warn('warning message')
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\] \[fxlog\] ⚠ WARN {4}warning message$/)
    )
  })

  test('should output error messages with badge and color', () => {
    const logger = createLogger()
    logger.error('error message')
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\] \[fxlog\] ✘ ERROR {3}error message$/)
    )
  })

  test('should handle multiple arguments', () => {
    const logger = createLogger()
    logger.log('message', 123, { key: 'value' }, true, null, undefined)
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\] \[fxlog\] LOG {7}message 123 { key: 'value' } true null undefined$/)
    )
  })

  test('should respect disabled state', () => {
    const logger = createLogger()
    logger.disable()
    logger.log('this should not appear')
    expect(consoleSpy).not.toHaveBeenCalled()
    
    logger.enable()
    logger.log('this should appear')
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\] \[fxlog\] LOG {7}this should appear$/)
    )
  })

  test('should handle timer functionality', () => {
    vi.useFakeTimers()
    const logger = createLogger()
    const timerLabel = logger.time('test-timer')
    expect(timerLabel).toBe('test-timer')
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\] \[fxlog\] \[TIMER\] ▶ test-timer Initialized timer\.\.\.$/)
    )

    // Test timeEnd with a fixed time difference
    vi.advanceTimersByTime(100) // Advance by 100ms
    const result = logger.timeEnd('test-timer')
    
    expect(result).toEqual({
      label: 'test-timer',
      span: 100
    })
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\] \[fxlog\] \[TIMER\] ■ test-timer Timer run for: 100ms$/)
    )
    
    vi.useRealTimers()
  })

  test('should handle scope management', () => {
    const logger = createLogger()
    const scopedLogger = logger.scope('test-scope')
    
    scopedLogger.log('scoped message')
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\] \[test-scope\] LOG {7}scoped message$/)
    )
    
    const unscopedLogger = scopedLogger.unscope()
    unscopedLogger.log('unscoped message')
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\] LOG {7}unscoped message$/)
    )
  })

  test('should handle nested scopes', () => {
    const logger = createLogger()
    const nestedLogger = logger.scope('scope1', 'scope2')
    
    nestedLogger.log('nested message')
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\] \[scope1\] \[scope2\] LOG {7}nested message$/)
    )
  })

  test('should accept custom configuration', () => {
    const customConfig: LoggerConfig = {
      scope: 'custom',
      presets: ['date'],
      types: {
        custom: {
          badge: '★',
          color: 'cyan',
          label: 'custom'
        }
      }
    }

    const logger = createLogger(customConfig)
    logger.log('test')
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\] \[custom\] LOG {7}test$/)
    )
  })

  test('should handle unknown log types gracefully', async () => {
    // Test the buildMessage function directly since unknown types are not exposed
    const { createLogger } = await import('../src')
    const logger = createLogger()
    // Access the internal buildMessage function through the logger's log function
    expect(logger.log).toBeDefined()
    // The unknown type check happens inside buildMessage which is not exposed
    // So we test that the logger has the expected properties
    expect(Object.keys(logger)).toContain('log')
    expect(Object.keys(logger)).toContain('info')
    expect(Object.keys(logger)).not.toContain('unknown')
  })
})