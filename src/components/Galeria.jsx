import { useState, useCallback } from "react";
import "./Galeria.css";

const G = "/galeria";

const montes = [
  {
    label: "Inteli",
    tilt: -3,
    dir: "monte-inteli",
    fotos: [
      "turma-inteli.webp",
      "amigos-inteli.webp",
      "grupo-de-amigos-inteli.webp",
      "coletivo-feminino-grace-hopper.webp",
      "comunidade-wave.webp",
      "premiacao-primeiro-ano.webp",
      "amigas.webp",
    ],
  },
  {
    label: "Família",
    tilt: 2,
    dir: "monte-familia-amigos",
    fotos: [
      "familia-todos.webp",
      "familia.webp",
      "mae-e-irma.webp",
      "familia-pai.webp",
      "familia-mg.webp",
      "familia-infancia.webp",
      "familia-fotoantiga.webp",
    ],
  },
  {
    label: "Inteli Júnior",
    tilt: -2,
    dir: "monte-inteli-jr",
    fotos: [
      "intelijr.webp",
      "intelijr-conselho.webp",
      "intelijr-desperte.webp",
      "intelijr-esp25.webp",
      "intelijr-esp24.webp",
      "intelijr-evento.webp",
    ],
  },
  {
    label: "Estágios",
    tilt: 3,
    dir: "monte-estagios",
    fotos: [
      "morganstanley.webp",
      "ambev.webp",
      "elogroup.webp",
      "case-elogroup.webp",
      "rocket.webp",
      "whatsapp-image-2026-08-06-at-17-29-15.webp",
    ],
  },
];

function Monte({ label, tilt, dir, fotos }) {
  const [i, setI] = useState(0);
  const n = fotos.length;
  const next = useCallback(() => setI((v) => (v + 1) % n), [n]);
  const src = (k) => `${G}/${dir}/${fotos[(i + k) % n]}`;

  const onKey = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      next();
    }
  };

  return (
    <figure
      className="monte"
      style={{ "--tilt": `${tilt}deg` }}
      tabIndex={0}
      role="button"
      aria-label={`${label}: foto ${i + 1} de ${n}. Ative para ver a próxima.`}
      onMouseEnter={next}
      onClick={next}
      onKeyDown={onKey}
    >
      <div className="monte__pilha">
        {n > 2 && (
          <div className="monte__card monte__card--b2" aria-hidden="true">
            <img src={src(2)} alt="" loading="lazy" />
          </div>
        )}
        {n > 1 && (
          <div className="monte__card monte__card--b1" aria-hidden="true">
            <img src={src(1)} alt="" loading="lazy" />
          </div>
        )}
        <div className="monte__card monte__card--top" key={i}>
          <img src={src(0)} alt={`${label} — foto ${i + 1}`} loading="lazy" />
          <span className="monte__conta">
            {i + 1}/{n}
          </span>
          <span className="monte__hint" aria-hidden="true">
            ↻
          </span>
        </div>
      </div>
      <figcaption className="monte__legenda">{label}</figcaption>
    </figure>
  );
}

export default function Galeria() {
  return (
    <section className="section section--alt galeria-sec" id="galeria">
      <img className="galeria__divider" src={`${G}/galeria-ripped-paper.webp`} alt="" aria-hidden="true" />
      <img className="galeria__sticker galeria__sticker--stars" src={`${G}/galeria-stars.webp`} alt="" aria-hidden="true" />
      <img className="galeria__sticker galeria__sticker--mouth" src={`${G}/galeria-mouth-icon.webp`} alt="" aria-hidden="true" />
      <img className="galeria__sticker galeria__sticker--camera" src={`${G}/galeria-camera.webp`} alt="" aria-hidden="true" />

      <div className="container">
        <img className="galeria__titulo" src={`${G}/galeria-title.webp`} alt="Galeria" />
        <p className="section__subtitulo">
          Seria um erro pensar que a vida pode ser resumida em algumas fotos,
          mas, ainda assim, vale à pena tentar. Passe o mouse — ou toque no
          celular — para folhear cada monte de fotos.
        </p>

        <div className="galeria">
          {montes.map((m) => (
            <Monte key={m.dir} {...m} />
          ))}
        </div>
      </div>
    </section>
  );
}
