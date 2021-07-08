import type { Context, S3Event } from 'aws-lambda'

import { s3Record } from '../s3-record'
import { PayloadError, PayloadParseError } from '../../error/parse'

describe('s3Record', () => {
  it('returns the s3 object', () => {
    const event = { Records: [{ s3: 's3-record' }] } as unknown as S3Event

    const record = s3Record(event, {} as Context)

    expect(record).toEqual('s3-record')
  })

  it('throws a PayloadParseError if retrieving record throws an error', () => {
    const event = {} as unknown as S3Event

    expect(() => s3Record(event, {} as Context)).toThrow(
      new PayloadParseError('failed to process s3 message', { originalError: expect.any(Error) })
    )
  })

  it('throws a PayloadError if payload has more than 1 record', () => {
    const event = { Records: [{}, {}] } as unknown as S3Event

    expect(() => s3Record(event, {} as Context)).toThrow(new PayloadError('event contains more than 1 record'))
  })
})
