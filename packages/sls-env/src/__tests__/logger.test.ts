import { Handler, environment } from '..'
import type { Logger } from '../logger'
import { EmptyContext, EmptyEvent } from './types'

describe('serverless environment', () => {
  describe('logger', () => {
    let logMessageStore: Array<string>
    let logger: Logger

    beforeEach(() => {
      logMessageStore = []
      logger = ({
        trace(message: string) {
          logMessageStore.push(message)
        },
        error(message: string) {
          logMessageStore.push(message)
        },
        info(message: string) {
          logMessageStore.push(message)
        },
        debug(message: string) {
          logMessageStore.push(message)
        }
      } as unknown) as Logger
    })

    it('has default built in', () =>
      environment<Handler<EmptyEvent, EmptyContext, void>, never, void, void>()
        .app(({ logger }) => expect(logger).toBeDefined())
        .start({}, {}))

    it('allows to override default logger', async () =>
      environment<Handler<EmptyEvent, EmptyContext, void>, never, void, void>()
        .logger(logger)
        .app(({ logger }) => logger.debug('log message'))
        .start({}, {})
        .then(() => {
          expect(logMessageStore).toContain('log message')
        }))

    it('injects log at each step invocations', async () => {
      type Config = { message: string }
      type Dependencies = { message: string }
      return environment<Handler<EmptyEvent, EmptyContext, void>, Config, Dependencies, string>()
        .logger(logger)
        .config(({ logger }) => {
          logger.debug('config log')

          return {
            message: 'hello'
          }
        })
        .global(({ logger }) => {
          logger.debug('dependencies log')
          return {
            message: 'hello'
          }
        })
        .payload((_event, _context, { logger }) => {
          logger.debug('payload log')

          return 'hello'
        })
        .app(({ logger }) => logger.debug('app log'))
        .start({}, {})
        .then(() => {
          expect(logMessageStore).toContain('config log')
          expect(logMessageStore).toContain('dependencies log')
          expect(logMessageStore).toContain('payload log')
          expect(logMessageStore).toContain('app log')
        })
    })
  })
})
