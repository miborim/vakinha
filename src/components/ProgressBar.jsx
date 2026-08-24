import "./ProgressBar.css";
import { campaign } from "../data/campaign";
import { formatBRL } from "../utils/format";

function formatPercent(valor) {
  return valor.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}

export default function ProgressBar() {
  const { meta, arrecadado, atualizadoEm } = campaign;
  const pct = meta > 0 ? Math.max(0, Math.min(100, (arrecadado / meta) * 100)) : 0;

  return (
    <div className="progresso">
      <div className="progresso__topo">
        <div>
          <span className="progresso__valor">{formatBRL(arrecadado)}</span>
          <span className="progresso__meta">de {formatBRL(meta)}</span>
        </div>
        <span className="progresso__pct">{formatPercent(pct)}%</span>
      </div>

      <div
        className="progresso__barra"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="progresso__preenchimento" style={{ width: `${pct}%` }} />
      </div>

      <p className="progresso__legenda">
        {arrecadado === 0 ? (
          <>
            seja parte desse sonho <span className="progresso__coracao">♥</span>
          </>
        ) : (
          <>
            Faltam{" "}
            <span className="progresso__legenda-valor">
              {formatBRL(meta - arrecadado)}
            </span>
          </>
        )}
      </p>

      {atualizadoEm && (
        <p className="progresso__atualizado">Atualizado em {atualizadoEm}</p>
      )}
    </div>
  );
}
