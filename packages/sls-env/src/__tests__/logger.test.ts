import { Handler, environment } from '..'
import type { Logger } from '../logger'
import { EmptyContext, EmptyEvent } from './types'

describe('serverless environment', () => {
  describe('logger', () => {
    it('has default built in', () =>
      environment<Handler<EmptyEvent, EmptyContext, void>, never, void, void>()
        .app(({ logger }) => expect(logger).toBeDefined())
        .start({}, {}))

    it('allows to override default', async () => {
      let logMessage: string
      const logger = ({
        debug(message: string) {
          logMessage = message
        }
      } as unknown) as Logger

      return environment<Handler<EmptyEvent, EmptyContext, void>, never, void, void>()
        .logger(logger)
        .app(({ logger }) => logger.debug('log message'))
        .start({}, {})
        .then(() => {
          expect(logMessage).toBe('log message')
        })
    })
  })
})
