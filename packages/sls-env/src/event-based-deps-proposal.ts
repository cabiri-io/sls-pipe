// so what we have and how to we process that
// Dependency constructor which is
type Client = {
  doSomething: () => void
}

type Payload = {
  body: {
    value: string
    value2: number
    value3: {
      subvalue: string
    }
    value4: Array<string>
  }
}

// limited strict payload definition
type StrictPayload = {
  body: {
    value: 'a' | 'b'
  }
}

type PathOf<T> = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [K in keyof T]: T[K] extends object ? K | `${K}.${PathOf<T[K]>}` | `${K}['${PathOf<T[K]>}']` : K
}[keyof T]

// this returns all combination ["body"], ["body", "value"]
type AllArrayPathOf<T> = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [K in keyof T]: T[K] extends object ? [K, ...AllArrayPathOf<T[K]>] : [K]
}[keyof T]

// but ideally we want to return leafs and with simple types
type ArrayPathOf<T> = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [K in keyof T]: T[K] extends object ? [K, ...ArrayPathOf<T[K]>] : T[K] extends string ? [K] : []
}[keyof T]

// unless we want only values
type VA = AllArrayPathOf<Payload>
type VS = ArrayPathOf<Payload>
// ;[a, b, c, d][(a, [b, c, d])][(a, b, [c, d])][(a, b, c, [d])]
// d === string ? [a, b, c, d] : []

// type ArrayPathOf<T> = {
//   // eslint-disable-next-line @typescript-eslint/ban-types
//   [K in keyof T]: T[K] extends object ? [K, ...ArrayPathOf<T[K]>] : T[K] extends string ? [K] : []
// }[keyof T]

type ArrayPathOf2<T> = {
  // ignore array type
  [K in keyof T]: T[K] extends Array<any>
    ? never
    : // eslint-disable-next-line @typescript-eslint/ban-types
    T[K] extends object
    ? [K, ...ArrayPathOf2<T[K]>]
    : // only suport string and number
    T[K] extends string
    ? [K]
    : T[K] extends number
    ? [K]
    : never
}[keyof T]

type VS2 = ArrayPathOf2<Payload>

type SimpleTypeFromProperty<T, P extends Array<any>> = T[P[0]]

type TypeFromProperties<T, P extends Array<any>> = {
  0: TypeFromProperties<SimpleTypeFromProperty<T, [Head<P>]>, Tail<P>>
  1: SimpleTypeFromProperty<T, [Head<P>]>
}[HasTail<P> extends true ? 0 : 1]

type ST2 = TypeFromProperties<Payload, ['body', 'value']>

// where K is the all combintation of Paths
// type EventDependency<D, P, K = PathOf<P>> = {
//   d: Record<string, D>
//   k: K
// }

type EventDependency<D, P, K = ArrayPathOf2<P>> = {
  d: Record<string, D>
  k: K
}

type SimpleDependency = {
  client: Client
}

const simpleDependency: SimpleDependency = {
  client: {
    doSomething() {}
  }
}
// eslint-disable-next-line no-console
console.log(simpleDependency)

const eventDependency: EventDependency<Client, Payload> = {
  d: {
    c: { doSomething() {} } // any string will work
  },
  // k: 'body.value'
  k: ['body', 'value']
}
// eslint-disable-next-line no-console
console.log(eventDependency)

// invalid path
const invalidPathEventDependency: EventDependency<Client, Payload> = {
  d: {
    c: { doSomething() {} } // any string will work
  },
  // k: 'body.value1' // this is failing because it has incorrect path - expected
  k: ['body', 'value1'] // this is failing because it has incorrect path - expected
}
// eslint-disable-next-line no-console
console.log(invalidPathEventDependency)

const validDependencySubvalue: EventDependency<Client, Payload> = {
  d: {
    c: { doSomething() {} } // any string will work
  },
  // k: 'body.value1' // this is failing because it has incorrect path - expected
  k: ['body', 'value3', 'subvalue'] // this is failing because it has incorrect path - expected
}
// eslint-disable-next-line no-console
console.log(validDependencySubvalue)

const invalidDependencyArray: EventDependency<Client, Payload> = {
  d: {
    c: { doSomething() {} } // any string will work
  },
  // k: 'body.value1' // this is failing because it has incorrect path - expected
  k: ['body', 'value4'] // this is failing because it has incorrect path - expected
}
// eslint-disable-next-line no-console
console.log(validDependencySubvalue)

const invalidEventDependency: EventDependency<Client, StrictPayload> = {
  d: {
    c: { doSomething() {} } // this should show an error but doesn't
  },
  k: ['body', 'value']
}
// eslint-disable-next-line no-console
console.log(invalidEventDependency)

// type EventBasedDependency = {
//   client: EventDependency<Client, Payload>
// }

/*
type myPropertyPath = ['a', 'b']

const property: myPropertyPath = ['a', 'b']
console.log(property)

*/

type ArrayPathOf<T> = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [K in keyof T]: T[K] extends object ? [K] | [K, ArrayPathOf<T[K]>] : K
}[keyof T]

type Head<T extends Array<any>> = T extends [infer I, ...infer L] ? I : never
type Tail<T extends Array<any>> = T extends [infer I, ...infer L] ? L : never
type HasTail<T extends any[]> = T extends [] | [any] ? false : true

// type TypeFromProperty<T, P> = {}

type BB = ArrayPathOf<Payload>
// single property

type TypeFromProperty<T, P extends any[]> = T[P[0]]

type ST = TypeFromProperty<Payload, ['body']>

// from sub propertye
type TypeFromProperty<T, P extends any[]> = T[P[0]]

type ST1 = TypeFromProperty<TypeFromProperty<Payload, ['body']>, ['value']>

type SLSDependencies = {
  client: Client
  eventBasedDepenency: EventDependency<Client, Payload>
}

type AppDependencyConverter<T> = {
  [k in keyof T]: T[k] extends EventDependency<infer A, infer B, infer C> ? A : T[k]
}

type AppDependency = AppDependencyConverter<SLSDependencies>
