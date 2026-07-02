# Backend Security Audit Notes

Last updated: 2026-07-02

## Scope

This pass investigated the Multer/Nest production audit warning without making breaking dependency upgrades.

Commands used:

```bash
npm audit --omit=dev
npm ls multer @nestjs/platform-express @nestjs/core @nestjs/swagger
npm outdated --omit=dev
npm view @nestjs/platform-express@latest version dependencies peerDependencies
npm view multer version versions --json
```

## Finding

Initial `npm audit --omit=dev` reported high-severity Multer advisories:

- `GHSA-72gw-mp4g-v24j`: deeply nested field name denial of service.
- `GHSA-3p4h-7m6x-2hcm`: incomplete cleanup of aborted uploads.

Dependency path:

```text
@nestjs/swagger
-> @nestjs/core
-> @nestjs/platform-express
-> multer@2.1.1
```

The latest Nest 11 patch available during this pass was `11.1.27`, and `@nestjs/platform-express@11.1.27` still declares `multer: 2.1.1`.

## Resolution Applied

Applied safe, non-breaking package changes:

- Updated Nest packages from `11.1.26` to `11.1.27` through `npm update`.
- Added npm override:

```json
{
  "overrides": {
    "multer": "2.2.0"
  }
}
```

Verified dependency tree:

```text
@nestjs/platform-express@11.1.27
-> multer@2.2.0 overridden
```

Final production audit:

```text
npm audit --omit=dev
found 0 vulnerabilities
```

## Remaining Dev-Only Audit Noise

Full `npm audit` still reports dev-only advisories:

- `form-data`
- `js-yaml` under Istanbul/coverage tooling

These are outside the production audit scope requested here. They can be handled in a later dev-dependency maintenance pass.

## Recommendation

Keep the `multer` override until Nest releases a platform-express patch that depends on a non-vulnerable Multer version directly. After that:

1. Remove the override.
2. Run `npm update @nestjs/common @nestjs/core @nestjs/platform-express @nestjs/testing`.
3. Run full backend verification.
