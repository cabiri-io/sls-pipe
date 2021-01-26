import { Handler, environment } from '..'
import { EmptyContext, EmptyEvent } from './types'

describe('serverless environment', () => {
  it('creates basic environment', async () => {
    type AppResult = string
    type HandlerResult = { message: string }
    const result = await environment<Handler<EmptyEvent, EmptyContext, HandlerResult>, void, never, void, AppResult>()
      .successHandler(message => ({ message }))
      .app(() => 'app result')
      .start({}, {})

    expect(result).toEqual({ message: 'app result' })
  })
})
