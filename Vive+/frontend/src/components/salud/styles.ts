// Estilos de la página Salud (extraídos de salud.tsx).
export const SALUD_STYLES = `
        .sn-hero{position:relative;height:100vh;min-height:640px;overflow:hidden;color:#fff;display:grid;place-items:center;isolation:isolate}
        .sn-hero__bg{position:absolute;inset:-8%;z-index:-2;will-change:transform;background-size:cover;background-position:center}
        .sn-hero__overlay{position:absolute;inset:0;z-index:-1;background:linear-gradient(180deg,rgba(29,78,216,.30) 0%,rgba(29,78,216,.10) 30%,rgba(147,51,234,.45) 78%,rgba(15,10,30,.88) 100%)}
        .sn-hero__inner{text-align:center;max-width:1100px;padding:0 24px;position:relative;z-index:1;will-change:transform,opacity}
        .sn-hero__title{font-family:'Fraunces',Georgia,serif;font-weight:500;font-size:clamp(72px,12vw,160px);line-height:.95;letter-spacing:-.03em;margin:28px 0 24px}
        .sn-word{display:inline-block;overflow:hidden;vertical-align:bottom;padding:0 .12em;margin:0 -.12em}
        .sn-word>span{display:inline-block;transform:translateY(110%);animation:snRise .9s cubic-bezier(.2,.7,.2,1) forwards;padding:0 .04em}
        .sn-word.delay>span{animation-delay:.18s}
        .sn-word.gold>span{color:#EC4899;font-style:italic}
        .sn-hero__sub{font-size:clamp(15px,1.4vw,19px);max-width:680px;margin:0 auto;font-weight:300;opacity:0;animation:snFade .9s ease .55s forwards}
        .sn-hero__scroll{position:absolute;bottom:36px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:10px;color:rgba(255,255,255,.85);font-size:11px;letter-spacing:.3em;font-weight:500;opacity:0;animation:snFade .9s ease .9s forwards}
        .sn-hero__bar{width:1px;height:46px;background:linear-gradient(to bottom,transparent,#EC4899,transparent);position:relative;overflow:hidden}
        .sn-hero__bar::after{content:'';position:absolute;left:-1px;top:-20px;width:3px;height:20px;background:#EC4899;border-radius:2px;animation:snScrollDot 2s ease-in-out infinite}
        .sn-eyebrow-hero{display:inline-flex;align-items:center;gap:8px;padding:8px 18px;border-radius:999px;background:rgba(255,255,255,.14);color:#fff;backdrop-filter:blur(8px);font-size:11px;font-weight:600;letter-spacing:.18em;text-transform:uppercase}
        .sn-eyebrow-hero::before{content:'';width:8px;height:8px;border-radius:50%;background:#EC4899;box-shadow:0 0 8px #EC4899;flex-shrink:0}
        @keyframes snRise{to{transform:translateY(0)}}
        @keyframes snFade{to{opacity:1}}
        @keyframes snScrollDot{0%{top:-20px;opacity:0}20%{opacity:1}80%{opacity:1}100%{top:46px;opacity:0}}
        @media(max-width:768px){.sn-hero__title{font-size:clamp(44px,10vw,72px)!important}.sn-hero{height:60vh;min-height:300px}.sn-hero__inner{padding:0 16px}}
        @media(max-width:480px){.sn-hero__title{font-size:clamp(34px,9vw,48px)!important}.sn-hero{height:55vh;min-height:260px}.sn-hero__inner{padding:0 12px}.sn-hero__sub{font-size:14px!important}.sn-eyebrow-hero{font-size:10px;padding:6px 14px}}


        .cu-badge { animation: cuFadeIn 0.7s cubic-bezier(0.22,1,0.36,1) both; }
        .cu-h1    { animation: cuSlide  0.9s 0.15s cubic-bezier(0.22,1,0.36,1) both; }
        .cu-sub   { animation: cuSlide  0.9s 0.3s  cubic-bezier(0.22,1,0.36,1) both; }
        .cu-chips { animation: cuSlide  0.9s 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes cuFadeIn { from { opacity:0; transform:scale(0.85) translateY(10px); } to { opacity:1; transform:none; } }
        @keyframes cuSlide  { from { opacity:0; transform:translateY(38px); } to { opacity:1; transform:none; } }

        .cu-pill {
          display:inline-flex; align-items:center; gap:6px;
          padding:9px 20px; border-radius:99px; font-size:13px;
          font-weight:600; cursor:pointer; border:1.5px solid transparent;
          transition:background-color 0.25s cubic-bezier(0.22,1,0.36,1),color 0.25s cubic-bezier(0.22,1,0.36,1),border-color 0.25s cubic-bezier(0.22,1,0.36,1),transform 0.25s cubic-bezier(0.22,1,0.36,1);
          font-family:'DM Sans',sans-serif;
        }

        .cu-card { transition: box-shadow 0.4s ease, z-index 0s; z-index: 1; }
        .cu-card:hover { box-shadow:0 28px 56px rgba(0,0,0,0.11) !important; z-index: 10; }
        .cu-photo { transition:transform 0.4s ease, box-shadow 0.4s ease; }
        .cu-card:hover .cu-photo { transform:scale(1.06); box-shadow:0 10px 28px rgba(0,0,0,0.18) !important; }

        .cu-chat-btn { transition:transform 0.25s cubic-bezier(0.22,1,0.36,1),box-shadow 0.25s cubic-bezier(0.22,1,0.36,1); }
        .cu-chat-btn:hover { transform:scale(1.02); }

        .cu-star { animation:starPop 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }
        .cu-star:nth-child(1){animation-delay:0.05s}
        .cu-star:nth-child(2){animation-delay:0.1s}
        .cu-star:nth-child(3){animation-delay:0.15s}
        .cu-star:nth-child(4){animation-delay:0.2s}
        .cu-star:nth-child(5){animation-delay:0.25s}
        @keyframes starPop { from{opacity:0;transform:scale(0)} to{opacity:1;transform:scale(1)} }

        .cu-chat-panel { animation:chatSlide 0.35s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes chatSlide { from{opacity:0;transform:translateY(-10px) scaleY(0.95)} to{opacity:1;transform:none} }

        .cu-chat-side { animation:chatSideIn 0.38s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes chatSideIn { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:none} }
        @keyframes chatBottomIn { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:none} }

        .cu-chat-side-panel {
          width: 100%;
          height: 460px;
          max-height: 460px;
          display: flex;
          flex-direction: column;
          background: #F5F0FF;
          box-shadow: 0 8px 40px rgba(0,0,0,0.13);
          border-radius: 16px;
          margin-top: 28px;
          overflow: hidden;
          animation: chatSlide 0.35s cubic-bezier(0.22,1,0.36,1) both;
        }
        @media (min-width: 768px) {
          .cu-chat-side-panel {
            position: sticky;
            top: 80px;
            width: 380px;
            height: 520px;
            max-height: 520px;
            flex-shrink: 0;
            align-self: flex-start;
            margin-top: 0;
            animation: chatSideIn 0.38s cubic-bezier(0.22,1,0.36,1) both;
          }
        }
        .cu-cards-chat-wrapper { display: block; }
        @media (min-width: 768px) {
          .cu-cards-chat-wrapper { display: flex; gap: 28px; align-items: flex-start; }
        }
        .cu-chat-msgs {
          flex: 1;
          min-height: 0;
          overflow-x: hidden;
          scrollbar-width: none;
          overflow-y: auto;
          padding: 16px 14px;
          background: #F5F0FF;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .cu-msg-search input:focus { outline:none; }

        @keyframes availPulse {
          0%,100% { box-shadow:0 0 0 0 rgba(76,175,80,0.5); }
          50%      { box-shadow:0 0 0 6px rgba(76,175,80,0); }
        }
        .avail-dot { animation:availPulse 2s infinite; }

        .cu-scroll { animation:cuBounce 2s infinite; }
        @keyframes cuBounce { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(8px)} }

        .cu-wave svg { display:block; }
        .cu-tag { transition:transform 0.25s ease; }
        .cu-tag:hover { transform:scale(1.08); }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── MOBILE ── */
        @media (max-width: 768px) {
          .cu-chips { gap: 8px !important; }
          .cu-pill  { padding: 7px 14px !important; font-size: 12px !important; }
        }
        @media (max-width: 480px) {
          .salud-hero-h1 { font-size: 2.2rem !important; }
          .cu-card-grid { grid-template-columns: 1fr !important; }
          .cu-card { margin-bottom: 24px !important; }
        }
        .salud-input-bare { flex: 1; border: none; font-size: 13px; font-family: 'DM Sans', sans-serif; color: var(--slate); background: transparent; }
        .salud-input-bare:focus-visible { outline: 2px solid var(--teal,#EC4899); outline-offset: 2px; border-radius: 4px; }
        .salud-msg-input { flex: 1; border: 1.5px solid #C4B5FD; border-radius: 10px; padding: 9px 13px; font-size: 13px; font-family: 'DM Sans', sans-serif; background: white; }
        .salud-msg-input:focus-visible { outline: 2px solid var(--teal,#EC4899); outline-offset: 2px; }
        .salud-textarea { width: 100%; padding: 11px 14px; border-radius: 12px; border: 1.5px solid var(--sand); font-family: 'DM Sans', sans-serif; font-size: 14px; resize: none; box-sizing: border-box; }
        .salud-textarea:focus-visible { outline: 2px solid var(--teal,#EC4899); outline-offset: 2px; }
        dialog::backdrop { background: rgba(0,0,0,0.45); }
        .salud-valorar-dialog { background: white; border: none; border-radius: 22px; padding: 36px; max-width: 480px; width: 100%; box-shadow: 0 24px 64px rgba(0,0,0,0.18); position: fixed; top: 50%; left: 50%; margin: 0; transform: translate(-50%, -50%); }
      `;
