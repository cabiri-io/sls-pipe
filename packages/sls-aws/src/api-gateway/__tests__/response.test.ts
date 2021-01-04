import { createSuccessResponse } from '../index'

describe('structure response', () => {
  it('creates response with sensible defaults', () => {
    const successResponse = createSuccessResponse()

    const result = successResponse({ message: 'value' })

    expect(result).toMatchInlineSnapshot(`
      Object {
        "body": "{\\"message\\":\\"value\\"}",
        "statusCode": 200,
      }
    `)
  })

  it('allows override of status code', () => {
    type Message = { message: string }
    const successResponse = createSuccessResponse<Message, never>({ statusCode: 201 })

    const result = successResponse({ message: 'value' })

    expect(result).toMatchInlineSnapshot(`
      Object {
        "body": "{\\"message\\":\\"value\\"}",
        "statusCode": 201,
      }
    `)
  })

  it('allows mapping between different types', () => {
    type Message = { message: string }
    type Echo = { value: string }

    const message2Echo = (m: Message): Echo => ({ value: m.message })

    const successResponse = createSuccessResponse<Message, Echo>({ statusCode: 201, mapper: message2Echo })

    const result = successResponse({ message: 'hello' })

    expect(result).toMatchInlineSnapshot(`
      Object {
        "body": "{\\"value\\":\\"hello\\"}",
        "statusCode": 201,
      }
    `)
  })
})
