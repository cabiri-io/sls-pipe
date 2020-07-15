// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/ban-types */
import { environment } from '..'
describe('serverless environment', () => {
  // here we will have adapter
  // but for testing it should be enough for time being

  it('supports application', () => {
    type EmptyEvent = {}
    type EmptyContext = {}

    return environment<EmptyEvent, EmptyContext, void, void, string>()
      .app(() => 'hello world!')
      .start({}, {})
      .then(result => expect(result).toBe('hello world!'))
  })

  type MessageEvent = { message: string }
  type NameContext = { name: string }
  type EventPayload = { event: MessageEvent; context: NameContext }
  // eslint-disable-next-line arrow-body-style
  it('supports passing an event and context to application', () => {
    return environment<MessageEvent, NameContext, void, EventPayload, string>()
      .app(({ payload: { event, context } }) => `${event.message} ${context.name}!`)
      .start({ message: 'hello' }, { name: 'world' })
      .then(result => expect(result).toBe('hello world!'))
  })

  it('supports adding dependencies to environment', () => {
    type BuildMessage = (message: string, name: string) => string
    type BuildMessageDependencies = {
      buildMessage: BuildMessage
    }

    const buildMessage: BuildMessage = (message, name) => `${message} ${name}!`

    return environment<MessageEvent, NameContext, BuildMessageDependencies, EventPayload, string>()
      .global(buildMessage)
      .app(({ payload: { event, context }, dependencies: { buildMessage } }) =>
        buildMessage(event.message, context.name)
      )
      .start({ message: 'hello' }, { name: 'world' })
      .then(result => expect(result).toBe('hello world!'))
  })

  it.todo('supports adding not named dependencies to environment')

  it('supports creating a payload for the application', () => {
    type HelloWorldMessage = {
      hello: string
      world: string
    }

    type BuildHelloWorldMessage = (message: HelloWorldMessage) => string

    const buildMessage: BuildHelloWorldMessage = message => `${message.hello} ${message.world}!`

    type BuildHelloWorldMessageDependencies = {
      buildMessage: BuildHelloWorldMessage
    }

    return environment<MessageEvent, NameContext, BuildHelloWorldMessageDependencies, HelloWorldMessage, string>()
      .global(buildMessage)
      .payload((event, context) => ({
        hello: event.message,
        world: context.name
      }))
      .app(({ payload, dependencies: { buildMessage } }) => buildMessage(payload))
      .start({ message: 'hello' }, { name: 'world' })
      .then(result => expect(result).toBe('hello world!'))
  })
  // google run against express
  // it('runs request / response environment', () => environment().run(request, response))
  // it('runs google function environment', () => environment().run(event, context))
})
