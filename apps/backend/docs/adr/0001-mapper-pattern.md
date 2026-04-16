# ADR 0001 — Domain↔Persistence Mapper Pattern

**Status:** Accepted
**Date:** 2026-04-16
**Issue:** #206 (PRD #194)

## Context

Repositories currently embed `toDomain` / `toPersistence` translation logic
inline as private methods. The boilerplate is copied across every
`MikroOrm*Repository`: extract scalars from a populated MikroORM schema
entity, unwrap value objects, cast enums, resolve foreign-key references.
The boilerplate is hard to test in isolation (it requires booting MikroORM
or hand-rolling fakes for entity references) and is inconsistent across
contexts — slight variations in how FKs are unwrapped, when Zod validates,
whether the mapper is reusable across query handlers.

## Decision

Introduce a shared `Mapper<DomainT, PersistenceT>` interface in
`apps/backend/src/shared/domain/mapper.ts`. Each aggregate exposes a
dedicated mapper class that implements the interface and lives next to its
ORM schema in `infrastructure/persistence/{aggregate}.mapper.ts`.
Repositories delegate translation to the mapper; their remaining
responsibility is ORM-specific (FK resolution via `em.getReference`,
populate hints, `em.flush()`).

### Interface

```ts
export interface Mapper<DomainT, PersistenceT> {
  toDomain(persistence: PersistenceT): DomainT;
  toPersistence(domain: DomainT): PersistenceT;
}
```

### What `PersistenceT` is

`PersistenceT` is a **flat data record** — not the ORM schema entity.

- Value objects are unwrapped to scalars (e.g. `Cuit` → `string`).
- Foreign keys are flattened to IDs (e.g. `usuario: UsuarioEntity` →
  `usuarioId: string`).
- No ORM decorators, populated references, or proxies.
- Defined as a Zod schema (`{aggregate}PersistenceSchema`) with the type
  inferred via `z.infer<typeof ...>`.

### Why a flat record (not the schema entity)

The mapper stays pure and unit-testable without booting MikroORM or
fabricating proxy references. The split also separates two concerns:

- **Mapper:** domain ⇄ data translation. Pure, deterministic, fully
  unit-tested.
- **Repository:** ORM adapter. Resolves FK references, applies populate
  hints, calls `em.create / em.flush`.

### `fromSchema()` helper on concrete mappers

Concrete mapper classes add a `fromSchema(entity: SchemaEntity):
PersistenceT` helper that encapsulates the populated-entity → flat-record
translation (e.g. `entity.usuario.id` → `usuarioId`). Repositories then
call:

```ts
return this.mapper.toDomain(this.mapper.fromSchema(entity));
```

This is *not* on the `Mapper` interface — it is an ORM-specific concern
that belongs to the concrete persistence-layer class.

### Zod validation in `toDomain`

`toDomain` MUST validate `PersistenceT` against the Zod schema before
reconstituting the domain entity. Failing fast on schema drift between the
database and the domain model is far easier to debug than a silently-wrong
aggregate downstream.

```ts
toDomain(persistence: SesionPersistence): Sesion {
  const data = sesionPersistenceSchema.parse(persistence);
  return Sesion.reconstitute({ ...data }, data.id);
}
```

## Reference Implementation

`apps/backend/src/iam/infrastructure/persistence/sesion.mapper.ts` and its
spec at `sesion.mapper.spec.ts`. The repository at
`mikro-orm-sesion.repository.ts` delegates to the mapper and resolves the
`UsuarioEntity` FK in `save()`.

## File Layout Convention

```
apps/backend/src/{context}/infrastructure/persistence/
  {aggregate}.mapper.ts            # class + Zod schema + persistence type
  {aggregate}.mapper.spec.ts       # round-trip + Zod rejection tests
  mikro-orm-{aggregate}.repository.ts   # delegates to mapper
```

## Migration Plan

Per-context migration slices land independently (issues #212–#218): one
slice per bounded context. Each slice extracts the mapper, adds the spec,
and updates the repository to delegate. The shared interface lands first
(this ADR / issue #206) and stays opt-in until each context migrates.

## Consequences

- **Positive:** mappers are unit-testable without ORM; FK / VO / enum
  handling is consistent across contexts; downstream slices can land
  independently with a fixed shape.
- **Negative:** one extra file per aggregate; repositories make two calls
  on read (`mapper.toDomain(mapper.fromSchema(entity))`) instead of one.
- **Neutral:** the `fromSchema` helper is a per-mapper convention rather
  than an interface contract, since it is ORM-specific.
