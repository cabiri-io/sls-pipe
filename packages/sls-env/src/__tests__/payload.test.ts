import { Handler, environment } from '..'

describe('serverless environment', () => {
  type MessageEvent = { message: string }
  type NameContext = { name: string }

  describe('payload', () => {
    it('supports mapping payload to custom type', async () => {
      type HelloWorldMessage = {
        hello: string
        world: string
      }

      type BuildHelloWorldMessage = (message: HelloWorldMessage) => string

      const buildMessage: BuildHelloWorldMessage = message => `${message.hello} ${message.world}!`

      type BuildHelloWorldMessageDependencies = {
        buildMessage: BuildHelloWorldMessage
      }

      return environment<
        Handler<MessageEvent, NameContext, string>,
        never,
        BuildHelloWorldMessageDependencies,
        HelloWorldMessage
      >()
        .global({ buildMessage })
        .payload((event, context) => ({
          hello: event.message,
          world: context.name
        }))
        .successHandler(({ result }) => result as string)
        .app(({ payload, dependencies: { buildMessage } }) => buildMessage(payload))
        .start({ message: 'hello' }, { name: 'world' })
        .then(result => expect(result).toBe('hello world!'))
    })
  })
})
