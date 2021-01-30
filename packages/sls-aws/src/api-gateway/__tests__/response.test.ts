import { createSuccessResponse } from '../index'

describe('structure response', () => {
  it('creates response with sensible defaults', () => {
    const successResponse = createSuccessResponse()

    const result = successResponse({ message: 'value' })

    expect(result).toMatchInlineSnapshot(`
      Object {
        "body": "{\\"message\\":\\"value\\"}",
        "headers": Object {
          "content-type": "application/json",
        },
        "statusCode": 200,
      }
    `)
  })

  it('creates response without body when value is undefined', () => {
    const successResponse = createSuccessResponse()

    const result = successResponse()

    expect(result).toMatchInlineSnapshot(`
      Object {
        "headers": Object {
          "content-type": "application/json",
        },
        "statusCode": 200,
      }
    `)
  })

  it('creates response with null body when value is null', () => {
    const successResponse = createSuccessResponse()

    const result = successResponse(null)

    expect(result).toMatchInlineSnapshot(`
      Object {
        "body": "null",
        "headers": Object {
          "content-type": "application/json",
        },
        "statusCode": 200,
      }
    `)
  })

  it('creates response with default content type application/json', () => {
    const successResponse = createSuccessResponse()

    const result = successResponse(null)

    expect(result).toMatchInlineSnapshot(`
      Object {
        "body": "null",
        "headers": Object {
          "content-type": "application/json",
        },
        "statusCode": 200,
      }
    `)
  })

  it('allows override content type header', () => {
    const successResponse = createSuccessResponse({ headers: { 'content-type': 'text/html' } })

    const result = successResponse(null)

    expect(result).toMatchInlineSnapshot(`
      Object {
        "body": "null",
        "headers": Object {
          "content-type": "text/html",
        },
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
        "headers": Object {
          "content-type": "application/json",
        },
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
        "headers": Object {
          "content-type": "application/json",
        },
        "statusCode": 201,
      }
    `)
  })
})
