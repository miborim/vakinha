import "./Footer.css";
import { campaign } from "../data/campaign";
import { withBase } from "../utils/paths";

const { contato } = campaign;

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__band-wrap">
        <img
          className="footer__band"
          src={withBase("/footer/footer-band.webp")}
          alt=""
          aria-hidden="true" loading="lazy" decoding="async" />

        <ul className="footer__contatos">
          <li>
            <a
              href={contato.instagram}
              target="_blank"
              rel="noreferrer"
              className="footer__contato"
            >
              <svg viewBox="0 0 24 24" className="footer__icone" aria-hidden="true">
                <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
                <circle cx="12" cy="12" r="4.2" />
                <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
              </svg>
              <span>{contato.instagramUser}</span>
            </a>
          </li>
          <li>
            <a
              href={contato.linkedin}
              target="_blank"
              rel="noreferrer"
              className="footer__contato"
            >
              <svg viewBox="0 0 24 24" className="footer__icone" aria-hidden="true">
                <rect x="2.5" y="2.5" width="19" height="19" rx="3" />
                <line x1="7" y1="10" x2="7" y2="17" />
                <circle cx="7" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
                <path d="M11 17v-4a2.4 2.4 0 0 1 4.8 0v4" />
                <line x1="11" y1="10" x2="11" y2="17" />
              </svg>
              <span>{contato.linkedinNome}</span>
            </a>
          </li>
          <li>
            <a href={`mailto:${contato.email}`} className="footer__contato">
              <svg viewBox="0 0 24 24" className="footer__icone" aria-hidden="true">
                <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
                <path d="M3 6l9 6 9-6" />
              </svg>
              <span>{contato.email}</span>
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
