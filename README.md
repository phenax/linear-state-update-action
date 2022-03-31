# linear-state-update-action

Update issue states on linear (Eg - on release). This action is to overcome some of the limitations in the linear-github integration.


## Usage

```yml
name: Update linear state on release

on:
  release:
    types: [published]

jobs:
  linear_update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Linear update
        uses: phenax/linear-state-update-action@0.1.0
        with:
          linear-api-key: ${{ secrets.LINEAR_API_KEY }}
          linear-team-key: PRO
          state-from: 'Beta'
          state-to: 'Released'
```

