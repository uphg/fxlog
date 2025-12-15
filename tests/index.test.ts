import { expect, test } from 'vitest'
import { run } from '../src'

test('run', () => {
  expect(run()).toBe('Hello, tsdown!')
})
