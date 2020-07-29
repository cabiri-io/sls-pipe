git tag -d v0.0.${1}

git tag -d @cabiri-io/sls-env@0.0.${1}
git tag -d @cabiri-io/sls-aws@0.0.${1}
git tag -d @cabiri-io/sls-app@0.0.${1}


git push --delete origin @cabiri-io/sls-env@0.0.${1}
git push --delete origin @cabiri-io/sls-aws@0.0.${1}
git push --delete origin @cabiri-io/sls-app@0.0.${1}
