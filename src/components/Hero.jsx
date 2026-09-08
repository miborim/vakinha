import "./Hero.css";
import { withBase } from "../utils/paths";

export default function Hero() {
  return (
    <section className="hero" id="topo" aria-labelledby="titulo-principal">
      {/* Título real da página. Fica visível apenas para leitores de tela e
          crawlers porque, no visual, ele é composto pela colagem/letras. */}
      <h1 className="sr-only" id="titulo-principal">
        Mirella na França — vaquinha para o intercâmbio de Inteligência
        Artificial na ECE Paris
      </h1>

      {/* Colagem de fundo. O <picture> garante que o navegador baixe apenas a
          versão correspondente ao viewport (antes as duas eram baixadas). */}
      <picture className="hero__collage-wrap">
        <source
          media="(max-width: 860px)"
          srcSet={withBase("/hero/hero-mobile.webp")}
        />
        <img
          className="hero__collage"
          src={withBase("/hero/hero-desktop.webp")}
          alt="Colagem: Mirella na França, com Torre Eiffel, avião, montanhas e flores"
          fetchPriority="high"
          decoding="async"
        />
      </picture>

      <div className="hero__right">
        <img
          className="hero__prazer"
          src={withBase("/hero/hero-prazer-letters.webp")}
          width="820"
          height="183"
          alt="Prazer"
        />

        <img
          className="hero__enchantee"
          src={withBase("/hero/hero-enchantee.webp")}
          width="458"
          height="67"
          alt="ou &ldquo;enchantée&rdquo;"
        />

        <img
          className="hero__polaroid"
          src={withBase("/hero/hero-mirella-polaroid.webp")}
          width="620"
          height="719"
          alt="Foto da Mirella"
        />

        <div className="hero__intro">
          <p className="hero__paragrafo">
            Sou a Mirella, estudo Sistemas de Informação, e é um sonho
            realizado compartilhar que fui aprovada na{" "}
            <strong>ECE Paris para estudar AI e Negócios</strong>. Consegui a
            bolsa integral do curso, mas ainda preciso arcar com os gastos
            pessoais
          </p>
          <p className="hero__existe">
            e para isso preciso da sua ajuda
            <span className="hero__existe-bang">!</span>
          </p>
        </div>

        <div className="hero__acoes">
          <a href="#doar" className="hero__btn" aria-label="Doar">
            <img src={withBase("/hero/hero-doar-botton.webp")} width="520" height="164" alt="Doar" />
          </a>
          <a href="#sobre" className="hero__btn" aria-label="Saber mais">
            <img src={withBase("/hero/hero-sabermais-botton.webp")} width="520" height="171" alt="Saber mais" />
          </a>
        </div>
      </div>

      <img
        className="hero__amelie"
        src={withBase("/hero/hero-amelie-icon.webp")}
        alt=""
        aria-hidden="true"
      />
    </section>
  );
}
