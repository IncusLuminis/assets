# Contributing

## Source vs. generated

`src/`, `library/`, and `registry/schemas/` are source — hand-edited,
committed, reviewed. `dist/` is **generated only**: it is produced by
`npm run build` (and, once Theme packaging tooling exists, from a Theme's
`library/themes/<id>/` source) and is gitignored. Never hand-edit anything
under `dist/`, and never treat it as the place a fix belongs — fix the
source and rebuild (HUD Theme Contract 1.0 §2.1, §2.3; Implementation Plan
§2 decision 4).

`widgets/` is migration input for the baseline HUD Themes (Stories
#11–#15), not a build target — see the top-level README's repo-structure
section.

## Workflow

1. Create a feature branch.
2. Make focused changes.
3. Update documentation if needed.
4. Commit using the standard format.
5. Open a Pull Request.

## Branches

```
feature/*
fix/*
docs/*
refactor/*
chore/*
```

## Commit format

```
type(scope): summary
```

Examples:

```
feat(ui): add toolbar
fix(parser): handle empty input
docs(readme): update installation
```

## Rules

- Keep commits small.
- Keep documentation up to date.
- Record major architecture decisions in `docs/adr/`.
- Never commit secrets or credentials.