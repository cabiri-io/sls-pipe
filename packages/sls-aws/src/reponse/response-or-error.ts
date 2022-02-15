import { SuccessParams } from '@cabiri/sls-env'

const responseOrError = <T>({ result }: SuccessParams<T>): T | never => {
  if (result) {
    return result
  }
  throw Error("expected event result to be present but it wasn't")
}

// todo: we need to review how do we work with `void`, `undefined` and `null` types
const response = <T>({ result }: SuccessParams<T>): T | never => result as T

export { responseOrError, response }
