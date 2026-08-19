// Renderiza um texto no estilo "letras recortadas de revista" (ransom note),
// alternando cores e rotações por letra.
export default function RansomText({ text, className = "" }) {
  return (
    <span className={`ransom ${className}`} aria-label={text} role="text">
      {[...text].map((ch, i) =>
        ch === " " ? (
          <span key={i} className="ransom__space" aria-hidden="true">
            {" "}
          </span>
        ) : (
          <span
            key={i}
            aria-hidden="true"
            className={`ransom__ch ransom__ch--${i % 6}`}
          >
            {ch}
          </span>
        )
      )}
    </span>
  );
}
