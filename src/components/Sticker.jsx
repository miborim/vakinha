// Figurinha/sticker decorativo posicionado de forma absoluta.
// Passe posição via `style` (top/left/right/bottom), tamanho via `width`
// e rotação via `rotate` (graus). Por padrão é escondido no mobile.
export default function Sticker({
  src,
  alt = "",
  width,
  rotate = 0,
  style = {},
  className = "",
  decorativo = true,
}) {
  return (
    <img
      src={src}
      alt={alt}
      aria-hidden={alt === "" ? "true" : undefined}
      loading="lazy"
      className={`sticker ${decorativo ? "sticker--deco" : ""} ${className}`}
      style={{
        width,
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        ...style,
      }}
    />
  );
}
