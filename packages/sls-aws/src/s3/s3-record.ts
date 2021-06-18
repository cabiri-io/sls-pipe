import type { Context, S3Event, S3EventRecord } from 'aws-lambda'

import { PayloadError, PayloadParseError } from '../error/parse'

const s3Record = (event: S3Event, _context: Context): S3EventRecord['s3'] => {
  try {
    if (event.Records.length === 1) {
      return event.Records[0].s3
    }
  } catch (err) {
    throw new PayloadParseError('failed to process s3 message', { originalError: err })
  }

  throw new PayloadError('event contains more than 1 record')
}

export { s3Record }
