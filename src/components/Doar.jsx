import { useState, useCallback } from "react";
import "./Doar.css";
import { campaign } from "../data/campaign";
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
    <section className="section doar" id="doar">
      <img
        className="doar__flower"
        src={`${B}/faca-parte-flower.webp`}
        alt=""
        aria-hidden="true"
      />
      <img
        className="doar__kiss"
        src={`${B}/faca-parte-kiss.webp`}
        alt=""
        aria-hidden="true"
      />

      <div className="doar__inner">
        <img
          className="doar__setas"
          src={`${B}/setas.webp`}
          alt=""
          aria-hidden="true"
        />
        <img
          className="doar__titulo-img"
          src={`${B}/arrecadacao-title.webp`}
          alt="Faça parte dessa conquista"
        />

        <p className="doar__subtitulo">
          Qualquer valor é bem-vindo e faz diferença. Acompanhe a arrecadação e
          contribua via PIX ou entre em contato para outras formas de apoio.
        </p>

        <div className="doar__progresso">
          <ProgressBar />
        </div>

        <div className="doar__pix">
          <span className="tape" aria-hidden="true"></span>
          <img
            className="doar__pix-titulo"
            src={`${B}/chavepix.webp`}
            alt="Chave PIX"
          />
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
          <p className="doar__pix-nota">
            Nota de transparência: essa chave PIX é de uma conta usada só para
            a campanha, e eu atualizo os valores manualmente aqui. Fazer um
            site próprio foi a minha alternativa para evitar as taxas
            (abusivas) das plataformas de arrecadação.
          </p>
        </div>

        <div className="doar__acoes">
          <button
            type="button"
            className="doar__jadoei"
            onClick={() => setMerci(true)}
          >
            <img src={`${B}/jadoei_bottom.webp`} alt="Já doei" />
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
            <img src={`${B}/merci.gif`} alt="Merci! Obrigada pela sua doação." />
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
