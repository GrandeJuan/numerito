// Bad: onClick with only console.log
export function DeadButton() {
  return (
    <button onClick={() => console.log('clicked')}>Exportar</button>
  );
}
