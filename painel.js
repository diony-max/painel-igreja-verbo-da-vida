/* =========================================================
   TELÃO - Escuta chamadas
========================================================= */
const STORAGE = {
  codigo: 'igreja_codigo',
  nome: 'igreja_nome',
  historico: 'igreja_historico',
  broadcast: 'igreja_broadcast'
};

let ultimaChamada = null;
let canalLocal = null;
let eventSource = null;
let ultimaTsVisto = 0;

function getCodigo() {
  return localStorage.getItem(STORAGE.codigo) || 'igreja-default';
}

function getNome() {
  return localStorage.getItem(STORAGE.nome) || 'Igreja';
}

function getTopic() {
  return getCodigo().replace(/[^a-z0-9-_]/gi, '').toLowerCase() || 'igreja-default';
}

/* =========================================================
   RENDER
========================================================= */
function renderChamada(c) {
  ultimaChamada = c;

  document.getElementById('painel-idle').style.display = 'none';
  const chDiv = document.getElementById('painel-chamada');
  chDiv.style.display = 'block';
  chDiv.style.setProperty('--chamada-cor', c.cor);

  document.getElementById('chamada-topo').textContent = c.nome.toUpperCase();
  document.getElementById('chamada-topo').style.color = c.cor;
  document.getElementById('chamada-emoji').textContent = c.emoji;
  document.getElementById('chamada-numero').textContent = c.numero;
  document.getElementById('chamada-numero').style.textShadow =
    `0 0 60px ${c.cor}, 0 0 120px ${c.cor}`;
  document.getElementById('chamada-frase').textContent = c.mensagem;
  document.getElementById('chamada-frase').style.borderColor = c.cor;

  chDiv.style.animation = 'none';
  void chDiv.offsetWidth;
  chDiv.style.animation = 'chamadaEntrada 0.6s ease';

  tocarAlerta();
  renderRodape();
}

function limparTela() {
  document.getElementById('painel-chamada').style.display = 'none';
  document.getElementById('painel-idle').style.display = 'block';
  ultimaChamada = null;
}

function renderRodape() {
  const lista = document.getElementById('painel-historico');
  if (!lista) return;
  let h = [];
  try { h = JSON.parse(localStorage.getItem(STORAGE.historico)) || []; } catch {}

  if (h.length === 0) {
    lista.innerHTML = '<span class="rodape-vazio">—</span>';
    return;
  }

  lista.innerHTML = h.slice(0, 8).map(c => `
    <div class="rodape-item" style="--cor: ${c.cor}">
      <span class="rodape-item-emoji">${c.emoji}</span>
      <span class="rodape-item-numero">${c.numero}</span>
    </div>
  `).join('');
}

/* =========================================================
   SOM DE ALERTA
========================================================= */
function tocarAlerta() {
  try {
    const notas = [523.25, 659.25, 783.99];

    function tocarSequencia() {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      notas.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(ctx.destination);
        const t = ctx.currentTime + i * 0.18;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
        osc.start(t);
        osc.stop(t + 0.55);
      });
    }

    tocarSequencia();
    setTimeout(tocarSequencia, 900);
  } catch (e) {
    console.warn('Erro ao tocar som:', e);
  }
}

/* =========================================================
   RELÓGIO
========================================================= */
function atualizarRelogio() {
  const a = new Date();
  const el = document.getElementById('painel-relogio');
  if (el) {
    el.textContent = a.toLocaleTimeString('pt-BR', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  }
}
setInterval(atualizarRelogio, 1000);
atualizarRelogio();

/* =========================================================
   PROCESSAR MENSAGEM
========================================================= */
function processarMensagem(msg) {
  if (!msg) return;
  if (msg.tipo === 'chamada') {
    renderChamada(msg);
    setTimeout(renderRodape, 100);
  } else if (msg.tipo === 'limpar') {
    limparTela();
  }
}

/* =========================================================
   ESCUTA 1 - localStorage events
========================================================= */
window.addEventListener('storage', (e) => {
  if (e.key !== STORAGE.broadcast || !e.newValue) return;
  try {
    const msg = JSON.parse(e.newValue);
    processarMensagem(msg);
  } catch {}
});

/* =========================================================
   ESCUTA 2 - Polling fallback
========================================================= */
setInterval(() => {
  try {
    const raw = localStorage.getItem(STORAGE.broadcast);
    if (!raw) return;
    const msg = JSON.parse(raw);
    if (!msg._ts || msg._ts === ultimaTsVisto) return;
    ultimaTsVisto = msg._ts;
    processarMensagem(msg);
  } catch {}
}, 500);

/* =========================================================
   ESCUTA 3 - BroadcastChannel
========================================================= */
try {
  canalLocal = new BroadcastChannel('igreja_' + getTopic());
  canalLocal.onmessage = (e) => {
    const msg = e.data;
    if (!msg) return;
    if (msg._ts && msg._ts === ultimaTsVisto) return;
    processarMensagem(msg);
  };
} catch (e) {}

/* =========================================================
   ESCUTA 4 - ntfy.sh
========================================================= */
function conectarNtfy() {
  const topic = getTopic();
  try {
    if (eventSource) eventSource.close();
    eventSource = new EventSource('https://ntfy.sh/' + topic + '/sse');

    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.event !== 'message') return;
        let payload;
        try { payload = JSON.parse(data.message); } catch { return; }
        processarMensagem(payload);
      } catch {}
    };

    eventSource.onerror = () => {
      if (eventSource) eventSource.close();
      setTimeout(conectarNtfy, 5000);
    };
  } catch (e) {}
}

/* =========================================================
   INICIALIZAÇÃO
========================================================= */
const nomeEl = document.getElementById('painel-nome');
if (nomeEl) nomeEl.textContent = getNome();

renderRodape();
conectarNtfy();