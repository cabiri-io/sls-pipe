import { EventBasedDependencyError } from '../error/index'
import { Handler, environment } from '..'

describe('serverless environment', () => {
  type MessageEvent = { message: string }
  type NameContext = { name: string }
  type EventPayload = { event: MessageEvent; context: NameContext }

  describe('dependencies', () => {
    it('supports adding object with named dependencies', async () => {
      type BuildMessage = (message: string, name: string) => string
      type BuildMessageDependencies = {
        buildMessage: BuildMessage
      }

      return environment<Handler<MessageEvent, NameContext, string>, never, BuildMessageDependencies, EventPayload>()
        .global({ buildMessage: (message: string, name: string) => `${message} ${name}!` })
        .app(({ payload: { event, context }, dependencies: { buildMessage } }) =>
          buildMessage(event.message, context.name)
        )
        .successHandler(({ result }) => result as string)
        .start({ message: 'hello' }, { name: 'world' })
        .then(result => expect(result).toBe('hello world!'))
    })

    it('supports adding function which returns named dependencies', async () => {
      type BuildMessage = (message: string, name: string) => string
      type BuildMessageDependencies = {
        buildMessage: BuildMessage
      }

      return environment<Handler<MessageEvent, NameContext, string>, never, BuildMessageDependencies, EventPayload>()
        .global(() => ({
          buildMessage: (message: string, name: string) => `${message} ${name}!`
        }))
        .app(({ payload: { event, context }, dependencies: { buildMessage } }) =>
          buildMessage(event.message, context.name)
        )
        .successHandler(({ result }) => result as string)
        .start({ message: 'hello' }, { name: 'world' })
        .then(result => expect(result).toBe('hello world!'))
    })

    it('passes config and log as part of dependency factory function', async () => {
      type BuildMessage = (message: string, name: string) => string
      type BuildMessageDependencies = {
        buildMessage: BuildMessage
      }
      type Config = { hello: string }

      return environment<Handler<MessageEvent, NameContext, string>, Config, BuildMessageDependencies, EventPayload>()
        .config({ hello: 'config' })
        .global(({ config }) => ({
          buildMessage: (message: string, name: string) => `${message} ${name} of ${config.hello}!`
        }))
        .app(({ payload: { event, context }, dependencies: { buildMessage } }) =>
          buildMessage(event.message, context.name)
        )
        .successHandler(({ result }) => result as string)
        .start({ message: 'hello' }, { name: 'world' })
        .then(result => expect(result).toBe('hello world of config!'))
    })

    it('changes event based dependencies based on the payload', async () => {
      type BuildMessage = (message: string, name: string) => string
      type BuildMessageDependencies = {
        buildMessage: BuildMessage
      }
      type Config = { hello: string }

      const buildMessages: Record<string, BuildMessage> = {
        client1: (_m, _n) => `Using client1!`,
        client2: (_m, _n) => `Using client2!`
      }

      const app = ({ payload: { event, context }, dependencies: { buildMessage } }) =>
        buildMessage(event.message, context.name)

      const handler = environment<
        Handler<MessageEvent, NameContext, string>,
        Config,
        BuildMessageDependencies,
        EventPayload
      >()
        .config({ hello: 'config' })
        .global(({ createEventBasedDependency }) => ({
          buildMessage: createEventBasedDependency(
            buildMessages,
            ({ event, dependencies }) => dependencies[event.message]
          )
        }))
        .app(app)
        .successHandler(({ result }) => result as string).start

      const response1 = await handler({ message: 'client1' }, { name: 'world' })
      expect(response1).toBe('Using client1!')

      const response2 = await handler({ message: 'client2' }, { name: 'world' })
      expect(response2).toBe('Using client2!')

      await expect(handler({ message: 'client3' }, { name: 'world' })).rejects.toThrow(
        new EventBasedDependencyError("No event based dependency found for 'buildMessage'")
      )
    })
  })
})
