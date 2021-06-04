import { EnvironmentConfig, Handler, SlsEnvironment, environment } from '@cabiri-io/sls-env'
import type { Context, S3Event, S3EventRecord } from 'aws-lambda'
import { response } from '../reponse/response-or-error'
import { s3Record as _s3Record } from './s3-record'
import { s3Records as _s3Records } from './s3-records'

export type S3Record = S3EventRecord['s3']

export type S3Handler = Handler<S3Event, Context, Promise<void>>

export const s3Record = <D, C = never>(
  config?: EnvironmentConfig<S3Handler>
): SlsEnvironment<S3Handler, C, D, S3Record> =>
  environment<S3Handler, C, D, S3Record>(config).payload(_s3Record).successHandler(response)

export const s3Records = <D, C = never>(
  config?: EnvironmentConfig<S3Handler>
): SlsEnvironment<S3Handler, C, D, Array<S3Record>> =>
  environment<S3Handler, C, D, Array<S3Record>>(config).payload(_s3Records).successHandler(response)
