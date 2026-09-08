import { useState, useCallback } from "react";
import "./Doar.css";
import { campaign } from "../data/campaign";
import { perguntasFrequentes } from "../data/faq";
import ProgressBar from "./ProgressBar";
import { withBase } from "../utils/paths";

const B = withBase("/faca-parte");

export default function Doar() {
  const [copiado, setCopiado] = useState(false);
  const [merci, setMerci] = useState(false);

  const copiarPix = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(campaign.pix);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  }, []);

  return (
    <section className="section doar" id="doar" aria-labelledby="titulo-doar">
      <img
        className="doar__flower"
        src={`${B}/faca-parte-flower.webp`}
        alt=""
        aria-hidden="true" loading="lazy" decoding="async" />
      <img
        className="doar__kiss"
        src={`${B}/faca-parte-kiss.webp`}
        alt=""
        aria-hidden="true" loading="lazy" decoding="async" />

      <div className="doar__inner">
        <img
          className="doar__setas"
          src={`${B}/setas.webp`}
          alt=""
          aria-hidden="true" loading="lazy" decoding="async" />
        <h2 className="sr-only" id="titulo-doar">
          Faça parte dessa conquista
        </h2>
        <img
          className="doar__titulo-img"
          src={`${B}/arrecadacao-title.webp`}
          alt=""
          aria-hidden="true" loading="lazy" decoding="async" />

        <p className="doar__subtitulo">
          Qualquer valor é bem-vindo e faz diferença. Acompanhe a arrecadação e
          contribua via PIX ou entre em contato para outras formas de apoio.
        </p>

        <div className="doar__progresso">
          <ProgressBar />
        </div>

        <div className="doar__pix">
          <span className="tape" aria-hidden="true"></span>
          <h3 className="sr-only">Chave PIX para doação</h3>
          <img
            className="doar__pix-titulo"
            src={`${B}/chavepix.webp`}
            alt=""
            aria-hidden="true" loading="lazy" decoding="async" />
          <div className="doar__pix-linha">
            <strong className="doar__pix-valor">{campaign.pix}</strong>
            <button
              type="button"
              className="doar__pix-copiar"
              onClick={copiarPix}
              aria-label="Copiar chave PIX"
            >
              {copiado ? "copiado!" : "copiar"}
            </button>
          </div>
          <p className="doar__pix-status sr-only" role="status">
            {copiado ? "Chave PIX copiada para a área de transferência." : ""}
          </p>
          <p className="doar__pix-nota">
            Nota de transparência: essa chave PIX é de uma conta usada só para
            a campanha, e eu atualizo os valores manualmente aqui. Fazer um
            site próprio foi a minha alternativa para evitar as taxas
            (abusivas) das plataformas de arrecadação.
          </p>
        </div>

        <div className="doar__ajuda">
          <h3 className="doar__ajuda-titulo">Como você pode ajudar</h3>
          <ol className="doar__ajuda-lista">
            <li>
              <strong>Doe qualquer valor via PIX</strong> para a chave{" "}
              {campaign.pix} — não existe valor mínimo, tudo soma.
            </li>
            <li>
              <strong>Compartilhe o link</strong> desta página com quem você
              acha que pode gostar de fazer parte.
            </li>
            <li>
              <strong>Acompanhe a campanha</strong> no Instagram{" "}
              <a
                href={campaign.contato.instagram}
                target="_blank"
                rel="noreferrer"
              >
                {campaign.contato.instagramUser}
              </a>
              .
            </li>
          </ol>
        </div>

        <div className="doar__faq">
          <h3 className="doar__faq-titulo">Perguntas frequentes</h3>
          {perguntasFrequentes.map((item) => (
            <details className="doar__faq-item" key={item.pergunta}>
              <summary className="doar__faq-pergunta">{item.pergunta}</summary>
              <p className="doar__faq-resposta">{item.resposta}</p>
            </details>
          ))}
        </div>

        <div className="doar__acoes">
          <button
            type="button"
            className="doar__jadoei"
            onClick={() => setMerci(true)}
          >
            <img src={`${B}/jadoei_bottom.webp`} alt="Já doei" loading="lazy" decoding="async" />
          </button>
        </div>
      </div>

      {merci && (
        <div
          className="doar__merci"
          role="dialog"
          aria-label="Muito obrigada pela sua doação!"
          onClick={() => setMerci(false)}
        >
          <div className="doar__merci-box" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="doar__merci-fechar"
              onClick={() => setMerci(false)}
              aria-label="Fechar"
            >
              ×
            </button>
            <img src={`${B}/merci.gif`} alt="Merci! Obrigada pela sua doação." loading="lazy" decoding="async" />
            <p className="doar__merci-txt">
              muito obrigada por fazer parte{" "}
              <span className="doar__merci-coracao">♥</span>
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
