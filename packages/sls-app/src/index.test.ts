import { application } from './'

describe('application flow', () => {
  it('creates an application with a simple type', () => {
    application<string, string, string>
        .pre(({payload, dependecies}) => (console.log(payload, dependecies), p))
  })
})
