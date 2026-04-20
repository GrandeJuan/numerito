// Stub for @mikro-orm/core in unit tests.
// Only provides the symbols our code imports at type/construction boundaries.
// View specs mock the actual EntityManager instance they receive.

export class EntityManager {}
export class EntitySchema {
  constructor(_meta: unknown) {}
}
export class MikroORM {}

export const Entity = () => () => {};
export const PrimaryKey = () => () => {};
export const Property = () => () => {};
export const ManyToOne = () => () => {};
export const OneToMany = () => () => {};
export const OneToOne = () => () => {};
export const ManyToMany = () => () => {};
export const Enum = () => () => {};
export const Unique = () => () => {};
export const Index = () => () => {};
export const Filter = () => () => {};
export const Collection = class {};
export const Reference = class {};
