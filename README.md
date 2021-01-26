# SLS Pipe


TODO: description

## Release New Version

Current workflow before applying full automated solution:

1. make changes
2. create PR and either link a package or use `publish:canary`
3. once PR is reviewed publish package from `master`

At the moment package is released manually using command-line from a developer machine using following command depending on the change type:

```shell
GH_TOKEN=<github_api_token> yarn publish:ci:patch
```

```shell
GH_TOKEN=<github_api_token> yarn publish:ci:minor
```
