## A sketch of domain langauage

```ts
// business logic
// how do we modify payload
// {originalPayload: payload (can't be changed), payload: Mutate}
// serviceContext, actionContext (factory) - build object
// fetch at the beginning / other purposes
// CMS / OMS / CRM / whatever
export const categoriesApplication = application()
      .pre(validatePayload)
      .pre(validateQuantity)
      .pre([validatePayload])
      .action(getCategories)
      .post(tranlateToFacebookFeed)
      // .post(tranlateToGoogleFeed)
      .post(sendEvent)
      // .run(payload, {logger, getCategories, sendEvent})
import {categoriesApplication} from 'categoriesApplication'
// small reusable components that enable us to construct a service quickly
// which can be easy understood and learn

// infer T extend X ? some : never
// a builder function which takes a configuration and applies on the builder
export const handler = serverlessPipe({config: {}})
  // success handler ()
  .successResponseHandler(apiGatewayHandler, successResponseMapper)
  // error handler  compose(applicationErrorMapper, systemErrorMapper)
  .errorResponseHandler(apiGatewayHandler, errorMapper)
  // logger console.log/error/warn....
  // context / const aFunction = ({dependencies, logger: logger.child()}) => ({data}) = {}
  .logger(logger)
  // process.env.SERVICE_NAME --- config: {environment, serviceName}
  .env({
    ENVIRONMENT: environment,
    SERVICE_NAME: serviceName
  })
  // what if you have dependencies dependent on dependencies ?
  // do we run them in order and pass dependencies so they can create dependencies
  // this start what application needs to run
  // .global
  // {depedendencies: {commercetoolsClient, awsClient}}
  .singleton(commercetoolClient)
  // todoRepositoryClient(awsClient) - level of abstraction is left to developer
  .singleton(({
    {environment, serviceName}: env
  }) => awsClient(environment, serviceName))
  // what if you have propopty dependent on other dependencies
  // do we run them in order and pass dependencies so they can create dependencies
  // alternative? request/event aliases
  .prototype(({logger}: dependencies, {event, context}: request) => {
    return {
      logger: logger.child({event, context})
    }
  })
  // dependencies that can refresh themselves during running
  // SSM - not important (concept)
  .refresh(() => {
    return {
      factory: () => {},
      interval: 1000
    }
  })
  // this is very specific to the environment and converts AWS events or google or azure to the typed object representation
  // order does not matter
  //
  .payload((event, context) => {
    event.pathVariables
    event.queryParams
​
    return {
      pagination: pagination(event), // same for all when it comes to domain model
      categoryId: event.pathVariables.categoryId,
    }
  })
  // maybe singleton and prototype becomes dependencies
  .use(({environment, event, context, dependencies }) => {
    console.log('Request called')
    // sendEvent.reporing(lambax, called, everion)
    return () => {}
  })
  .use(() => {
    return {before: () => {}, after: () => {}, onError: () => {} }
  })
  .app(({payload, // this is structure to the application needs
    commercetoolsClient,
    logger,
  }: dependencies) => {
    return categoriesApplication.run(payload, {
      getCategories(commercetoolsClient),
      logger,
    })
  })
  // .run(event, context)


// this is separate file where you build your application  ​

```


```ts
type InventoryRepository = {
    get(sku: string): number
    update(sku: string, stockLevel: number)
}

// aws
const dynamoDbInventoryRepository = (awsClient: AWSClient): InventoryRepository => ({
    get(sku: string) {
        awsClient.get()
    }
    update(sku: string) {
        awsClient.get()
    }
})

// google cloud firebase 
const firebaseInventoryRepository = (firebaseClient: GCloudFirebase): InventoryRepository => ({
    get(sku: string) {
        firebase.get()
    }
    update(sku: string) {
        firebase.get()
    }
})

import {firebaseClient} from 'google-client'

type Dependency<T> = {
    instance: T,
    name: string // defines what name in map of dependecies it is being mapped
}
// google 
slsEnv()
    .global(() => {
        return {
            instance: firebaseClient,
            name: 'firebaseClient'
        }
    })
    // how do you use arrow function because eveyone loves them
    .global(function inventoryRepository({firebaseClient} : Dependecies) => {
        return firebaseInventoryRepository(firebaseClient)
    })
    .payload(() => {
        return {
            sku: req.path.sku_id
        }: GetInventory
    })
    //  google cloud
    .app((payload, {inventoryRepository}: Dependecies) => {
        return app().run(payload, {inventoryRepository})
    })
    .run(req, res)
    
// aws 
import AWS from 'aws-sdk'

slsEnv()
    .global(function inventoryRepository() => {
        return dynamoDbInventoryRepository(new AWS.DynamoDB())
    })
    .payload(() => {
        return {
            sku: event.pathVariables.sku_id
        }: GetInventory
    })
    //  google cloud
    .app((payload, {inventoryRepository}: Dependecies) => {
        return app().run(payload, {inventoryRepository})
    })
    .run(event, context)
    

// tests

slsEnv.run({what we think is right})

// ci

real lambda 
```

## Release New Version

Current workflow before applying full automated solution:

1. make changes
2. create PR and either link a package or use `publish:canary`
3. once PR is reviewed publish package from `master`

At the moment package is released manually using command-line from a developer machine using following command:

```shell
GH_TOKEN=<github_api_token> yarn publish:ci
```
