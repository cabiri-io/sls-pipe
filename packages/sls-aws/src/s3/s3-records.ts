import type { Context, S3Event, S3EventRecord } from 'aws-lambda'

import { PayloadParseError } from '../error/parse'

const s3Records = (event: S3Event, _context: Context): Array<S3EventRecord['s3']> => {
  try {
    return event.Records.map(r => r.s3)
  } catch (err) {
    throw new PayloadParseError('failed to process s3 message', { originalError: err })
  }
}

export { s3Records }
