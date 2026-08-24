import { useEffect, useState } from "react";
import "./Sobre.css";
import { withBase } from "../utils/paths";

const B = withBase("/sobre-intercambio");

const custos = [
  {
    key: "alimentacao",
    src: `${B}/sobre-eating.webp`,
    label: "1. Alimentação",
    cls: "sobre__custo--eating",
  },
  {
    key: "moradia",
    src: `${B}/sobre-housing.webp`,
    label: "2. Moradia",
    cls: "sobre__custo--housing",
  },
  {
    key: "passagens",
    src: `${B}/sobre-traveling.webp`,
    label: "3. Passagens",
    cls: "sobre__custo--traveling",
  },
  {
    key: "outras",
    src: `${B}/sobre-other-expenses.webp`,
    label: "4. Outras despesas",
    cls: "sobre__custo--other",
  },
];

const detalhesOrcamento = {
  alimentacao: {
    titulo: "Alimentaçao",
    itens: [
      { label: "Por mês", valor: "€300–400 = R$ 1.800-2.400/mês" },
      { label: "Total em 3 meses", valor: "R$ 5.400-7.200", destaque: true },
    ],
  },
  moradia: {
    titulo: "Moradia",
    itens: [
      { label: "Por mês", valor: "€500–700 = R$ 3.000-4.200/mês" },
      { label: "Total em 3 meses", valor: "R$ 9.000-12.600", destaque: true },
    ],
  },
  passagens: {
    titulo: "Passagens",
    itens: [
      { label: "Já gasto", valor: "R$ 6.300", destaque: true },
    ],
  },
  outras: {
    titulo: "Outras despesas",
    subtitulo: "Transporte, chip e seguro saúde",
    itens: [
      { label: "Por mês (Passe Navigo)", valor: "€90,80 = R$ 545/mês" },
      { label: "Chip telefônico (custo único)", valor: "R$ 300-400" },
      { label: "Seguro saúde, 3 meses", valor: "€75–113 = R$ 450-678" },
      { label: "Total em 3 meses", valor: "R$ 2.385-2.713", destaque: true },
    ],
  },
};

const resumoTotal = [
  { categoria: "Alimentação", valor: "R$ 5.400-7.200" },
  { categoria: "Moradia", valor: "R$ 9.000-12.600" },
  { categoria: "Passagens", valor: "R$ 6.300" },
  { categoria: "Transporte / chip / seguro", valor: "R$ 2.385-2.713" },
];

export default function Sobre() {
  const [categoriaAberta, setCategoriaAberta] = useState(null);
  const [resumoAberto, setResumoAberto] = useState(false);
  const detalhe = categoriaAberta ? detalhesOrcamento[categoriaAberta] : null;

  useEffect(() => {
    if (!categoriaAberta && !resumoAberto) return;
    const aoTeclar = (e) => {
      if (e.key === "Escape") {
        setCategoriaAberta(null);
        setResumoAberto(false);
      }
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [categoriaAberta, resumoAberto]);

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
          na ECE Paris. A faculdade cobre os custos dos estudos, mas os gastos
          pessoais ficam por minha conta. É aqui que a sua ajuda faz a
          diferença.
        </p>
      </div>

      <div className="sobre__custos">
        {custos.map((c) => (
          <figure className={`sobre__custo ${c.cls}`} key={c.label}>
            <div
              className="sobre__custo-imgwrap"
              role="button"
              tabIndex={0}
              onClick={() => setCategoriaAberta(c.key)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setCategoriaAberta(c.key);
                }
              }}
              aria-label={`Ver detalhes do orçamento de ${c.label}`}
            >
              <img src={c.src} alt={c.label} />
              <button
                type="button"
                className="sobre__info-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setCategoriaAberta(c.key);
                }}
                aria-label={`Ver detalhes do orçamento de ${c.label}`}
              >
                <span aria-hidden="true">i</span>
              </button>
            </div>
            <figcaption>{c.label}</figcaption>
          </figure>
        ))}
      </div>

      <p className="sobre__nota">
        <button
          type="button"
          className="sobre__nota-destaque"
          onClick={() => setResumoAberto(true)}
        >
          Nesse orçamento
        </button>{" "}
        eu não incluí gastos com lazer ou viagens pessoais, considerei só o
        necessário para os estudos mesmo. A partir desses valores, calculei
        quanto ainda preciso complementar do que já tenho guardado, além de
        uma reserva de emergência para os imprevistos :)
      </p>

      {detalhe && (
        <div
          className="sobre__modal"
          role="dialog"
          aria-modal="true"
          aria-label={`Detalhes do orçamento: ${detalhe.titulo}`}
          onClick={() => setCategoriaAberta(null)}
        >
          <div className="sobre__modal-box" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="sobre__modal-fechar"
              onClick={() => setCategoriaAberta(null)}
              aria-label="Fechar"
            >
              ×
            </button>

            <h3 className="sobre__modal-titulo">{detalhe.titulo}</h3>
            {detalhe.subtitulo && (
              <p className="sobre__modal-subtitulo">{detalhe.subtitulo}</p>
            )}

            <ul className="sobre__modal-itens">
              {detalhe.itens.map((item) => (
                <li
                  key={item.label}
                  className={item.destaque ? "is-destaque" : ""}
                >
                  <span className="sobre__modal-item-label">{item.label}</span>
                  <span className="sobre__modal-item-valor">{item.valor}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {resumoAberto && (
        <div
          className="sobre__modal"
          role="dialog"
          aria-modal="true"
          aria-label="Resumo total do orçamento"
          onClick={() => setResumoAberto(false)}
        >
          <div className="sobre__modal-box" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="sobre__modal-fechar"
              onClick={() => setResumoAberto(false)}
              aria-label="Fechar"
            >
              ×
            </button>

            <h3 className="sobre__modal-titulo">Resumo total</h3>

            <table className="sobre__tabela">
              <tbody>
                {resumoTotal.map((r) => (
                  <tr key={r.categoria}>
                    <td>{r.categoria}</td>
                    <td>{r.valor}</td>
                  </tr>
                ))}
                <tr className="is-total">
                  <td>Total</td>
                  <td>R$ 23.085-28.813</td>
                </tr>
                <tr className="is-media">
                  <td>Cenário médio</td>
                  <td>R$ 25.949</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
