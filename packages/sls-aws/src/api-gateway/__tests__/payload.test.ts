import { APIGatewayProxyEventV2 } from 'aws-lambda'
import { bodyToPayload, queryParamsToPayload } from '../index'
import { pathParamsToPayload } from '../payload'

describe('payload', () => {
  describe('body', () => {
    it('convert body to payload', () => {
      const result = bodyToPayload<{ message: string }>({
        body: '{"message": "hello"}'
      } as unknown as APIGatewayProxyEventV2)

      expect(result).toEqual({
        message: 'hello'
      })
    })

    it('converts undefined to empty object', () => {
      const result = bodyToPayload<{ message: string }>({
        body: undefined
      } as unknown as APIGatewayProxyEventV2)

      expect(result).toEqual({})
    })

    it('converts null to empty object', () => {
      const result = bodyToPayload<{ message: string }>({
        body: null
      } as unknown as APIGatewayProxyEventV2)

      expect(result).toEqual({})
    })
  })

  describe('query parameters', () => {
    it('convert body to payload', () => {
      const result = queryParamsToPayload<{ message: string }>({
        queryStringParameters: { message: 'hello' }
      } as unknown as APIGatewayProxyEventV2)

      expect(result).toEqual({
        message: 'hello'
      })
    })
  })

  describe('path parameters', () => {
    it('convert body to payload', () => {
      const result = pathParamsToPayload<{ message: string }>({
        pathParameters: { message: 'hello' }
      } as unknown as APIGatewayProxyEventV2)

      expect(result).toEqual({
        message: 'hello'
      })
    })
  })
})
