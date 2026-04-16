/**
 * Mapper between a domain aggregate (DomainT) and its persistence
 * representation (PersistenceT).
 *
 * PersistenceT is a *plain data record* — a flat shape where:
 *   - value objects are unwrapped to scalars (e.g. `Cuit` -> `string`),
 *   - foreign keys are flattened to IDs (e.g. `usuario: UsuarioEntity` ->
 *     `usuarioId: string`),
 *   - there are no ORM decorators, populated references, or proxies.
 *
 * Why a flat record (and not the ORM schema entity)?
 *   The mapper stays pure and unit-testable without booting MikroORM or
 *   resolving entity references. Repositories handle the ORM-specific
 *   concerns (FK resolution, em.create / em.findOne, populate hints) and
 *   delegate the domain <-> data translation to the mapper.
 *
 * Recommended pattern for `toDomain`:
 *   Validate the incoming persistence record against a Zod schema before
 *   reconstituting the domain entity. This fails fast on drift between the
 *   database schema and the domain model — much easier to debug than a
 *   silently-wrong aggregate downstream.
 *
 *   ```ts
 *   toDomain(persistence: SesionPersistence): Sesion {
 *     const data = sesionPersistenceSchema.parse(persistence);
 *     return Sesion.reconstitute({ ...data }, data.id);
 *   }
 *   ```
 *
 * Recommended file layout:
 *   apps/backend/src/{context}/infrastructure/persistence/
 *     {aggregate}.mapper.ts        // class + Zod schema + persistence type
 *     {aggregate}.mapper.spec.ts   // round-trip + Zod rejection tests
 *     mikro-orm-{aggregate}.repository.ts  // delegates to mapper
 *
 * Conventions for concrete mappers:
 *   - Export a `{aggregate}PersistenceSchema` (Zod) and an inferred
 *     `{Aggregate}Persistence` type.
 *   - Implement `Mapper<{Aggregate}, {Aggregate}Persistence>`.
 *   - Add a `fromSchema({aggregate}Entity)` helper on the mapper class for
 *     ORM-specific unwrapping (FK references -> IDs). Repositories call
 *     `mapper.toDomain(mapper.fromSchema(entity))`.
 */
export interface Mapper<DomainT, PersistenceT> {
  toDomain(persistence: PersistenceT): DomainT;
  toPersistence(domain: DomainT): PersistenceT;
}
