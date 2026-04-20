// Good: onClick with real logic
export function RealButton() {
  return (
    <button onClick={() => openModal('confirm')}>Confirmar</button>
  );
}

function openModal(_name: string) { /* real logic */ }
