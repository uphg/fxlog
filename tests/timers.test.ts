import { expect, test, vi, beforeEach, afterEach, describe } from 'vitest'
import { createLogger } from '../src'

describe('Timer Functionality Tests', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T10:30:45.000Z'))
  })

  afterEach(() => {
    consoleSpy.mockRestore()
    vi.useRealTimers()
  })

  describe('Basic Timer Operations', () => {
    test('should start a timer with explicit label', () => {
      const logger = createLogger({ presets: [] })
      const label = logger.time('test-timer')
      
      expect(label).toBe('test-timer')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('▶ test-timer Initialized timer...')
      )
    })

    test('should start a timer with implicit label', () => {
      const logger = createLogger({ presets: [] })
      const label = logger.time()
      
      expect(label).toBe('timer_0')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('▶ timer_0 Initialized timer...')
      )
    })

    test('should start multiple timers with implicit labels', () => {
      const logger = createLogger({ presets: [] })
      
      const label1 = logger.time()
      const label2 = logger.time()
      const label3 = logger.time()
      
      expect(label1).toBe('timer_0')
      expect(label2).toBe('timer_1')
      expect(label3).toBe('timer_2')
      
      expect(consoleSpy).toHaveBeenCalledTimes(3)
    })

    test('should end timer with explicit label and return result', () => {
      const logger = createLogger({ presets: [] })
      
      logger.time('test-timer')
      vi.advanceTimersByTime(100)
      
      const result = logger.timeEnd('test-timer')
      
      expect(result).toEqual({
        label: 'test-timer',
        span: 100
      })
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('■ test-timer Timer run for: 100ms')
      )
    })

    test('should end timer with implicit label', () => {
      const logger = createLogger({ presets: [] })
      
      logger.time()
      vi.advanceTimersByTime(50)
      
      const result = logger.timeEnd()
      
      expect(result).toEqual({
        label: 'timer_0',
        span: 50
      })
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('■ timer_0 Timer run for: 50ms')
      )
    })
  })

  describe('Timer Duration Formatting', () => {
    test('should format milliseconds correctly', () => {
      const logger = createLogger({ presets: [] })
      
      logger.time('ms-test')
      vi.advanceTimersByTime(250)
      
      logger.timeEnd('ms-test')
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Timer run for: 250ms')
      )
    })

    test('should format seconds correctly', () => {
      const logger = createLogger({ presets: [] })
      
      logger.time('sec-test')
      vi.advanceTimersByTime(1500)
      
      logger.timeEnd('sec-test')
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Timer run for: 1.50s')
      )
    })

    test('should format seconds with two decimal places', () => {
      const logger = createLogger({ presets: [] })
      
      logger.time('precise-test')
      vi.advanceTimersByTime(1667)
      
      logger.timeEnd('precise-test')
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Timer run for: 1.67s')
      )
    })

    test('should handle zero duration', () => {
      const logger = createLogger({ presets: [] })
      
      logger.time('zero-test')
      // Don't advance time
      
      const result = logger.timeEnd('zero-test')
      
      expect(result?.span).toBe(0)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Timer run for: 0ms')
      )
    })
  })

  describe('Multiple Concurrent Timers', () => {
    test('should handle multiple concurrent timers', () => {
      const logger = createLogger({ presets: [] })
      
      logger.time('timer1')
      vi.advanceTimersByTime(100)
      
      logger.time('timer2')
      vi.advanceTimersByTime(50)
      
      const result2 = logger.timeEnd('timer2')
      vi.advanceTimersByTime(100)
      
      const result1 = logger.timeEnd('timer1')
      
      expect(result2?.span).toBe(50)
      expect(result1?.span).toBe(250)
      
      expect(consoleSpy).toHaveBeenCalledTimes(4) // 2 starts + 2 ends
    })

    test('should clear timer after ending', () => {
      const logger = createLogger({ presets: [] })
      
      logger.time('single-timer')
      logger.timeEnd('single-timer')
      
      // Try to end the same timer again
      const result = logger.timeEnd('single-timer')
      
      expect(result).toBeUndefined()
      
      expect(consoleSpy).toHaveBeenCalledTimes(2) // start + first end
    })

    test('should reuse implicit timer labels', () => {
      const logger = createLogger({ presets: [] })
      
      // Start and end first timer
      logger.time()
      vi.advanceTimersByTime(100)
      logger.timeEnd()
      
      // Start second timer - should reuse timer_0
      const label = logger.time()
      expect(label).toBe('timer_0')
      
      vi.advanceTimersByTime(50)
      const result = logger.timeEnd()
      
      expect(result?.span).toBe(50)
    })
  })

  describe('Timer Error Handling', () => {
    test('should return undefined when ending non-existent timer', () => {
      const logger = createLogger({ presets: [] })
      
      const result = logger.timeEnd('non-existent')
      
      expect(result).toBeUndefined()
      expect(consoleSpy).not.toHaveBeenCalled()
    })

    test('should return undefined when no timers exist for implicit end', () => {
      const logger = createLogger({ presets: [] })
      
      const result = logger.timeEnd()
      
      expect(result).toBeUndefined()
      expect(consoleSpy).not.toHaveBeenCalled()
    })

    test('should handle empty timer label', () => {
      const logger = createLogger({ presets: [] })
      
      const label = logger.time('')
      expect(label).toBe('timer_0') // Default behavior when empty string
      
      vi.advanceTimersByTime(100)
      const result = logger.timeEnd('')
      
      expect(result?.span).toBe(100)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('▶ timer_0 Initialized timer...')
      )
    })
  })

  describe('Timer with Scope and Presets', () => {
    test('should include scope in timer messages', () => {
      const logger = createLogger({
        scope: 'my-app',
        presets: []
      })
      
      logger.time('scoped-timer')
      logger.timeEnd('scoped-timer')
      
      const calls = consoleSpy.mock.calls
      expect(calls[0][0]).toContain('[my-app] ▶')
      expect(calls[1][0]).toContain('[my-app] ■')
    })

    test('should include presets in timer messages', () => {
      vi.setSystemTime(new Date('2024-01-15T10:30:45.123Z'))
      const logger = createLogger({
        scope: undefined,
        presets: ['date']
      })
      
      logger.time('date-timer')
      logger.timeEnd('date-timer')
      
      const calls = consoleSpy.mock.calls
      expect(calls[0][0]).toContain('▶')
      expect(calls[0][0]).toContain('date-timer')
      expect(calls[1][0]).toContain('■')
      expect(calls[1][0]).toContain('date-timer')
    })

    test('should include both scope and presets', () => {
      vi.setSystemTime(new Date('2024-01-15T10:30:45.123Z'))
      const logger = createLogger({
        scope: 'app',
        presets: ['date']
      })
      
      logger.time('full-timer')
      logger.timeEnd('full-timer')
      
      const calls = consoleSpy.mock.calls
      expect(calls[0][0]).toMatch(/^\[2024-01-15 \d{2}:\d{2}:\d{2}\.\d{3}\] \[app\] ▶/)
      expect(calls[1][0]).toMatch(/^\[2024-01-15 \d{2}:\d{2}:\d{2}\.\d{3}\] \[app\] ■/)
    })
  })

  describe('Timer with Disabled State', () => {
    test('should not start timer when disabled', () => {
      const logger = createLogger({
        presets: [],
        disabled: true
      })
      
      const label = logger.time('disabled-timer')
      
      expect(label).toBe('')
      expect(consoleSpy).not.toHaveBeenCalled()
    })

    test('should not end timer when disabled', () => {
      const logger = createLogger({
        presets: [],
        disabled: true
      })
      
      const result = logger.timeEnd('disabled-timer')
      
      expect(result).toBeUndefined()
      expect(consoleSpy).not.toHaveBeenCalled()
    })

    test('should work after enabling from disabled state', () => {
      const logger = createLogger({
        presets: [],
        disabled: true
      })
      
      // Disabled - should not work
      logger.time('should-not-work')
      expect(consoleSpy).not.toHaveBeenCalled()
      
      // Enable - should work
      logger.enable()
      const label = logger.time('should-work')
      
      expect(label).toBe('should-work')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('▶ should-work Initialized timer...')
      )
    })
  })

  describe('Timer Performance and Edge Cases', () => {
    test('should handle many concurrent timers efficiently', () => {
      const logger = createLogger({ presets: [] })
      const timerCount = 100
      const timers: string[] = []
      
      // Start many timers
      for (let i = 0; i < timerCount; i++) {
        timers.push(logger.time(`timer_${i}`))
      }
      
      // End all timers with small delays
      timers.forEach((label) => {
        vi.advanceTimersByTime(1)
        logger.timeEnd(label)
      })
      
      expect(consoleSpy).toHaveBeenCalledTimes(timerCount * 2) // start + end for each
    })

    test('should handle timer with very long duration', () => {
      const logger = createLogger({ presets: [] })
      
      logger.time('long-timer')
      vi.advanceTimersByTime(1000000) // 1000 seconds
      
      const result = logger.timeEnd('long-timer')
      
      expect(result?.span).toBe(1000000)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Timer run for: 1000.00s')
      )
    })

    test('should handle timer with millisecond precision', () => {
      const logger = createLogger({ presets: [] })
      
      logger.time('precise-timer')
      vi.advanceTimersByTime(123.456)
      
      const result = logger.timeEnd('precise-timer')
      
      expect(result?.span).toBe(123)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Timer run for: 123ms')
      )
    })
  })

  describe('Timer Message Formatting', () => {
    test('should format start message correctly', () => {
      const logger = createLogger({ presets: [] })
      
      logger.time('test')
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toContain('▶ test Initialized timer...')
    })

    test('should format end message correctly', () => {
      const logger = createLogger({ presets: [] })
      
      logger.time('test')
      vi.advanceTimersByTime(100)
      logger.timeEnd('test')
      
      const output = consoleSpy.mock.calls[1][0]
      expect(output).toContain('■ test Timer run for:')
      expect(output).toMatch(/\d+(ms|s)$/)
    })

    test('should use correct arrow symbols', () => {
      const logger = createLogger({ presets: [] })
      
      logger.time('symbols')
      vi.advanceTimersByTime(50)
      logger.timeEnd('symbols')
      
      const calls = consoleSpy.mock.calls
      expect(calls[0][0]).toContain('▶') // Start arrow
      expect(calls[1][0]).toContain('■') // End square
    })
  })
})