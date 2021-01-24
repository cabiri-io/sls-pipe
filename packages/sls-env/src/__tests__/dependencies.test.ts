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
        .start({ message: 'hello' }, { name: 'world' })
        .then(result => expect(result).toBe('hello world of config!'))
    })
  })
})
