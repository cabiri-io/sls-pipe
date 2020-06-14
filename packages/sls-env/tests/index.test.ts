import { environment } from '../src'
describe('serverless environment', () => {
  // here we will have adapter
  // but for testing it should be enough for time being

  type EmptyEvent = {}
  type EmptyContext = {}
  it('supports application', () =>
    environment<EmptyEvent, EmptyContext, string>()
      .app(() => 'hello world!')
      .start({}, {})
      .then(result => expect(result).toBe('hello world!')))

  type MessageEvent = { message: string }
  type NameContext = { name: string }
  it('supports passing an event and context to application', () =>
    environment<MessageEvent, NameContext, string>()
      .app(({ event, context }) => `${event.message} ${context.name}!`)
      .start({ message: 'hello' }, { name: 'world' })
      .then(result => expect(result).toBe('hello world!')))

  // it('supports adding dependencies to environment', () => {
  //   const buildMessage = (message: string, name: string): string => `${message} ${name}`

  //   environment<MessageEvent, NameContext, string>()
  //     .global(buildMessage)
  //     .app(({ event, context, dependencies: { buildMessage } }) => buildMessage(event.message, context.name))
  //     .start({ message: 'hello' }, { name: 'world' })
  //     .then(result => expect(result).toBe('hello world!'))
  // })
  // google run against express
  // it('runs request / response environment', () => environment().run(request, response))
  // it('runs google function environment', () => environment().run(event, context))
})
