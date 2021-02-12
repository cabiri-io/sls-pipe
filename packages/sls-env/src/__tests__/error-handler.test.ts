import { Handler, environment } from '..'
import { EmptyContext, EmptyEvent } from './types'

describe('serverless environment', () => {
  describe('error handler configuration', () => {
    it('allows to create error response', async () => {
      type AppResult = string
      type HandlerResult = { message: string }
      const result = await environment<Handler<EmptyEvent, EmptyContext, HandlerResult>, void, never, void, AppResult>()
        .successHandler(({ result }) => ({ message: result as string }))
        .app(() => 'app result')
        .start({}, {})

      expect(result).toEqual({ message: 'app result' })
    })
  })
})
