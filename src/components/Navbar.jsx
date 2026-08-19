import "./Navbar.css";

const links = [
  { href: "#sobre", img: "intercambio", alt: "O intercâmbio" },
  { href: "#historia", img: "minhahistoria", alt: "Minha história" },
  { href: "#galeria", img: "galeria", alt: "Galeria" },
  { href: "#doar", img: "doar", alt: "Doar", cta: true },
];

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <a href="#topo" className="navbar__logo" aria-label="Mirella na França">
          <img src="/header/header-logo.png" alt="Mirella na França" />
        </a>
        <nav className="navbar__links">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`navbar__link${l.cta ? " navbar__link--cta" : ""}`}
              aria-label={l.alt}
            >
              <img className="navbar__word" src={`/header/header-${l.img}.png`} alt={l.alt} />
              <img
                className="navbar__heart"
                src="/header/header-hover.png"
                alt=""
                aria-hidden="true"
              />
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
