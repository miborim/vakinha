import "./ProgressBar.css";
import { campaign } from "../data/campaign";
import { formatBRL } from "../utils/format";

export default function ProgressBar() {
  const { meta, arrecadado, atualizadoEm } = campaign;
  const pct = meta > 0 ? Math.min(100, Math.round((arrecadado / meta) * 100)) : 0;

  return (
    <div className="progresso">
      <div className="progresso__topo">
        <div>
          <span className="progresso__valor">{formatBRL(arrecadado)}</span>
          <span className="progresso__meta">de {formatBRL(meta)}</span>
        </div>
        <span className="progresso__pct">{pct}%</span>
      </div>

      <div className="progresso__barra" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="progresso__preenchimento" style={{ width: `${pct}%` }} />
      </div>

      <p className="progresso__legenda">
        {arrecadado === 0 ? (
          <>
            seja parte desse sonho <span className="progresso__coracao">♥</span>
          </>
        ) : (
          `Faltam ${formatBRL(meta - arrecadado)} para alcançar a meta`
        )}
      </p>

      {atualizadoEm && (
        <p className="progresso__atualizado">Atualizado em {atualizadoEm}</p>
      )}
    </div>
  );
}
