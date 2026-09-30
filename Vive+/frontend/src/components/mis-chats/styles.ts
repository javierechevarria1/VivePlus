// Estilos de la página Mis Chats (extraídos de mis-chats.tsx).
export const MIS_CHATS_STYLES = `
        

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --sage: #EC4899;
          --sage-dark: #9333EA;
          --sage-light: #FDF2F8;
          --sage-pale: #FDF2F8;
          --cream: #FFFFFF;
          --cream-mid: #F5F0FF;
          --cream-border: #EDE9FE;
          --ink: #0F172A;
          --ink-mid: #334155;
          --ink-light: #64748B;
          --ink-faint: #94A3B8;
          --white: #FFFFFF;
          --gold: #9333EA;
          --shadow-sm: 0 1px 4px rgba(236,72,153,.06), 0 2px 12px rgba(236,72,153,.04);
          --shadow-md: 0 4px 20px rgba(236,72,153,.10), 0 1px 6px rgba(236,72,153,.06);
          --shadow-float: 0 8px 40px rgba(147,51,234,.14), 0 2px 8px rgba(147,51,234,.06);
          --radius: 20px;
          --radius-sm: 12px;
          --radius-xs: 8px;
        }

        html, body {
          height: 100%;
          overflow: hidden;
          background: var(--cream);
          font-family: 'DM Sans', sans-serif;
          color: var(--ink);
          -webkit-font-smoothing: antialiased;
        }

        /* ── Scrollbar ── */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--cream-border); border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--ink-faint); }

        /* ── Page Shell ── */
        .page {
          height: 100vh;
          display: grid;
          grid-template-rows: auto 1fr;
          max-width: 1380px;
          margin: 0 auto;
          padding: 20px 24px 16px;
          gap: 16px;
        }

        /* ── Top Bar ── */
        .top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .top-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: var(--white);
          border: 1.5px solid var(--cream-border);
          border-radius: 99px;
          font-size: 13px;
          font-weight: 500;
          color: var(--ink-light);
          cursor: pointer;
          text-decoration: none;
          transition: all .2s ease;
          letter-spacing: .01em;
          box-shadow: var(--shadow-sm);
        }
        .back-btn:hover {
          border-color: var(--sage);
          color: var(--sage);
          box-shadow: 0 2px 12px rgba(236,72,153,.12);
          transform: translateY(-1px);
        }
        .back-btn svg { transition: transform .2s ease; }
        .back-btn:hover svg { transform: translateX(-2px); }

        .title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 26px;
          font-weight: 600;
          color: var(--sage-dark);
          letter-spacing: -.02em;
          line-height: 1;
        }
        .title-dot { color: var(--gold); }

        .doctor-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px 6px 8px;
          background: var(--white);
          border: 1.5px solid var(--cream-border);
          border-radius: 99px;
          font-size: 13px;
          font-weight: 500;
          color: var(--ink-mid);
          box-shadow: var(--shadow-sm);
        }
        .doctor-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #4CAF81;
          box-shadow: 0 0 0 3px rgba(76,175,129,.2);
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(76,175,129,.2); }
          50% { box-shadow: 0 0 0 5px rgba(76,175,129,.1); }
        }

        /* ── Layout ── */
        .layout {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 16px;
          min-height: 0;
        }

        /* ── Sidebar ── */
        .sidebar {
          display: flex;
          flex-direction: column;
          min-height: 0;
          gap: 10px;
        }

        .sidebar-header {
          padding: 0 4px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: var(--ink-faint);
        }

        .conv-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding-right: 2px;
        }

        .conv-empty {
          text-align: center;
          padding: 32px 16px;
          color: var(--ink-faint);
          font-size: 13px;
          line-height: 1.6;
        }

        .conv-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          background: var(--white);
          border: 1.5px solid transparent;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all .2s ease;
          box-shadow: var(--shadow-sm);
        }
        .conv-item:hover {
          border-color: var(--cream-border);
          transform: translateX(2px);
          box-shadow: var(--shadow-md);
        }
        .conv-item.active {
          border-color: var(--sage);
          background: var(--sage-pale);
          box-shadow: 0 0 0 3px rgba(236,72,153,.08), var(--shadow-md);
        }

        .conv-avatar {
          width: 42px; height: 42px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          flex-shrink: 0;
          letter-spacing: -.02em;
        }

        .conv-info { flex: 1; min-width: 0; }
        .conv-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--ink);
          margin-bottom: 3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .conv-item.active .conv-name { color: var(--sage-dark); }

        .conv-last {
          font-size: 12px;
          color: var(--ink-faint);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .conv-date {
          font-size: 12px;
          color: var(--ink-faint);
          white-space: nowrap;
          flex-shrink: 0;
          font-weight: 500;
        }
        .conv-item.active .conv-date { color: var(--sage); }

        .conv-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
          flex-shrink: 0;
        }

        .unread-badge {
          min-width: 18px;
          height: 18px;
          background: var(--sage);
          color: white;
          border-radius: 99px;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 5px;
        }

        .loading-shimmer {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .shimmer-item {
          height: 66px;
          border-radius: var(--radius-sm);
          background: linear-gradient(90deg, var(--cream-mid) 25%, var(--cream) 50%, var(--cream-mid) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* ── Chat Area ── */
        .chat-area {
          display: flex;
          flex-direction: column;
          min-height: 0;
          background: var(--white);
          border-radius: var(--radius);
          border: 1.5px solid var(--cream-border);
          box-shadow: var(--shadow-float);
          overflow: hidden;
        }

        /* Chat empty state */
        .chat-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 40px;
        }
        .chat-empty-icon {
          width: 72px; height: 72px;
          background: var(--sage-light);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
        }
        .chat-empty h3 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px;
          font-weight: 600;
          color: var(--ink-mid);
          text-align: center;
        }
        .chat-empty p {
          font-size: 13px;
          color: var(--ink-faint);
          text-align: center;
          max-width: 240px;
          line-height: 1.6;
        }

        /* Chat Header */
        .chat-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 22px;
          border-bottom: 1.5px solid var(--cream-border);
          flex-shrink: 0;
          background: var(--white);
        }
        .chat-header-avatar {
          width: 38px; height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .chat-header-info { flex: 1; }
        .chat-header-name {
          font-size: 15px;
          font-weight: 600;
          color: var(--ink);
          line-height: 1.2;
        }
        .chat-header-status {
          font-size: 12px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 1px;
        }
        .status-dot-sm {
          width: 6px; height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* Messages */
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px 22px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-height: 0;
        }

        .day-label {
          text-align: center;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: .06em;
          text-transform: uppercase;
          color: var(--ink-faint);
          padding: 12px 0 6px;
        }

        .msg-row {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          animation: msgIn .25s ease;
        }
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .msg-row.care { justify-content: flex-end; }
        .msg-row.user { justify-content: flex-start; }

        .msg-avatar-sm {
          width: 26px; height: 26px;
          border-radius: 50%;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-bottom: 2px;
        }

        .msg {
          max-width: 68%;
          padding: 11px 16px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.55;
          position: relative;
        }
        .msg.care {
          background: linear-gradient(135deg, var(--sage) 0%, var(--sage-dark) 100%);
          color: white;
          border-bottom-right-radius: 5px;
          box-shadow: 0 2px 12px rgba(236,72,153,.22);
        }
        .msg.user {
          background: var(--cream-mid);
          color: var(--ink);
          border-bottom-left-radius: 5px;
        }
        .msg-time {
          font-size: 10.5px;
          opacity: .65;
          margin-top: 6px;
          text-align: right;
          letter-spacing: .02em;
          font-weight: 500;
        }
        .msg.user .msg-time { opacity: .5; text-align: left; }

        /* ── Search bar en chat ── */
        .search-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-bottom: 1.5px solid var(--cream-border);
          background: var(--cream);
          flex-shrink: 0;
          animation: slideDown .2s ease;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .search-input {
          flex: 1;
          padding: 8px 14px;
          background: var(--white);
          border: 1.5px solid var(--cream-border);
          border-radius: 99px;
          font-size: 13.5px;
          font-family: 'DM Sans', sans-serif;
          color: var(--ink);
          outline: none;
          transition: all .2s ease;
        }
        .search-input::placeholder { color: var(--ink-faint); }
        .search-input:focus {
          border-color: var(--sage);
          box-shadow: 0 0 0 3px rgba(236,72,153,.10);
        }
        .search-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px; height: 30px;
          border: none;
          background: transparent;
          color: var(--ink-light);
          cursor: pointer;
          border-radius: 50%;
          font-size: 18px;
          transition: all .15s;
          flex-shrink: 0;
        }
        .search-close:hover { background: var(--cream-mid); color: var(--ink); }
        .search-count {
          font-size: 12px;
          color: var(--ink-faint);
          white-space: nowrap;
          font-weight: 500;
        }
        .search-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px; height: 34px;
          border: 1.5px solid var(--cream-border);
          background: var(--white);
          border-radius: 50%;
          cursor: pointer;
          color: var(--ink-light);
          transition: all .2s;
          flex-shrink: 0;
        }
        .search-btn:hover { border-color: var(--sage); color: var(--sage); }
        .search-btn.active { background: var(--sage-light); border-color: var(--sage); color: var(--sage); }
        .highlight {
          background: #FFF176;
          border-radius: 3px;
          padding: 0 2px;
          color: var(--ink);
        }

        /* Chat Form */
        .chat-form {
          padding: 14px 18px;
          border-top: 1.5px solid var(--cream-border);
          display: flex;
          gap: 10px;
          align-items: center;
          flex-shrink: 0;
          background: var(--cream);
        }

        .input-wrap {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
        }

        .chat-input {
          width: 100%;
          padding: 12px 18px;
          background: var(--white);
          border: 1.5px solid var(--cream-border);
          border-radius: 99px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: var(--ink);
          outline: none;
          transition: all .2s ease;
          box-shadow: var(--shadow-sm);
        }
        .chat-input::placeholder { color: var(--ink-faint); }
        .chat-input:focus {
          border-color: var(--sage);
          box-shadow: 0 0 0 3px rgba(236,72,153,.10), var(--shadow-sm);
        }

        .send-btn {
          width: 46px; height: 46px;
          background: linear-gradient(135deg, var(--sage) 0%, var(--sage-dark) 100%);
          color: white;
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all .2s ease;
          flex-shrink: 0;
          box-shadow: 0 4px 16px rgba(236,72,153,.28);
        }
        .send-btn:hover:not(:disabled) {
          transform: scale(1.06) translateY(-1px);
          box-shadow: 0 6px 20px rgba(236,72,153,.35);
        }
        .send-btn:active:not(:disabled) { transform: scale(.96); }
        .send-btn:disabled {
          background: var(--cream-border);
          box-shadow: none;
          cursor: not-allowed;
        }

        .mic-btn {
          width: 46px; height: 46px;
          background: var(--cream-mid);
          color: var(--ink-light);
          border: 1.5px solid var(--cream-border);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all .2s ease;
          flex-shrink: 0;
        }
        .mic-btn:hover:not(:disabled) { border-color: var(--sage); color: var(--sage); }
        .mic-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .rec-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 18px;
          background: var(--white);
          border: 1.5px solid rgba(231,76,60,0.3);
          border-radius: 99px;
          font-size: 14px;
          color: #E74C3C;
          font-weight: 500;
          width: 100%;
        }
        .rec-dot {
          width: 10px; height: 10px;
          border-radius: 50%;
          background: #E74C3C;
          flex-shrink: 0;
          animation: recPulse 1s infinite;
        }
        @keyframes recPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .discard-btn {
          width: 32px; height: 32px;
          border: 1.5px solid var(--cream-border);
          background: var(--white);
          border-radius: 50%;
          cursor: pointer;
          color: var(--ink-light);
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all .15s;
        }
        .discard-btn:hover { border-color: #E74C3C; color: #E74C3C; }

        /* ── Responsive ── */
        @media (max-width: 680px) {
          html, body { overflow: auto; }
          .page { height: auto; padding: 14px 12px; }
          .layout { grid-template-columns: 1fr; }
          .conv-list { max-height: 200px; }
          .chat-area { height: 60vh; }
          .title { font-size: 20px; }
        }
`;
