import { Handler, environment } from '..'
import { EmptyContext, EmptyEvent } from './types'

xdescribe('serverless environment', () => {
  it('creates basic environment', async () => {
    type AppResult = string
    type HandlerResult = { message: string }
    const result = await environment<Handler<EmptyEvent, EmptyContext, HandlerResult>, void, never, void, AppResult>()
      .successHandler(({ result }) => ({ message: result }))
      .app(() => 'app result')
      .start({}, {})

    expect(result).toEqual({ message: 'app result' })
  })
})
