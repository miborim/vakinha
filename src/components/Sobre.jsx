import "./Sobre.css";
import { withBase } from "../utils/paths";

const B = withBase("/sobre-intercambio");

const custos = [
  { src: `${B}/sobre-eating.webp`, label: "1. Alimentação", cls: "sobre__custo--eating" },
  { src: `${B}/sobre-housing.webp`, label: "2. Moradia", cls: "sobre__custo--housing" },
  { src: `${B}/sobre-traveling.webp`, label: "3. Passagens", cls: "sobre__custo--traveling" },
  {
    src: `${B}/sobre-other-expenses.webp`,
    label: "4. Outras despesas",
    cls: "sobre__custo--other",
  },
];

export default function Sobre() {
  return (
    <section className="section sobre" id="sobre">
      {/* Faixa rasgada (bandeira da França) no topo — transição da Hero */}
      <img
        className="sobre__flag-band"
        src={`${B}/sobre-france-flag.webp`}
        alt=""
        aria-hidden="true"
      />

      {/* Enfeites (colagem) */}
      <img className="sobre__deco sobre__star" src={`${B}/sobre-star.webp`} alt="" aria-hidden="true" />
      <img className="sobre__deco sobre__letter" src={`${B}/sobre-acceptance-letter.webp`} alt="Carta de aprovação da ECE" />
      <img className="sobre__deco sobre__painting" src={`${B}/sobre-painting.webp`} alt="" aria-hidden="true" />
      <img className="sobre__deco sobre__trophy" src={`${B}/sobre-trophy.webp`} alt="" aria-hidden="true" />

      <div className="sobre__inner">
        <img
          className="sobre__titulo-img"
          src={`${B}/sobre-title.webp`}
          alt="Sobre o intercâmbio"
        />

        <p className="sobre__texto">
          Conhecer a França sempre foi um sonho, e é um privilégio que a minha
          primeira oportunidade de viajar para fora seja por meio dos estudos.
          Vou passar um semestre tendo aulas do mestrado{" "}
          <span className="sobre__mestrado">
            &ldquo;Artificial Intelligence for Business Transformation&rdquo;
          </span>{" "}
          na ECE Paris. A faculdade cobre os custos dos estudos — mas os gastos
          pessoais ficam por minha conta. É aqui que a sua ajuda faz a
          diferença.
        </p>
      </div>

      <div className="sobre__custos">
        {custos.map((c) => (
          <figure className={`sobre__custo ${c.cls}`} key={c.label}>
            <img src={c.src} alt={c.label} />
            <figcaption>{c.label}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
