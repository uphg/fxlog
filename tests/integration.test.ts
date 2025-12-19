import { expect, test, vi, beforeEach, afterEach, describe } from 'vitest'
import { createLogger } from '../src'

describe('Integration Tests', () => {
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

  describe('Complete Feature Integration', () => {
    test('should integrate all major features', () => {
      const logger = createLogger({
        scope: ['app', 'module'],
        presets: ['date', 'filename'],
        uppercase: ['scope', 'label'],
        colorScope: 'label-badge'
      })
      
      logger.info('integration test')
      logger.success('success message')
      logger.error('error occurred')
      
      expect(consoleSpy).toHaveBeenCalledTimes(3)
      
      const calls = consoleSpy.mock.calls
      calls.forEach(call => {
        const output = call[0]
        expect(output).toContain('[2024-01-15') // Date
        expect(output).toContain('[app]') // Scope 1
        expect(output).toContain('[module]') // Scope 2
        expect(output).toMatch(/\[.*\.test\.ts\]/) // Filename
      })
      
      expect(calls[0][0]).toContain('INFO') // Uppercase
      expect(calls[1][0]).toContain('SUCCESS')
      expect(calls[2][0]).toContain('ERROR')
    })

    test('should integrate timers with scopes and presets', () => {
      const logger = createLogger({
        scope: 'performance-test',
        presets: ['date']
      })
      
      const timer1 = logger.time('database-query')
      vi.advanceTimersByTime(150)
      const result1 = logger.timeEnd('database-query')
      
      const timer2 = logger.time('api-request')
      vi.advanceTimersByTime(80)
      const result2 = logger.timeEnd('api-request')
      
      expect(result1).toEqual({ label: 'database-query', span: 150 })
      expect(result2).toEqual({ label: 'api-request', span: 80 })
      
      expect(consoleSpy).toHaveBeenCalledTimes(4) // 2 starts + 2 ends
      
      const calls = consoleSpy.mock.calls
      calls.forEach(call => {
        const output = call[0]
        expect(output).toContain('[2024-01-15') // Date
        expect(output).toContain('[performance-test]') // Scope
        expect(output).toContain('[TIMER]') // Timer
      })
    })

    test('should integrate custom types with styling', () => {
      const logger = createLogger({
        scope: 'custom-app',
        presets: ['date'],
        uppercase: ['label'],
        colorScope: 'all',
        types: {
          debug: {
            badge: '🐛',
            color: 'magenta',
            label: 'debug'
          },
          trace: {
            badge: '⚡',
            color: 'cyan',
            label: 'trace'
          }
        }
      } as any)
      
      ;(logger as any).debug('Debug information')
      ;(logger as any).trace('Trace information')
      logger.success('Standard success')
      
      expect(consoleSpy).toHaveBeenCalledTimes(3)
      
      const calls = consoleSpy.mock.calls
      expect(calls[0][0]).toContain('🐛 DEBUG')
      expect(calls[1][0]).toContain('⚡ TRACE')
      expect(calls[2][0]).toContain('✔ SUCCESS')
    })
  })

  describe('Complex Workflow Scenarios', () => {
    test('should handle request logging workflow', () => {
      const logger = createLogger({
        scope: 'api-server',
        presets: ['date'],
        uppercase: ['label']
      })
      
      // Start request
      const requestId = `req_${Date.now()}`
      const requestLogger = logger.scope('request').scope(requestId)
      
      requestLogger.info('Request started')
      
      // Timer for processing
      const timer = requestLogger.time('processing')
      vi.advanceTimersByTime(120)
      
      // Database operation
      const dbLogger = requestLogger.scope('database')
      dbLogger.info('Query executed')
      
      vi.advanceTimersByTime(80)
      const timerResult = requestLogger.timeEnd('processing')
      
      // Response
      requestLogger.success('Request completed')
      
      expect(timerResult).toEqual({ label: 'processing', span: 200 })
      expect(consoleSpy).toHaveBeenCalledTimes(5)
      
      const calls = consoleSpy.mock.calls
      expect(calls[0][0]).toContain('[request] [req_1705312245123] INFO')
      expect(calls[1][0]).toContain('[request] [req_1705312245123] [TIMER]')
      expect(calls[2][0]).toContain('[request] [req_1705312245123] [database] INFO')
      expect(calls[3][0]).toContain('[request] [req_1705312245123] [TIMER]')
      expect(calls[4][0]).toContain('[request] [req_1705312245123] SUCCESS')
    })

    test('should handle error handling workflow', () => {
      const logger = createLogger({
        scope: 'error-handler',
        presets: ['date'],
        colorScope: 'label-badge'
      })
      
      const errorLogger = logger.scope('critical')
      
      errorLogger.warn('Warning condition detected')
      
      const timer = errorLogger.time('error-resolution')
      vi.advanceTimersByTime(50)
      
      errorLogger.error('Error occurred during processing')
      
      vi.advanceTimersByTime(30)
      const timerResult = errorLogger.timeEnd('error-resolution')
      
      errorLogger.info('Error resolution completed')
      
      expect(timerResult).toEqual({ label: 'error-resolution', span: 80 })
      expect(consoleSpy).toHaveBeenCalledTimes(4)
    })
  })

  describe('Configuration Combinations', () => {
    test('should handle complex prefix combinations', () => {
      const logger = createLogger({
        scope: 'prefix-test',
        presets: ['date'],
        prefix: ['[ENV:PROD]', '[VERSION:1.0.0]'],
        uppercase: ['label']
      })
      
      logger.info('Complex prefix test')
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toContain('[ENV:PROD]')
      expect(output).toContain('[VERSION:1.0.0]')
      expect(output).toContain('[2024-01-15')
      expect(output).toContain('[prefix-test]')
      expect(output).toContain('INFO')
    })

    test('should handle disabled state propagation', () => {
      const baseLogger = createLogger({ disabled: true })
      const scoped1 = baseLogger.scope('level1')
      const scoped2 = scoped1.scope('level2')
      const scoped3 = scoped2.scope('level3')
      
      scoped3.log('should not appear')
      expect(consoleSpy).not.toHaveBeenCalled()
      
      // Enable at deepest level
      scoped3.enable()
      scoped3.log('should appear from level 3')
      
      // Parent should still be disabled
      scoped2.log('should not appear from level 2')
      baseLogger.log('should not appear from base')
      
      expect(consoleSpy).toHaveBeenCalledTimes(1)
      
      const output = consoleSpy.mock.calls[0][0]
      expect(output).toContain('[level1]')
      expect(output).toContain('[level2]')
      expect(output).toContain('[level3]')
    })
  })

  describe('Performance Integration', () => {
    test('should handle high-volume logging efficiently', () => {
      const logger = createLogger({
        scope: 'performance-test',
        presets: ['date']
      })
      
      const messageCount = 1000
      const start = performance.now()
      
      for (let i = 0; i < messageCount; i++) {
        logger.log(`Message ${i}`)
      }
      
      const end = performance.now()
      const duration = end - start
      
      expect(duration).toBeLessThan(500) // Should complete within 500ms
      expect(consoleSpy).toHaveBeenCalledTimes(messageCount)
    })

    test('should handle concurrent operations efficiently', () => {
      const logger = createLogger({
        scope: 'concurrent-test'
      })
      
      // Start multiple timers
      const timers = Array.from({ length: 50 }, (_, i) => 
        logger.time(`concurrent-${i}`)
      )
      
      // Log messages while timers are running
      Array.from({ length: 50 }, (_, i) => {
        logger.log(`Message ${i}`)
      })
      
      // End all timers
      timers.forEach((timer, index) => {
        vi.advanceTimersByTime(1)
        logger.timeEnd(timer)
      })
      
      expect(consoleSpy).toHaveBeenCalledTimes(150) // 50 starts + 50 messages + 50 ends
    })
  })

  describe('Real-world Scenarios', () => {
    test('should simulate web server logging', () => {
      const serverLogger = createLogger({
        scope: 'web-server',
        presets: ['date'],
        uppercase: ['label']
      })
      
      // Server startup
      serverLogger.info('Server starting on port 3000')
      
      // Request handling
      const requestLogger = serverLogger.scope('http')
      
      const req1Timer = requestLogger.time('req-001')
      vi.advanceTimersByTime(45)
      requestLogger.info('GET /api/users - 200')
      requestLogger.timeEnd('req-001')
      
      const req2Timer = requestLogger.time('req-002')
      vi.advanceTimersByTime(120)
      requestLogger.warn('GET /api/posts - 404')
      requestLogger.timeEnd('req-002')
      
      // Database operations
      const dbLogger = serverLogger.scope('database')
      dbLogger.info('Connected to PostgreSQL')
      dbLogger.error('Connection failed: timeout')
      
      expect(consoleSpy).toHaveBeenCalledTimes(7)
    })

    test('should simulate application lifecycle', () => {
      const appLogger = createLogger({
        scope: 'my-app',
        presets: ['date'],
        uppercase: ['scope', 'label']
      })
      
      // Startup
      appLogger.log('Application starting...')
      
      const initTimer = appLogger.time('initialization')
      
      // Module loading
      const configLogger = appLogger.scope('config')
      configLogger.info('Configuration loaded')
      
      const dbLogger = appLogger.scope('database')
      dbLogger.info('Database connected')
      
      vi.advanceTimersByTime(200)
      appLogger.timeEnd('initialization')
      
      // Runtime
      appLogger.success('Application ready')
      
      // Error scenario
      const errorLogger = appLogger.scope('error-handler')
      errorLogger.error('Unhandled exception: TypeError')
      
      // Shutdown
      appLogger.log('Application shutting down')
      
      expect(consoleSpy).toHaveBeenCalledTimes(7)
      
      const calls = consoleSpy.mock.calls
      expect(calls[0][0]).toContain('[MY-APP] LOG')
      expect(calls[1][0]).toContain('[MY-APP] [CONFIG]')
      expect(calls[2][0]).toContain('[MY-APP] [DATABASE]')
      expect(calls[3][0]).toContain('[MY-APP] [TIMER]')
      expect(calls[4][0]).toContain('[MY-APP] SUCCESS')
      expect(calls[5][0]).toContain('[MY-APP] [ERROR-HANDLER] ERROR')
      expect(calls[6][0]).toContain('[MY-APP] LOG')
    })
  })
})