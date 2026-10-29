import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { recordPageView } from "./analytics";
import "./style.css";

const Universe = lazy(() => import("./Universe"));

const missions = [
  {
    id: "01",
    name: "Seu centro de gravidade.",
    tag: "PORTFÓLIO",
    text: "Uma presença que reúne quem você é, o que cria e para onde quer ir. Seu trabalho ganha uma casa; sua trajetória, um contexto.",
    detail: "Perfil · narrativa · identidade",
    label: "Encontre sua base",
    symbol: "◎",
  },
  {
    id: "02",
    name: "Projetos em trajetória.",
    tag: "PROJETOS",
    text: "Mais do que uma imagem bonita. Um espaço para revelar a ideia, as decisões e o processo por trás de cada entrega.",
    detail: "Estudos de caso · processo · resultado",
    label: "Lance suas ideias",
    symbol: "✳",
  },
  {
    id: "03",
    name: "Conexões que levam além.",
    tag: "DESCOBERTA",
    text: "Uma constelação de trabalhos e pessoas. Estamos desenhando caminhos para que boas ideias encontrem novos olhares.",
    detail: "Exploração · repertório · conexões",
    label: "Expanda seu alcance",
    symbol: "⌁",
  },
];

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

function SocialIcon({ platform }) {
  const paths = {
    linkedin: (
      <path d="M5 9v10M5 5v.01M10 19v-10h4v1.6c.7-1.1 1.6-1.8 3-1.8 2.5 0 3 1.7 3 4.2V19M2 2h20v20H2z" />
    ),
    instagram: (
      <>
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="18" cy="6" r=".7" fill="currentColor" stroke="none" />
      </>
    ),
    x: <path d="M3 3h4l14 18h-4L3 3Zm18 0L3 21" />,
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[platform]}
    </svg>
  );
}

function useScrollEffects() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );

    document
      .querySelectorAll(".reveal")
      .forEach((element) => observer.observe(element));

    function updateProgress() {
      const pageHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = pageHeight > 0 ? (window.scrollY / pageHeight) * 100 : 0;
      document.documentElement.style.setProperty("--progress", `${progress}%`);
    }

    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateProgress);
    };
  }, []);
}

function Header() {
  return (
    <header>
      <a className="brand" href="#inicio" aria-label="Órbita, início">
        <span className="logo">◎</span>órbita
        <span className="wordmark-caption">CREATIVE SPACE</span>
      </a>
      <nav aria-label="Principal">
        <a href="#origem">Nossa origem</a>
        <a href="#plataforma">A plataforma</a>
        <a className="nav-status" href="#lancamento">
          <span className="dot" /> Em breve <Arrow />
        </a>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero" id="inicio">
      <div className="hero-copy">
        <div className="eyebrow">
          <span className="dot" /> MISSÃO 001 — PREPARANDO O LANÇAMENTO
        </div>
        <h1>
          Grandes ideias
          <br />
          merecem
          <br />
          <em>entrar em órbita.</em>
        </h1>
        <p>
          Uma nova base para seus projetos, seu portfólio
          <br className="desktop" /> e tudo o que você ainda vai criar.
        </p>
        <a className="button" href="#origem">
          Explore a missão <Arrow />
        </a>
        <div className="hero-note">
          <span>✳</span>
          <p>
            Para quem cria.
            <br />
            <strong>Para o que vem depois.</strong>
          </p>
        </div>
      </div>
      <div className="orbital-label">
        <i />
        ÓRBITA / SISTEMA CRIATIVO
        <span>Ideias em movimento. Possibilidades em expansão.</span>
      </div>
      <div className="hero-bottom">
        <span>SEU TRABALHO TEM UM UNIVERSO À FRENTE</span>
        <a href="#origem">ROLE PARA EXPLORAR ↓</a>
        <span>BRASIL · PLANETA TERRA</span>
      </div>
    </section>
  );
}

function Origin() {
  return (
    <section className="origin" id="origem">
      <div className="origin-inner reveal">
        <span className="eyebrow">01 / O PRIMEIRO SINAL</span>
        <h2>
          Não faltam ideias.
          <br />
          Falta espaço para
          <br />
          <em>elas irem além.</em>
        </h2>
        <p>
          Um projeto perdido em uma pasta. Um portfólio que nunca sai do
          rascunho. Uma ideia boa demais para ficar só com você.
        </p>
        <p>
          A Órbita nasce dessa inquietação. Inspirada nas missões que conectam a
          Terra ao espaço, nossa missão é aproximar o que você cria de quem
          precisa descobrir.
        </p>
        <span className="annotation">
          NÃO LANÇAMOS FOGUETES. LANÇAMOS POSSIBILIDADES.
        </span>
      </div>
      <div className="orbit-coordinate">● TERRA → IDEIA → ÓRBITA</div>
    </section>
  );
}

function Manifesto() {
  return (
    <section className="manifesto">
      <div className="section-heading reveal">
        <span className="eyebrow">02 / NOSSA RAZÃO DE EXISTIR</span>
        <span className="small-mono">
          UM PONTO DE PARTIDA. INFINITAS TRAJETÓRIAS.
        </span>
      </div>
      <p className="manifesto-statement reveal">
        Cada pessoa é um universo.
        <br />
        Cada projeto, <em>um novo satélite.</em>
        <br />
        <span>Juntos, podemos ir mais longe.</span>
      </p>
      <div className="manifesto-bottom reveal">
        <span className="cross">✳</span>
        <p>
          Estamos construindo um lugar onde designers, desenvolvedores e mentes
          inquietas possam apresentar suas ideias com a profundidade que elas
          merecem.
        </p>
      </div>
    </section>
  );
}

function Platform() {
  const [selected, setSelected] = useState(0);
  const mission = missions[selected];

  return (
    <section className="platform" id="plataforma">
      <div className="section-heading reveal">
        <div>
          <span className="eyebrow">03 / A CONSTELAÇÃO</span>
          <h2>
            Tudo conectado.
            <br />
            <em>Tudo com a sua assinatura.</em>
          </h2>
        </div>
        <span className="outline-label">EM DESENVOLVIMENTO</span>
      </div>
      <div className="mission-layout reveal">
        <div className="mission-select" aria-label="Explore a plataforma">
          {missions.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
              className={selected === index ? "selected" : ""}
            >
              <span>{item.id}</span>
              <div>
                <small>{item.tag}</small>
                {item.label}
              </div>
              <Arrow />
            </button>
          ))}
        </div>
        <div className="mission-panel" aria-live="polite">
          <div className={`mission-art art-${selected}`} aria-hidden="true">
            <div className="art-orbit" />
            <div className="art-orbit second" />
            <div className="art-core">{mission.symbol}</div>
            <span className="art-node" />
            <small>ÓRBITA SYSTEM / {mission.id}</small>
          </div>
          <div className="mission-text">
            <span className="eyebrow">
              MÓDULO {mission.id} — {mission.tag}
            </span>
            <h3>{mission.name}</h3>
            <p>{mission.text}</p>
            <span className="small-mono">{mission.detail}</span>
          </div>
        </div>
      </div>
      <p className="concept-note">
        Uma visão do que estamos preparando. Recursos sujeitos à evolução até o
        lançamento.
      </p>
    </section>
  );
}

function Journey() {
  return (
    <section className="journey">
      <div className="section-heading reveal">
        <span className="eyebrow">04 / PLANO DE VOO</span>
        <h2>
          Do primeiro esboço
          <br />
          <em>ao próximo horizonte.</em>
        </h2>
      </div>
      <div className="timeline">
        <article className="reveal" tabIndex={0}>
          <span className="step">01</span>
          <small>ORIGEM</small>
          <h3>Uma inquietação.</h3>
          <p>
            Boas ideias precisam de mais do que uma vitrine. Precisam de
            contexto, identidade e direção.
          </p>
        </article>
        <article className="reveal current" tabIndex={0}>
          <span className="step">02</span>
          <small>
            <span className="dot" /> AGORA
          </small>
          <h3>Construindo a base.</h3>
          <p>
            Estamos dando forma à experiência: uma casa para portfólios e uma
            plataforma para novos projetos.
          </p>
        </article>
        <article className="reveal" tabIndex={0}>
          <span className="step">03</span>
          <small>PRÓXIMO CAPÍTULO</small>
          <h3>Entrar em órbita.</h3>
          <p>
            Abrir as portas para quem quer colocar seu trabalho no mundo. A
            data? Vamos anunciar por aqui.
          </p>
        </article>
      </div>
    </section>
  );
}

function Launch() {
  return (
    <section className="launch" id="lancamento">
      <div className="launch-orbits" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="reveal">
        <span className="eyebrow">
          <span className="dot" /> CONTAGEM REGRESSIVA PARA UM NOVO COMEÇO
        </span>
        <h2>
          Seu próximo capítulo
          <br />
          <em>não tem limites.</em>
        </h2>
        <p>
          A base está sendo preparada.
          <br />
          Em breve, seu universo vai ganhar um novo endereço.
        </p>
        <span className="launch-badge">
          <a>EM BREVE</a> <span>↗</span>
        </span>
        <p className="launch-footnote">
          Sem data artificial. Com espaço para grandes ideias.
        </p>
      </div>
    </section>
  );
}

function PrivacyDialog({ dialogRef }) {
  return (
    <dialog ref={dialogRef} aria-labelledby="privacy-title">
      <button
        className="close"
        type="button"
        aria-label="Fechar"
        onClick={() => dialogRef.current?.close()}
      >
        ×
      </button>
      <span className="eyebrow">TRANSPARÊNCIA</span>
      <h2 id="privacy-title">
        Uma visita.
        <br />
        <em>Poucos dados.</em>
      </h2>
      <p>
        Quando a medição está habilitada e a API disponível, esta página envia
        um identificador aleatório da visita e o domínio de origem. O backend de
        exemplo registra também horário, país e região aproximados.
      </p>
      <p>
        Não usamos cookies nem identificador permanente. O exemplo não grava IP
        no banco; a hospedagem pode ter registros técnicos próprios. Sem API
        configurada, nenhuma visita é registrada por esse backend.
      </p>
    </dialog>
  );
}

const socialUrls = {
        linkedin: "https://www.linkedin.com",
        instagram: "https://www.instagram.com",
        x: "https://x.com",
      };

function Footer({ onPrivacyClick }) {
  return (
    <footer>
      <a className="brand" href="#inicio">
        <span className="logo">◎</span>órbita
      </a>
      <span>
        Uma marca conceitual para um projeto acadêmico.
        <br />
        Sem vínculo com empresas do setor espacial.
      </span>
  
      <div className="social-links" aria-label="Redes sociais em breve">
        {["linkedin", "instagram", "x"].map((platform) => (
          <a
            key={platform}
            href={socialUrls[platform]}
            className="social-icon"
            role="img"
            aria-label={`${platform} em breve`}
            title={`${platform} em breve`}
          >
            <SocialIcon platform={platform} />
          </a>
        ))}
      </div>
      <button type="button" onClick={onPrivacyClick}>
        Sobre os dados <Arrow />
      </button>
      <a className="back-to-top" href="#inicio" aria-label="Voltar ao início">
        ↑
      </a>
    </footer>
  );
}

function App() {
  const [paused, setPaused] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [ready, setReady] = useState(false);
  const privacyDialog = useRef(null);
  useScrollEffects();

  return (
    <div className={ready ? "app scene-ready" : "app"}>
      <div className="scroll-progress" />
      <div className="fallback-space" aria-hidden="true">
        <div className="fallback-planet" />
        <div className="fallback-ring" />
      </div>
      <Suspense fallback={null}>
        <Universe paused={paused} onReady={setReady} />
      </Suspense>
      <a className="skip" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Header />
      <main id="conteudo">
        <Hero />
        <Origin />
        <Manifesto />
        <Platform />
        <Journey />
        <Launch />
      </main>
      <Footer onPrivacyClick={() => privacyDialog.current?.showModal()} />
      <button
        className="motion-toggle"
        type="button"
        onClick={() => setPaused((value) => !value)}
        aria-pressed={paused}
        aria-label={paused ? "Retomar animações" : "Pausar animações"}
      >
        {paused ? "▷" : "Ⅱ"}{" "}
        <span>{paused ? "Retomar movimento" : "Pausar movimento"}</span>
      </button>
      <PrivacyDialog dialogRef={privacyDialog} />
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
recordPageView();
