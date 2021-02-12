import { Handler, environment } from '..'
import { EmptyContext, EmptyEvent } from './types'

describe('serverless environment', () => {
  describe('success handler configuration', () => {
    it('allows to remap application result to handler result', async () => {
      type AppResult = string
      type HandlerResult = { message: string }
      const result = await environment<Handler<EmptyEvent, EmptyContext, HandlerResult>, void, never, void, AppResult>()
        .successHandler(({ result }) => ({ message: result as string }))
        .app(() => 'app result')
        .start({}, {})

      expect(result).toEqual(expect.objectContaining({ message: 'app result' }))
    })
  })
})
