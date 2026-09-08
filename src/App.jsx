import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Sobre from "./components/Sobre";
import Historia from "./components/Historia";
import Galeria from "./components/Galeria";
import Doar from "./components/Doar";
import Footer from "./components/Footer";

export default function App() {
  return (
    <>
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo principal
      </a>
      <Navbar />
      <main id="conteudo" tabIndex={-1}>
        <Hero />
        <Sobre />
        <Historia />
        <Galeria />
        <Doar />
      </main>
      <Footer />
    </>
  );
}
