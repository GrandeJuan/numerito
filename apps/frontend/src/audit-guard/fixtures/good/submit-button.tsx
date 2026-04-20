// Good: type="submit" inside a form — whitelisted
export function GoodForm() {
  return (
    <form onSubmit={(e) => { e.preventDefault(); save(); }}>
      <button type="submit">Guardar</button>
    </form>
  );
}

function save() { /* real logic */ }
