import "./Hero.css";

export default function Hero() {
  return (
    <section className="hero" id="topo">
      {/* Colagem da esquerda (imagem única com todos os elementos) */}
      <img
        className="hero__collage hero__collage--desktop"
        src="/hero/hero-desktop.webp"
        alt="Colagem: Mirella na França, com Torre Eiffel, avião, montanhas e flores"
      />
      <img
        className="hero__collage hero__collage--mobile"
        src="/hero/hero-mobile.webp"
        alt="Colagem: Mirella na França"
      />

      <div className="hero__right">
        <img
          className="hero__prazer"
          src="/hero/hero-prazer-letters.webp"
          alt="Prazer"
        />

        <img
          className="hero__enchantee"
          src="/hero/hero-enchantee.webp"
          alt="ou &ldquo;enchantée&rdquo;"
        />

        <img
          className="hero__polaroid"
          src="/hero/hero-mirella-polaroid.webp"
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
            <img src="/hero/hero-doar-botton.webp" alt="Doar" />
          </a>
          <a href="#sobre" className="hero__btn" aria-label="Saber mais">
            <img src="/hero/hero-sabermais-botton.webp" alt="Saber mais" />
          </a>
        </div>
      </div>

      <img
        className="hero__amelie"
        src="/hero/hero-amelie-icon.webp"
        alt=""
        aria-hidden="true"
      />
    </section>
  );
}
