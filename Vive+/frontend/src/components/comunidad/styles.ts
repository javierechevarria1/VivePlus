// Estilos de la página Comunidad (extraídos de comunidad.tsx).
export const COMUNIDAD_STYLES = `
        .chat-wrap          { display:grid; grid-template-columns:320px 1fr; height:100vh; background:#FAF8FF; font-family:'DM Sans',sans-serif; }
        .chat-sidebar       { background:white; border-right:1px solid #EDE9FE; display:flex; flex-direction:column; overflow:hidden; }
        .chat-main          { display:flex; flex-direction:column; overflow:hidden; position:relative; }

        .chat-sidebar-header { padding:20px; border-bottom:1px solid #EDE9FE; }
        .chat-sidebar-title  { font-family:'Cormorant Garamond',serif; font-size:22px; font-weight:600; color:#0F172A; margin-bottom:4px; }
        .chat-sidebar-sub    { font-size:12px; color:#64748B; display:flex; align-items:center; gap:6px; }
        .online-pulse        { width:7px; height:7px; border-radius:50%; background:#00C87A; animation:blink 2s infinite; flex-shrink:0; }
        @keyframes blink     { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin      { to { transform:rotate(360deg); } }

        .map-section   { background:white; border-radius:16px; margin:16px; overflow:hidden; border:1px solid #EDE9FE; flex-shrink:0; }
        .map-title     { padding:10px 14px; font-size:11px; font-weight:700; color:#64748B; letter-spacing:.08em; text-transform:uppercase; border-bottom:1px solid #EDE9FE; display:flex; align-items:center; gap:6px; }
        .map-body      { position:relative; height:130px; background:#FDF2F8; overflow:hidden; }
        .map-grid-bg   { position:absolute; inset:0; background-image:linear-gradient(#FBCFE8 1px,transparent 1px),linear-gradient(90deg,#FBCFE8 1px,transparent 1px); background-size:20px 20px; opacity:.5; }
        .map-me        { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:14px; height:14px; border-radius:50%; background:var(--teal,#EC4899); box-shadow:0 0 0 6px rgba(236,72,153,.20); z-index:3; }
        .map-person    { position:absolute; transform:translate(-50%,-50%); z-index:2; }
        .map-person-dot{ width:10px; height:10px; border-radius:50%; border:2px solid white; box-shadow:0 1px 4px rgba(0,0,0,.15); }
        .map-radar     { position:absolute; top:50%; left:50%; border-radius:50%; border:1px solid rgba(236,72,153,.28); transform:translate(-50%,-50%); pointer-events:none; }

        .range-wrap        { padding:12px 20px; border-bottom:1px solid #EDE9FE; }
        .range-label       { font-size:12px; color:#64748B; margin-bottom:6px; display:flex; justify-content:space-between; }
        .range-label span  { color:var(--teal); font-weight:600; }
        input[type=range]  { width:100%; accent-color:var(--teal); }
        .chat-search       { padding:10px 20px; border-bottom:1px solid #EDE9FE; position:relative; }
        .chat-search input { width:100%; background:#FAF8FF; border:1px solid #EDE9FE; border-radius:10px; padding:9px 14px 9px 36px; font-size:13px; color:#0F172A; font-family:'DM Sans',sans-serif; outline:none; transition:border-color .2s; box-sizing:border-box; }
        .chat-search input:focus { border-color:var(--teal); }
        .chat-search-icon  { position:absolute; left:32px; top:50%; transform:translateY(-50%); color:#94A3B8; pointer-events:none; }

        .people-list  { flex:1; overflow-y:auto; padding:8px; }
        .people-list::-webkit-scrollbar       { width:3px; }
        .people-list::-webkit-scrollbar-thumb { background:#EDE9FE; border-radius:99px; }

        .person-item  { display:flex; align-items:center; gap:12px; padding:11px 12px; border-radius:14px; cursor:pointer; transition:background-color .15s, border-color .15s; margin-bottom:3px; border:1px solid transparent; }
        .person-item:hover  { background:#FAF8FF; }
        .person-item.active { background:#FDF2F8; border-color:rgba(236,72,153,.20); }
        .p-avatar-wrap { position:relative; flex-shrink:0; }
        .p-avatar      { width:46px; height:46px; border-radius:50%; object-fit:cover; border:2px solid #EDE9FE; }
        .p-avatar.sel  { border-color:var(--teal); }
        .p-status-dot  { position:absolute; bottom:1px; right:1px; width:11px; height:11px; border-radius:50%; border:2px solid white; }
        .p-info        { flex:1; min-width:0; }
        .p-name        { font-size:14px; font-weight:600; color:#0F172A; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .p-meta        { display:flex; align-items:center; gap:6px; margin-top:3px; }
        .p-dist        { font-size:11px; color:var(--teal); background:#FDF2F8; padding:1px 7px; border-radius:99px; font-weight:600; flex-shrink:0; display:flex; align-items:center; gap:3px; }
        .p-unread      { background:var(--teal); color:white; font-size:10px; font-weight:700; min-width:18px; height:18px; border-radius:99px; display:flex; align-items:center; justify-content:center; padding:0 4px; flex-shrink:0; }
        .no-results    { text-align:center; padding:40px 20px; color:#64748B; font-size:14px; }
        .loc-error     { color:#E74C3C; font-size:13px; display:flex; flex-direction:column; align-items:center; gap:14px; padding:24px 16px; text-align:center; line-height:1.5; }
        .loc-error-retry { padding:13px 24px; border-radius:10px; background:var(--teal); color:white; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:600; min-width:180px; min-height:44px; }

        .chat-empty    { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; color:#64748B; padding:40px; text-align:center; }
        .chat-empty h3 { font-family:'Cormorant Garamond',serif; font-size:26px; color:#0F172A; margin:0; }
        .chat-empty p  { font-size:14px; line-height:1.7; max-width:320px; margin:0; }

        .chat-header         { background:white; border-bottom:1px solid #EDE9FE; padding:14px 24px; display:flex; align-items:center; gap:14px; }
        .chat-header-avatar  { width:44px; height:44px; border-radius:50%; object-fit:cover; border:2px solid var(--teal); cursor:pointer; flex-shrink:0; }
        .chat-header-info    { flex:1; min-width:0; }
        .chat-header-name    { display:block; width:100%; background:none; border:none; padding:0; font-family:inherit; text-align:left; font-size:16px; font-weight:600; color:#0F172A; cursor:pointer; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .chat-header-name:hover { color:var(--teal); }
        .chat-header-status  { font-size:12px; display:flex; align-items:center; gap:5px; margin-top:2px; flex-wrap:wrap; }
        .chat-header-actions { display:flex; gap:8px; flex-shrink:0; }
        .icon-btn            { width:36px; height:36px; border-radius:10px; border:1px solid #EDE9FE; background:white; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:background-color .15s, color .15s; color:#64748B; flex-shrink:0; }
        .icon-btn:hover      { background:#FDF2F8; border-color:var(--teal); color:var(--teal); }
        .icon-btn.active     { background:#FDF2F8; border-color:var(--teal); color:var(--teal); }
        .back-btn            { display:none; }

        .search-bar    { display:flex; align-items:center; gap:8px; padding:10px 20px; border-bottom:1px solid #EDE9FE; background:#FAF8FF; flex-shrink:0; animation:slideDown .2s ease; }
        @keyframes slideDown { from{opacity:0; transform:translateY(-8px);} to{opacity:1; transform:translateY(0);} }
        .search-input  { flex:1; padding:8px 14px; background:white; border:1.5px solid #EDE9FE; border-radius:99px; font-size:13.5px; font-family:'DM Sans',sans-serif; color:#0F172A; outline:none; transition:all .2s ease; }
        .search-input::placeholder { color:#94A3B8; }
        .search-input:focus { border-color:var(--teal); box-shadow:0 0 0 3px rgba(236,72,153,.10); }
        .search-close  { display:flex; align-items:center; justify-content:center; width:30px; height:30px; border:none; background:transparent; color:#64748B; cursor:pointer; border-radius:50%; font-size:18px; transition:all .15s; flex-shrink:0; }
        .search-close:hover { background:#EDE9FE; color:#0F172A; }
        .search-count  { font-size:12px; color:#94A3B8; white-space:nowrap; font-weight:500; }
        .highlight     { background:#FFF176; border-radius:3px; padding:0 2px; color:#0F172A; }

        .messages-area { flex:1; overflow-y:auto; padding:24px; display:flex; flex-direction:column; gap:12px; background:#FAF8FF; }
        .messages-area::-webkit-scrollbar       { width:3px; }
        .messages-area::-webkit-scrollbar-thumb { background:#EDE9FE; border-radius:99px; }
        .msg-group     { display:flex; flex-direction:column; gap:4px; }
        .msg-group.me  { align-items:flex-end; }
        .msg-group.other { align-items:flex-start; }
        .msg-bubble    { max-width:68%; padding:10px 16px; border-radius:18px; font-size:14px; line-height:1.6; }
        .msg-bubble.me    { background:var(--teal,#EC4899); color:white; border-bottom-right-radius:4px; }
        .msg-bubble.other { background:white; color:#0F172A; border-bottom-left-radius:4px; box-shadow:0 1px 4px rgba(0,0,0,.06); }
        .msg-time      { font-size:10px; color:#64748B; margin-top:2px; padding:0 4px; }
        .date-divider  { text-align:center; font-size:11px; color:#64748B; background:#EDE9FE; padding:3px 12px; border-radius:99px; align-self:center; margin:8px 0; }

        .chat-input-area  { background:white; border-top:1px solid #EDE9FE; padding:12px 20px; }
        .quick-replies    { display:flex; gap:8px; overflow-x:auto; padding-bottom:10px; }
        .quick-replies::-webkit-scrollbar { display:none; }
        .quick-reply      { background:#FAF8FF; border:1px solid #EDE9FE; border-radius:99px; padding:5px 14px; font-size:12px; color:#0F172A; cursor:pointer; white-space:nowrap; transition:background-color .15s, color .15s, border-color .15s; font-family:'DM Sans',sans-serif; }
        .quick-reply:hover { background:#FDF2F8; border-color:var(--teal); color:var(--teal); }
        .input-row        { display:flex; gap:10px; align-items:center; }
        .msg-input        { flex:1; background:#FAF8FF; border:1px solid #EDE9FE; border-radius:12px; padding:11px 16px; font-size:14px; color:#0F172A; font-family:'DM Sans',sans-serif; outline:none; transition:border-color .2s; }
        .msg-input:focus  { border-color:var(--teal); }
        .send-btn         { width:44px; height:44px; border-radius:12px; background:var(--teal,#EC4899); border:none; color:white; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:background-color .2s, opacity .2s; flex-shrink:0; }
        .send-btn:hover   { background:#9333EA; transform:scale(1.05); }
        .send-btn:disabled{ background:#EDE9FE; color:#64748B; transform:none; cursor:not-allowed; }
        .mic-btn          { width:44px; height:44px; border-radius:12px; border:1px solid #EDE9FE; background:white; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:background-color .2s, color .2s, border-color .2s; color:#64748B; flex-shrink:0; }
        .mic-btn:hover    { border-color:var(--teal); color:var(--teal); background:#FDF2F8; }
        .mic-btn:disabled { opacity:0.5; cursor:not-allowed; }
        .rec-indicator    { display:flex; align-items:center; gap:8px; flex:1; background:white; border:1px solid rgba(231,76,60,0.3); border-radius:12px; padding:0 16px; height:44px; }
        .rec-dot          { width:10px; height:10px; border-radius:50%; background:#E74C3C; flex-shrink:0; animation:recPulse 1s infinite; }
        @keyframes recPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

        .profile-panel  { position:absolute; top:0; right:0; width:280px; height:100%; background:white; border-left:1px solid #EDE9FE; display:flex; flex-direction:column; z-index:10; animation:slideIn .25s ease; overflow-y:auto; }
        @keyframes slideIn { from{transform:translateX(100%);opacity:0} to{transform:none;opacity:1} }
        .profile-cover  { height:140px; background:linear-gradient(135deg,var(--teal,#EC4899) 0%,#9333EA 100%); position:relative; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
        .profile-avatar { width:80px; height:80px; border-radius:50%; object-fit:cover; border:4px solid rgba(255,255,255,.3); }
        .profile-body   { padding:16px 20px 20px; text-align:center; }
        .profile-name   { font-family:'Cormorant Garamond',serif; font-size:22px; font-weight:600; color:#0F172A; }
        .profile-age    { font-size:13px; color:#64748B; margin-top:2px; }
        .profile-close  { position:absolute; top:12px; right:12px; width:28px; height:28px; border-radius:50%; background:rgba(255,255,255,.2); border:none; color:white; cursor:pointer; display:flex; align-items:center; justify-content:center; }

        @media (max-width: 768px) {
          .chat-wrap    { grid-template-columns:1fr; height:100dvh; }
          .chat-sidebar { position:fixed; inset:0; top:0; z-index:35; width:100%; border-right:none; }
          .chat-sidebar.hide { display:none; }
          .chat-main.hide    { display:none; }
          .back-btn          { display:flex !important; }
          .profile-panel     { width:100%; }
          .chat-header       { padding:12px 16px; gap:10px; }
          .messages-area     { padding:16px; }
          .chat-input-area   { padding:10px 16px; }
          .map-section       { margin:10px; }
        }
        @media (max-width: 480px) {
          .c-layout { padding: 0 !important; }
          .c-container { height: calc(100vh - 68px) !important; border-radius: 0 !important; border: none !important; }
        }
      `;
