// =============== PAINEL IGREJA - COMPLETO ===============
console.log('✅ script.js carregou!');

const MODULOS = {
  infantil: {
    nome: 'Departamento Infantil',
    emoji: '🧒',
    mensagem: 'COMPARECER AO DEPARTAMENTO INFANTIL',
    cor: '#10b981'
  },
  estacionamento: {
    nome: 'Estacionamento',
    emoji: '🚗',
    mensagem: 'COMPARECER AO ESTACIONAMENTO',
    cor: '#f59e0b'
  },
  reuniao: {
    nome: 'Reunião',
    emoji: '📢',
    mensagem: 'COMPARECER À SALA DE REUNIÃO',
    cor: '#8b5cf6'
  }
};

let moduloAtual = null;
let timerLimparHistorico = null;

/* =========================================================
   HELPERS
========================================================= */
function getHistorico() {
  try { return JSON.parse(localStorage.getItem('igreja_historico')) || []; }
  catch { return []; }
}

function setHistorico(h) {
  localStorage.setItem('igreja_historico', JSON.stringify(h.slice(0, 30)));
}

function getCodigo() {
  let c = localStorage.getItem('igreja_codigo');
  if (!c) {
    c = 'igreja-' + Math.random().toString(36).slice(2, 8);
    localStorage.setItem('igreja_codigo', c);
  }
  return c;
}

function publicar(payload) {
  const codigo = getCodigo();
  const topic = codigo.replace(/[^a-z0-9-_]/gi, '').toLowerCase() || 'igreja-default';

  // 1) localStorage (funciona entre abas)
  try {
    const mensagem = {
      ...payload,
      _id: Math.random().toString(36).slice(2),
      _ts: Date.now()
    };
    localStorage.setItem('igreja_broadcast', JSON.stringify(mensagem));
  } catch (e) {}

  // 2) ntfy.sh (para celulares)
  try {
    fetch('https://ntfy.sh/' + topic, {
      method: 'POST',
      body: JSON.stringify(payload)
    }).catch(function () {});
  } catch (e) {}
}

/* =========================================================
   INICIALIZAÇÃO
========================================================= */
window.onload = function () {
  console.log('✅ Página carregada');

  /* ---------- LOGIN ---------- */
  const form = document.getElementById('form-login');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const user = document.getElementById('login-user').value.trim().toLowerCase();
      const pass = document.getElementById('login-pass').value;

      if (user === 'admin' && pass === 'igreja2024') {
        localStorage.setItem('igreja_logado', '1');
        document.getElementById('login-erro').textContent = '';
        mostrarView('view-home');
      } else {
        document.getElementById('login-erro').textContent = '❌ Usuário ou senha errados';
        document.getElementById('login-pass').value = '';
      }
    });
  }

  /* ---------- CARDS ---------- */
  const cards = document.querySelectorAll('.modulo-card');
  console.log('✅ Cards encontrados:', cards.length);

  cards.forEach(function (card) {
    card.style.cursor = 'pointer';
    card.addEventListener('click', function () {
      const mod = card.dataset.modulo;
      console.log('✅ Card clicado:', mod);
      abrirOperador(mod);
    });
  });

  /* ---------- CHAMAR ---------- */
  const btnChamar = document.getElementById('btn-chamar');
  if (btnChamar) {
    btnChamar.addEventListener('click', function () {
      console.log('✅ Botão CHAMAR clicado');
      chamar();
    });
  }

  const opNumero = document.getElementById('op-numero');
  if (opNumero) {
    opNumero.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        console.log('✅ Enter pressionado');
        chamar();
      }
    });
  }

  /* ---------- VOLTAR ---------- */
  const btnVoltar = document.getElementById('btn-voltar');
  if (btnVoltar) {
    btnVoltar.addEventListener('click', function () {
      mostrarView('view-home');
    });
  }

  /* ---------- SAIR ---------- */
  const btnSair = document.getElementById('btn-sair');
  if (btnSair) {
    btnSair.addEventListener('click', function () {
      localStorage.removeItem('igreja_logado');
      document.getElementById('login-user').value = '';
      document.getElementById('login-pass').value = '';
      document.getElementById('login-erro').textContent = '';
      mostrarView('view-login');
    });
  }

  /* ---------- ABRIR TELÃO ---------- */
  const btnAbrir = document.getElementById('btn-abrir-painel');
  if (btnAbrir) btnAbrir.addEventListener('click', abrirPainel);

  const btnAbrir2 = document.getElementById('btn-abrir-painel-2');
  if (btnAbrir2) btnAbrir2.addEventListener('click', abrirPainel);

  /* ---------- LIMPAR TELÃO ---------- */
  const btnLimparTela = document.getElementById('btn-limpar-tela');
  if (btnLimparTela) {
    btnLimparTela.addEventListener('click', function () {
      console.log('✅ Limpar telão');
      publicar({ tipo: 'limpar' });
    });
  }

  /* ---------- LIMPAR HISTÓRICO ---------- */
  const btnLimparHist = document.getElementById('btn-limpar-historico');
  if (btnLimparHist) {
    btnLimparHist.addEventListener('click', function () {
      if (!confirm('Limpar todo o histórico?')) return;
      if (timerLimparHistorico) clearTimeout(timerLimparHistorico);
      setHistorico([]);
      renderHistorico();
    });
  }

  /* ---------- AUTO-LOGIN ---------- */
  if (localStorage.getItem('igreja_logado') === '1') {
    mostrarView('view-home');
  } else {
    mostrarView('view-login');
  }
};

/* =========================================================
   NAVEGAÇÃO
========================================================= */
function mostrarView(id) {
  document.querySelectorAll('.view').forEach(function (v) {
    v.classList.remove('ativo');
  });
  const el = document.getElementById(id);
  if (el) el.classList.add('ativo');
}

/* =========================================================
   ABRIR PAINEL DO OPERADOR
========================================================= */
function abrirOperador(mod) {
  console.log('✅ abrirOperador:', mod);
  moduloAtual = mod;

  const info = MODULOS[mod];
  if (!info) {
    alert('Módulo inválido: ' + mod);
    return;
  }

  const elTitulo = document.getElementById('op-titulo');
  const elNome = document.getElementById('op-nome');
  const elDesc = document.getElementById('op-desc');
  const elNumero = document.getElementById('op-numero');
  const elLogo = document.getElementById('op-logo');
  const elEmoji = document.getElementById('op-emoji');

  if (elTitulo) elTitulo.textContent = info.nome;
  if (elNome) elNome.textContent = info.nome;
  if (elDesc) elDesc.textContent = 'Digite o número da ficha para chamar';
  if (elNumero) elNumero.value = '';

  // 🎯 LOGO SÓ NO INFANTIL
  if (mod === 'infantil') {
    if (elLogo) elLogo.style.display = 'block';
    if (elEmoji) elEmoji.style.display = 'none';
  } else {
    if (elLogo) elLogo.style.display = 'none';
    if (elEmoji) {
      elEmoji.style.display = 'block';
      elEmoji.textContent = info.emoji;
    }
  }

  // Ajustar o input conforme o módulo
  if (elNumero) {
    if (mod === 'estacionamento') {
      elNumero.setAttribute('placeholder', 'ABC-123');
      elNumero.style.fontSize = '2rem';
      elNumero.style.letterSpacing = '3px';
      elNumero.style.textTransform = 'uppercase';
    } else {
      elNumero.setAttribute('placeholder', '000000');
      elNumero.style.fontSize = '';
      elNumero.style.letterSpacing = '';
      elNumero.style.textTransform = '';
    }
  }

  renderHistorico();
  mostrarView('view-operador');

  setTimeout(function () {
    if (elNumero) elNumero.focus();
  }, 100);
}

/* =========================================================
   CHAMAR
========================================================= */
function chamar() {
  if (!moduloAtual) {
    alert('Nenhum módulo selecionado!');
    return;
  }

  const input = document.getElementById('op-numero');
  if (!input) return;

  let numero = input.value.trim();
  if (moduloAtual === 'estacionamento') numero = numero.toUpperCase();
  numero = numero.replace(/^0+(?=\d)/, '') || '';

  if (!numero) {
    input.focus();
    return;
  }

  const info = MODULOS[moduloAtual];
  const chamada = {
    id: Date.now(),
    modulo: moduloAtual,
    numero: numero,
    nome: info.nome,
    emoji: info.emoji,
    mensagem: info.mensagem,
    cor: info.cor,
    hora: new Date().toISOString()
  };

  console.log('✅ Chamando:', chamada);
  publicar({ tipo: 'chamada', ...chamada });
  addHistorico(chamada);

  input.value = '';
  input.focus();
}

/* =========================================================
   HISTÓRICO
========================================================= */
function addHistorico(chamada) {
  const h = getHistorico();
  h.unshift(chamada);
  setHistorico(h);
  renderHistorico();

  // Auto-limpar em 40 segundos
  if (timerLimparHistorico) clearTimeout(timerLimparHistorico);
  timerLimparHistorico = setTimeout(function () {
    setHistorico([]);
    renderHistorico();
  }, 40000);
}

function renderHistorico() {
  const lista = document.getElementById('op-historico');
  if (!lista) return;

  const h = getHistorico();

  if (h.length === 0) {
    lista.innerHTML = '<div class="vazio-historico">Nenhuma chamada realizada</div>';
    return;
  }

  lista.innerHTML = h.slice(0, 20).map(function (c) {
    return '' +
      '<div class="historico-item" style="--cor: ' + c.cor + '">' +
        '<div class="historico-item-info">' +
          '<span class="historico-item-emoji">' + c.emoji + '</span>' +
          '<div>' +
            '<div class="historico-item-modulo">' + c.nome + '</div>' +
            '<div class="historico-item-numero">Nº ' + c.numero + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="historico-item-hora">' +
          new Date(c.hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) +
        '</div>' +
      '</div>';
  }).join('');
}

/* =========================================================
   ABRIR TELÃO
========================================================= */
function abrirPainel() {
  const w = window.open(
    'painel.html',
    'telao_igreja',
    'width=' + screen.width + ',height=' + screen.height + ',left=0,top=0'
  );
  if (w) w.focus();
}