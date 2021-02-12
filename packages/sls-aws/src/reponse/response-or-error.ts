import { SuccessParams } from '@cabiri-io/sls-env'

const responseOrError = <T>({ result }: SuccessParams<T>): T | never => {
  if (result) {
    return result
  }
  throw Error("expected event result to be present but it wasn't")
}
export { responseOrError }
