# ZayanMax Railway Infrastructure

This directory uses Railway Infrastructure as Code, not the deprecated
`railway.json` or `railway.toml` Config-as-Code format.

The single [`railway.ts`](./railway.ts) definition owns the intended four-resource
project graph: PostgreSQL, Redis, `zayanmax-backend`, and `zayanmax-frontend`.

Install and validate locally:

```powershell
Set-Location .railway
npm ci
npm run typecheck
railway --version
```

After an operator links this checkout to the intended Railway project and selects
the correct environment, preview changes from the repository root:

```powershell
railway config plan
```

Review the plan for unexpected deletes or renames. Apply only in a separately
authorized deployment task:

```powershell
railway config apply
```

Never use `--include-variables` when pulling project state into source control.
Shared secret values remain in Railway; this file references them without
containing them.
