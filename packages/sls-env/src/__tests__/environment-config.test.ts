import { environment } from '..'
import { InvocationIdConstructor } from '../environment-config'
import { Handler } from '../handler'
import { Logger } from '../logger'

describe('environment config', () => {
  describe('invocation id', () => {
    it('allows to create a custom invocation id constructor', () => {
      const logger = ({} as unknown) as Logger
      const invocationId: InvocationIdConstructor<Handler<string, string, string>> = (event, context, _logger) =>
        `${event}-${context}`

      expect(invocationId('event', 'context', logger)).toBe('event-context')
    })
  })

  describe('in context of environment', () => {
    it('creates invocation id in context of invocation', async () => {
      type AppConfig = {
        message: string
      }
      type Event = {
        content: string
      }
      type Dependencies = {
        message: string
      }

      const env = environment<Handler<Event, string, string>, AppConfig, Dependencies, string>({
        invocationIdGenerator: (event, context) => `${event.content}-${context}`
      })
        .config(({ invocationId }) => {
          expect(invocationId).toBe('event-context')
          return { message: 'hello' }
        })
        .global(({ invocationId }) => {
          expect(invocationId).toBe('event-context')
          return { message: 'hello' }
        })
        .payload((_event, _content, { invocationId }) => {
          expect(invocationId).toBe('event-context')
          return 'payload'
        })
        .app(({ context: { invocationId } }) => {
          expect(invocationId).toBe('event-context')
          return 'result'
        }).start

      await env({ content: 'event' }, 'context')

      expect.assertions(4)
    })

    it('changes invocation id based on the event', async () => {
      type AppConfig = {
        message: string
      }
      type Event = {
        content: string
      }
      type Dependencies = {
        message: string
      }

      let invocationCapture: Array<string> = []

      const env = environment<Handler<Event, string, string>, AppConfig, Dependencies, string>({
        invocationIdGenerator: (event, context) => `${event.content}-${context}`
      })
        .config(({ invocationId }) => {
          invocationCapture.push(invocationId)
          return { message: 'hello' }
        })
        .global(({ invocationId }) => {
          invocationCapture.push(invocationId)
          return { message: 'hello' }
        })
        .payload((_event, _content, { invocationId }) => {
          invocationCapture.push(invocationId)
          return 'payload'
        })
        .app(({ context: { invocationId } }) => {
          invocationCapture.push(invocationId)
          return 'result'
        }).start

      await env({ content: 'event1' }, 'context')

      expect(invocationCapture.every(a => a === 'event1-context')).toBeTruthy()

      invocationCapture.shift()
      invocationCapture.shift()
      invocationCapture.shift()
      invocationCapture.shift()

      await env({ content: 'event2' }, 'context')

      expect(invocationCapture.every(a => a === 'event2-context')).toBeTruthy()
    })
  })
})
