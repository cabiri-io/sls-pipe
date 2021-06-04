import type { Context, S3Event } from 'aws-lambda'

import { s3Records } from '../s3-records'
import { PayloadParseError } from '../../error/parse'

describe('s3Records', () => {
  it('returns the s3 object', () => {
    const event = ({ Records: [{ s3: 's3-record-1' }, { s3: 's3-record-2' }] } as unknown) as S3Event

    const record = s3Records(event, {} as Context)

    expect(record).toEqual(['s3-record-1', 's3-record-2'])
  })

  it('throws a PayloadParseError if retrieving record throws an error', () => {
    const event = ({} as unknown) as S3Event

    expect(() => s3Records(event, {} as Context)).toThrow(
      new PayloadParseError('failed to process s3 message', { originalError: expect.any(Error) })
    )
  })
})
