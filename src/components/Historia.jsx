import "./Historia.css";
import { withBase } from "../utils/paths";

const B = withBase("/historia-pessoal");

const entradas = [
  {
    ano: "2024",
    logo: withBase("/logos/inteli-logo-preta.webp"),
    logoCls: "is-inteli",
    data: "janeiro/2024 a dezembro/2027",
    desc: "Sistemas de Informação, Negócios e Liderança",
  },
  {
    logo: `${B}/morgan-stanley-logo.webp`,
    logoCls: "is-morgan",
    data: "julho/2024",
    desc: "Estágio de férias em cibersegurança estratégica",
  },
  {
    ano: "2025",
    logo: `${B}/inteli-junior-logo.webp`,
    logoCls: "is-inteli-jr",
    data: "janeiro a dezembro/2025",
    desc: "Presidente executiva de empresa júnior de tecnologia",
  },
  {
    logo: `${B}/ambev-logo.webp`,
    logoCls: "is-ambev",
    data: "julho/2025",
    desc: "Estágio de férias em ciência de dados",
  },
  {
    ano: "2026",
    logo: `${B}/logo_elogroup.webp`,
    logoCls: "is-elogroup",
    data: "janeiro/2026",
    desc: "Estágio de férias em consultoria estratégica em IA",
  },
  {
    logo: `${B}/Microsoft-Logo.webp`,
    logoCls: "is-microsoft",
    data: "março a setembro/2026",
    desc: "Estágio de negócios em Sucesso do Cliente",
  },
  {
    logo: withBase("/logos/logo-ece.svg"),
    logoCls: "is-ece",
    data: "outubro a dezembro/2026",
    desc: 'Intercâmbio em "AI for Business Transformation"',
  },
];

export default function Historia() {
  return (
    <section className="section historia" id="historia" aria-labelledby="titulo-historia">
      {/* Enfeites */}
      <img className="historia__deco historia__paper-l" src={`${B}/historia-ripped-paper-left.webp`} alt="" aria-hidden="true" loading="lazy" decoding="async" />
      <img className="historia__deco historia__paper-r" src={`${B}/historia-ripped-paper-right.webp`} alt="" aria-hidden="true" loading="lazy" decoding="async" />
      <img className="historia__deco historia__heart" src={`${B}/historia-heart.webp`} alt="" aria-hidden="true" loading="lazy" decoding="async" />
      <img className="historia__deco historia__polaroid-l" src={`${B}/historia-left-polaroid.webp`} alt="Mirella jogando badminton" loading="lazy" decoding="async" />
      <img className="historia__deco historia__stickers-l" src={`${B}/historia-left-stickers.webp`} alt="" aria-hidden="true" loading="lazy" decoding="async" />
      <img className="historia__deco historia__polaroid-r" src={`${B}/historia-right-polaroid.webp`} alt="Fotos da Mirella" loading="lazy" decoding="async" />
      <img className="historia__deco historia__flower" src={`${B}/historia-flower.webp`} alt="" aria-hidden="true" loading="lazy" decoding="async" />

      <div className="historia__inner">
        <h2 className="sr-only" id="titulo-historia">
          Minha história
        </h2>
        <img className="historia__titulo" src={`${B}/historia-title.webp`} alt="" aria-hidden="true" loading="lazy" decoding="async" />

        <div className="historia__timeline">
          <span className="historia__line" aria-hidden="true" />

          {entradas.map((e, i) => (
            <div className={`historia__entry ${e.logoCls}`} key={i}>
              <div className="historia__year">
                {e.ano && (
                  <img src={`${B}/ano-${e.ano}.webp`} alt={e.ano} loading="lazy" decoding="async" />
                )}
              </div>
              <div className="historia__content">
                <div className="historia__head">
                  <img className="historia__logo" src={e.logo} alt="" loading="lazy" decoding="async" />
                  {e.data && <span className="historia__data">{e.data}</span>}
                </div>
                <p className="historia__desc">{e.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="historia__bolsista">
          <img className="historia__note" src={`${B}/historia-ngos-note.webp`} alt="não cheguei até aqui sem ajuda!" loading="lazy" decoding="async" />
          <img className="historia__ngos" src={`${B}/historia-ngos.webp`} alt="iSmart, Instituto Embraer e Instituto Semear" loading="lazy" decoding="async" />
          <p className="historia__bolsista-txt">
            Ser bolsista é parte da minha história, desde 2018, quando eu era
            apenas uma jovenzinha e enxergaram potencial em mim.
          </p>
        </div>
      </div>
    </section>
  );
}
