// Bad: href to a route that doesn't exist in app/
export function DeadLink() {
  return (
    <a href="/this-route-does-not-exist">Ir a ningún lado</a>
  );
}
