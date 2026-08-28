// Marcas de esquina tipo visor/mira de cámara -- firma visual reusable para
// cualquier superficie que deba leerse como "instrumento de inspección" en
// vez de una imagen suelta. `tone` controla el color del trazo: "blue" para
// fondos oscuros (video), "white" para fondos claros/con foto.
const TONE = {
  blue: "border-blue-400/60",
  white: "border-white/70",
  green: "border-green-400/60",
};

// Nota: las clases van completas y estáticas (nunca `left-${x}`) a propósito
// -- el scanner de Tailwind busca substrings literales en el código fuente,
// así que una clase armada en runtime con template string no se generaría.
export function ViewfinderCorners({ tone = "blue" }) {
  const corner = `pointer-events-none absolute h-5 w-5 ${TONE[tone]}`;
  return (
    <>
      <span className={`${corner} left-3 top-3 border-l-2 border-t-2 rounded-tl-md`} />
      <span className={`${corner} right-3 top-3 border-r-2 border-t-2 rounded-tr-md`} />
      <span className={`${corner} left-3 bottom-3 border-l-2 border-b-2 rounded-bl-md`} />
      <span className={`${corner} right-3 bottom-3 border-r-2 border-b-2 rounded-br-md`} />
    </>
  );
}
