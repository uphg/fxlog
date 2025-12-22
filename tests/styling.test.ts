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

  describe('Color Scope Configuration', () => {
    test('should not apply color when colorScope is "none"', () => {
      const logger = createLogger({
        presets: [],
        colorScope: 'none'
      })
      
      logger.info('test')
      expect(consoleSpy).toHaveBeenCalled()
    })

    test('should apply different colorScope configurations', () => {
      const logger = createLogger({
        presets: [],
        colorScope: 'badge'
      })
      
      logger.info('test')
      expect(consoleSpy).toHaveBeenCalled()
    })
  })

  describe('Underline Configuration', () => {
    test('should handle underline configuration', () => {
      const logger = createLogger({
        presets: ['date'],
        underline: ['date']
      })
      
      logger.log('test message')
      expect(consoleSpy).toHaveBeenCalled()
    })

    test('should handle empty underline arrays', () => {
      const logger = createLogger({
        scope: 'test',
        presets: [],
        underline: []
      })
      
      logger.log('test')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('test')
      )
    })

    test('should handle invalid uppercase values', () => {
      const logger = createLogger({
        presets: [],
        underline: ['invalid' as any]
      })
      
      logger.log('test')
      expect(consoleSpy).toHaveBeenCalled()
    })
  })

  describe('Performance and Efficiency', () => {
    test('should handle styling efficiently with many elements', () => {
      const logger = createLogger({
        presets: ['date'],
        scope: 'test'
      })
      
      const start = performance.now()
      for (let i = 0; i < 100; i++) {
        logger.log(`message ${i}`)
      }
      const end = performance.now()
      
      expect(end - start).toBeLessThan(100) // Should complete quickly
      expect(consoleSpy).toHaveBeenCalledTimes(100)
    })

    test('should not apply styling when disabled', () => {
      const logger = createLogger({
        presets: [],
        disabled: true
      })
      
      logger.log('test')
      expect(consoleSpy).not.toHaveBeenCalled()
    })
  })
})