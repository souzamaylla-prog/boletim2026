// Configuração fixa do aluno
const CONFIG_ALUNO = {
  turma: "8B",
  numeroChamada: 23,
  apiUrl: "https://boletim-api.profbt.com.br"
};

// Dados fictícios padronizados das 15 disciplinas do 8º Ano
const dadosBoletimPadrao = [
  { disciplina: "Língua Portuguesa", tri1: 82, tri2: "7,8", tri3: 85, faltas: [2, 1, 1] },
  { disciplina: "Matemática", tri1: 52, tri2: "5,8", tri3: null, faltas: [3, 2, 1] },
  { disciplina: "Ciências", tri1: "8,1", tri2: 76, tri3: 8.0, faltas: [1, 2, 0] },
  { disciplina: "História", tri1: 7.0, tri2: 84, tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Geografia", tri1: 68, tri2: 7.3, tri3: "7,9", faltas: [0, 1, 1] },
  { disciplina: "Língua Inglesa", tri1: 86, tri2: "8,1", tri3: 8.7, faltas: [1, 0, 0] },
  { disciplina: "Arte", tri1: 9.0, tri2: 92, tri3: null, faltas: [1, 1, 0] },
  { disciplina: "Educação Física", tri1: 95, tri2: 9.0, tri3: "9,4", faltas: [0, 1, 0] },
  { disciplina: "Educação Digital", tri1: 88, tri2: 9.1, tri3: 93, faltas: [1, 0, 1] },
  { disciplina: "Educação Financeira", tri1: 74, tri2: "7,8", tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Estudo Orientado", tri1: 8.0, tri2: 83, tri3: "8,5", faltas: [0, 1, 0] },
  { disciplina: "Redação e Leitura", tri1: 62, tri2: "6,8", tri3: null, faltas: [2, 1, 1] },
  { disciplina: "Pensamento Lógico", tri1: 48, tri2: 5.6, tri3: "6,0", faltas: [2, 2, 1] },
  { disciplina: "Literatura Arte e Movimento", tri1: "7,7", tri2: 80, tri3: null, faltas: [1, 0, 1] },
  { disciplina: "Práticas Experimentais", tri1: 58, tri2: "6,2", tri3: 6.4, faltas: [1, 1, 1] }
];

// Estado da sessão (mantido em memória)
let dadosAtuais = [];
let pinSessao = null;
let modoEdicao = false;

// Instâncias dos gráficos (somente leitura)
let graficoMedias = null;
let graficoEvolucao = null;
let graficoFaltas = null;

// Elementos DOM
const loginScreen = document.getElementById("login-screen");
const boletimScreen = document.getElementById("boletim-screen");
const pinInput = document.getElementById("pin-input");
const btnLogin = document.getElementById("btn-login");
const loginStatus = document.getElementById("login-status");
const btnAlternarEdicao = document.getElementById("btn-alternar-edicao");
const salvarStatus = document.getElementById("salvar-status");

// Função para normalizar qualquer valor de nota para a escala 0 a 10 (Dados Antigos/API)
function normalizarNota(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  if (typeof valor === 'string') {
    valor = valor.replace(',', '.').trim();
  }

  const num = parseFloat(valor);

  if (isNaN(num)) return null;

  if (num >= 0 && num <= 10) {
    return num;
  }

  if (num > 10 && num <= 100) {
    return num / 10;
  }

  return null;
}

// Função para formatar o texto de exibição da nota
function formatarNota(nota) {
  if (nota === null || nota === undefined) return "—";
  const num = typeof nota === 'number' ? nota : parseFloat(String(nota).replace(',', '.'));
  if (isNaN(num)) return "—";
  return num.toFixed(1).replace('.', ',');
}

// Converte dado original/API em array de faltas de 3 posições
function extrairFaltas(item) {
  if (Array.isArray(item.faltas)) {
    return [
      item.faltas[0] ?? 0,
      item.faltas[1] ?? 0,
      item.faltas[2] ?? 0
    ];
  }
  return [
    item.f1 ?? item.falta1 ?? 0,
    item.f2 ?? item.falta2 ?? 0,
    item.f3 ?? item.falta3 ?? 0
  ];
}

// Normaliza estrutura de uma disciplina
function normalizarDisciplina(item) {
  return {
    disciplina: item.disciplina || item.nome || "Disciplina",
    tri1: normalizarNota(item.tri1 ?? item.nota1 ?? item.n1),
    tri2: normalizarNota(item.tri2 ?? item.nota2 ?? item.n2),
    tri3: normalizarNota(item.tri3 ?? item.nota3 ?? item.n3),
    faltas: extrairFaltas(item)
  };
}

// Função principal que constrói o boletim na tela
function renderizarBoletim() {
  const tbody = document.getElementById("tabela-corpo");
  tbody.innerHTML = "";

  let somaMediasGerais = 0;
  let disciplinasComMediaCount = 0;
  let totalFaltasGeral = 0;
  let bomDesempenhoCount = 0;
  let atencaoCount = 0;

  dadosAtuais.forEach((item, index) => {
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

    const notasValidas = [n1, n2, n3].filter(n => n !== null);
    let media = null;
    let situacao = "Nota ainda não disponível";
    let statusClass = "status-indisponivel";

    if (notasValidas.length > 0) {
      const soma = notasValidas.reduce((acc, curr) => acc + curr, 0);
      media = soma / notasValidas.length;
      somaMediasGerais += media;
      disciplinasComMediaCount++;

      if (media >= 6.0) {
        situacao = "Bom desempenho";
        statusClass = "status-bom";
        bomDesempenhoCount++;
      } else {
        situacao = "Atenção";
        statusClass = "status-atencao";
        atencaoCount++;
      }
    }

    const totalFaltasDisciplina = (item.faltas && Array.isArray(item.faltas))
      ? item.faltas.reduce((acc, f) => acc + (Number(f) || 0), 0)
      : 0;

    totalFaltasGeral += totalFaltasDisciplina;

    const tr = document.createElement("tr");

    if (modoEdicao) {
      const tdDisc = document.createElement("td");
      const strongDisc = document.createElement("strong");
      strongDisc.textContent = item.disciplina;
      tdDisc.appendChild(strongDisc);
      tr.appendChild(tdDisc);

      const valN1 = item.tri1 !== null && item.tri1 !== undefined ? String(item.tri1).replace('.', ',') : '';
      const valN2 = item.tri2 !== null && item.tri2 !== undefined ? String(item.tri2).replace('.', ',') : '';
      const valN3 = item.tri3 !== null && item.tri3 !== undefined ? String(item.tri3).replace('.', ',') : '';

      const f1 = item.faltas ? (item.faltas[0] ?? 0) : 0;
      const f2 = item.faltas ? (item.faltas[1] ?? 0) : 0;
      const f3 = item.faltas ? (item.faltas[2] ?? 0) : 0;

      tr.innerHTML += `
        <td><input type="text" class="input-edicao edit-n1" data-index="${index}" value="${valN1}"></td>
        <td><input type="text" class="input-edicao edit-n2" data-index="${index}" value="${valN2}"></td>
        <td><input type="text" class="input-edicao edit-n3" data-index="${index}" value="${valN3}"></td>
        <td><strong>${formatarNota(media)}</strong></td>
        <td>
          <div style="display: flex; gap: 4px;">
            <input type="text" class="input-edicao edit-f1" data-index="${index}" value="${f1}" title="Faltas 1º Tri">
            <input type="text" class="input-edicao edit-f2" data-index="${index}" value="${f2}" title="Faltas 2º Tri">
            <input type="text" class="input-edicao edit-f3" data-index="${index}" value="${f3}" title="Faltas 3º Tri">
          </div>
        </td>
        <td><span class="status ${statusClass}">${situacao}</span></td>
      `;
    } else {
      const tdDisc = document.createElement("td");
      const strongDisc = document.createElement("strong");
      strongDisc.textContent = item.disciplina;
      tdDisc.appendChild(strongDisc);

      const tdN1 = document.createElement("td");
      tdN1.textContent = formatarNota(n1);

      const tdN2 = document.createElement("td");
      tdN2.textContent = formatarNota(n2);

      const tdN3 = document.createElement("td");
      tdN3.textContent = formatarNota(n3);

      const tdMedia = document.createElement("td");
      const strongMedia = document.createElement("strong");
      strongMedia.textContent = formatarNota(media);
      tdMedia.appendChild(strongMedia);

      const tdFaltas = document.createElement("td");
      tdFaltas.textContent = totalFaltasDisciplina;

      const tdSit = document.createElement("td");
      const spanSit = document.createElement("span");
      spanSit.className = `status ${statusClass}`;
      spanSit.textContent = situacao;
      tdSit.appendChild(spanSit);

      tr.appendChild(tdDisc);
      tr.appendChild(tdN1);
      tr.appendChild(tdN2);
      tr.appendChild(tdN3);
      tr.appendChild(tdMedia);
      tr.appendChild(tdFaltas);
      tr.appendChild(tdSit);
    }

    tbody.appendChild(tr);
  });

  const mediaGeral = disciplinasComMediaCount > 0 
    ? (somaMediasGerais / disciplinasComMediaCount).toFixed(1).replace('.', ',')
    : "—";

  document.getElementById("media-geral").textContent = mediaGeral;
  document.getElementById("total-faltas").textContent = totalFaltasGeral;
  document.getElementById("bom-desempenho-count").textContent = bomDesempenhoCount;
  document.getElementById("atencao-count").textContent = atencaoCount;

  // Atualiza os gráficos em modo somente leitura após atualizar tabela e cards
  atualizarGraficos();
}

// =========================================================
// CAMADA DE GRÁFICOS (SOMENTE LEITURA)
// =========================================================

function atualizarGraficoMedias() {
  const canvas = document.getElementById("graficoMediasDisciplinas");
  if (!canvas || typeof Chart === "undefined") return;

  const labels = [];
  const valores = [];
  const coresBarras = [];
  const coresBordas = [];

  dadosAtuais.forEach(item => {
    labels.push(item.disciplina);
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);
    const validas = [n1, n2, n3].filter(n => n !== null);

    if (validas.length > 0) {
      const media = validas.reduce((acc, v) => acc + v, 0) / validas.length;
      valores.push(Number(media.toFixed(2)));
      if (media >= 6.0) {
        coresBarras.push("rgba(255, 255, 255, 0.35)");
        coresBordas.push("rgba(255, 255, 255, 0.8)");
      } else {
        coresBarras.push("rgba(255, 100, 100, 0.45)");
        coresBordas.push("rgba(255, 120, 120, 0.9)");
      }
    } else {
      valores.push(null);
      coresBarras.push("rgba(150, 150, 150, 0.2)");
      coresBordas.push("rgba(150, 150, 150, 0.5)");
    }
  });

  if (graficoMedias) {
    graficoMedias.destroy();
  }

  graficoMedias = new Chart(canvas, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Média",
        data: valores,
        backgroundColor: coresBarras,
        borderColor: coresBordas,
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(18, 18, 18, 0.95)",
          titleColor: "#ffffff",
          bodyColor: "#e0e0e0",
          borderColor: "rgba(255, 255, 255, 0.2)",
          borderWidth: 1,
          callbacks: {
            label: (ctx) => {
              const val = ctx.raw;
              if (val === null || val === undefined) return " Sem nota";
              return ` ${ctx.label}: ${Number(val).toFixed(1).replace('.', ',')}`;
            }
          }
        }
      },
      scales: {
        x: {
          min: 0,
          max: 10,
          ticks: { color: "#a0a0a0", stepSize: 2 },
          grid: { color: "rgba(255, 255, 255, 0.08)" }
        },
        y: {
          ticks: {
            color: "#d0d0d0",
            font: { size: 10 }
          },
          grid: { display: false }
        }
      }
    }
  });
}

function atualizarGraficoEvolucao() {
  const canvas = document.getElementById("graficoEvolucaoTrimestres");
  if (!canvas || typeof Chart === "undefined") return;

  let soma1 = 0, qtd1 = 0;
  let soma2 = 0, qtd2 = 0;
  let soma3 = 0, qtd3 = 0;

  dadosAtuais.forEach(item => {
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

    if (n1 !== null) { soma1 += n1; qtd1++; }
    if (n2 !== null) { soma2 += n2; qtd2++; }
    if (n3 !== null) { soma3 += n3; qtd3++; }
  });

  const mediaTri1 = qtd1 > 0 ? Number((soma1 / qtd1).toFixed(2)) : null;
  const mediaTri2 = qtd2 > 0 ? Number((soma2 / qtd2).toFixed(2)) : null;
  const mediaTri3 = qtd3 > 0 ? Number((soma3 / qtd3).toFixed(2)) : null;

  if (graficoEvolucao) {
    graficoEvolucao.destroy();
  }

  graficoEvolucao = new Chart(canvas, {
    type: "line",
    data: {
      labels: ["1º Tri", "2º Tri", "3º Tri"],
      datasets: [{
        label: "Média Geral",
        data: [mediaTri1, mediaTri2, mediaTri3],
        borderColor: "#99ccff",
        backgroundColor: "rgba(153, 204, 255, 0.15)",
        pointBackgroundColor: "#ffffff",
        pointBorderColor: "#99ccff",
        pointRadius: 5,
        pointHoverRadius: 7,
        borderWidth: 2.5,
        tension: 0.25,
        fill: true,
        spanGaps: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(18, 18, 18, 0.95)",
          titleColor: "#ffffff",
          bodyColor: "#e0e0e0",
          borderColor: "rgba(255, 255, 255, 0.2)",
          borderWidth: 1,
          callbacks: {
            label: (ctx) => {
              const val = ctx.raw;
              if (val === null || val === undefined) return " Sem notas registradas";
              return ` Média: ${Number(val).toFixed(1).replace('.', ',')}`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: "#d0d0d0" },
          grid: { color: "rgba(255, 255, 255, 0.06)" }
        },
        y: {
          min: 0,
          max: 10,
          ticks: { color: "#a0a0a0", stepSize: 2 },
          grid: { color: "rgba(255, 255, 255, 0.08)" }
        }
      }
    }
  });
}

function atualizarGraficoFaltas() {
  const canvas = document.getElementById("graficoFaltasTrimestres");
  if (!canvas || typeof Chart === "undefined") return;

  let faltasTri1 = 0;
  let faltasTri2 = 0;
  let faltasTri3 = 0;

  dadosAtuais.forEach(item => {
    if (Array.isArray(item.faltas)) {
      faltasTri1 += Number(item.faltas[0]) || 0;
      faltasTri2 += Number(item.faltas[1]) || 0;
      faltasTri3 += Number(item.faltas[2]) || 0;
    }
  });

  const totalFaltas = faltasTri1 + faltasTri2 + faltasTri3;
  const referenciaCritica = 350;
  const emPerigo = totalFaltas >= referenciaCritica;

  const badgePerigo = document.getElementById("estadoFaltas");
  const cardFaltas = document.getElementById("card-faltas-trimestre");

  if (badgePerigo && cardFaltas) {
    if (emPerigo) {
      badgePerigo.style.display = "inline-block";
      cardFaltas.classList.add("card-perigo-ativo");
    } else {
      badgePerigo.style.display = "none";
      cardFaltas.classList.remove("card-perigo-ativo");
    }
  }

  const corBarra = emPerigo ? "rgba(255, 90, 90, 0.5)" : "rgba(255, 255, 255, 0.3)";
  const corBorda = emPerigo ? "rgba(255, 110, 110, 0.9)" : "rgba(255, 255, 255, 0.75)";

  if (graficoFaltas) {
    graficoFaltas.destroy();
  }

  graficoFaltas = new Chart(canvas, {
    type: "bar",
    data: {
      labels: ["1º Tri", "2º Tri", "3º Tri"],
      datasets: [{
        label: "Faltas",
        data: [faltasTri1, faltasTri2, faltasTri3],
        backgroundColor: corBarra,
        borderColor: corBorda,
        borderWidth: 1,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(18, 18, 18, 0.95)",
          titleColor: "#ffffff",
          bodyColor: "#e0e0e0",
          borderColor: "rgba(255, 255, 255, 0.2)",
          borderWidth: 1,
          callbacks: {
            label: (ctx) => {
              const qtd = Number(ctx.raw) || 0;
              return ` ${ctx.label}: ${qtd} ${qtd === 1 ? "falta" : "faltas"}`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: "#d0d0d0" },
          grid: { display: false }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: "#a0a0a0",
            precision: 0
          },
          grid: { color: "rgba(255, 255, 255, 0.08)" }
        }
      }
    }
  });
}

function atualizarGraficos() {
  atualizarGraficoMedias();
  atualizarGraficoEvolucao();
  atualizarGraficoFaltas();
}

// =========================================================
// NÚCLEO PROTEGIDO — VALIDAÇÃO, LOGIN E SALVAMENTO
// =========================================================

// Validação estrita de nota digitada (0 a 10, ponto/vírgula ou vazio)
function validarNotaDigitada(str) {
  if (str === null || str === undefined) return { valida: true, valor: null };
  const s = String(str).trim();
  if (s === "") return { valida: true, valor: null };

  const normalizada = s.replace(',', '.');
  const num = Number(normalizada);

  if (isNaN(num) || num < 0 || num > 10) {
    return { valida: false, valor: null };
  }

  return { valida: true, valor: num };
}

// Validação estrita de falta digitada (inteiro >= 0)
function validarFaltaDigitada(str) {
  if (str === null || str === undefined) return { valida: false, valor: null };
  const s = String(str).trim();
  if (s === "") return { valida: false, valor: null };

  if (!/^\d+$/.test(s)) {
    return { valida: false, valor: null };
  }

  const num = parseInt(s, 10);
  if (isNaN(num) || num < 0) {
    return { valida: false, valor: null };
  }

  return { valida: true, valor: num };
}

// Ação de Login (Abrir Boletim)
async function efetuarLogin() {
  const pin = pinInput.value;
  if (!pin) {
    loginStatus.className = "status-message";
    loginStatus.textContent = "Digite o PIN para entrar.";
    return;
  }

  loginStatus.className = "status-message info";
  loginStatus.textContent = "Conectando...";
  btnLogin.disabled = true;

  try {
    const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/abrir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pin
      })
    });

    if (resposta.status === 401) {
      loginStatus.className = "status-message";
      loginStatus.textContent = "Turma, chamada ou PIN inválidos.";
      btnLogin.disabled = false;
      return;
    }

    if (resposta.status === 429) {
      loginStatus.className = "status-message";
      loginStatus.textContent = "Muitas tentativas. Aguarde um minuto e tente novamente.";
      btnLogin.disabled = false;
      return;
    }

    if (!resposta.ok) {
      throw new Error("Erro na rede");
    }

    const resultado = await resposta.json();

    pinSessao = pin;
    pinInput.value = "";

    if (resultado && resultado.dados && Array.isArray(resultado.dados.disciplinas) && resultado.dados.disciplinas.length > 0) {
      dadosAtuais = resultado.dados.disciplinas.map(normalizarDisciplina);
    } else {
      dadosAtuais = dadosBoletimPadrao.map(normalizarDisciplina);
    }

    loginScreen.style.display = "none";
    boletimScreen.style.display = "block";
    renderizarBoletim();

  } catch (err) {
    loginStatus.className = "status-message";
    loginStatus.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
    btnLogin.disabled = false;
  }
}

// Salvar alterações na API
async function salvarAlteracoes() {
  const inputsEdicao = document.querySelectorAll('.input-edicao');
  inputsEdicao.forEach(i => i.classList.remove('invalido'));

  let erroValidacao = false;
  const novasDisciplinas = JSON.parse(JSON.stringify(dadosAtuais));

  dadosAtuais.forEach((item, index) => {
    const inputN1 = document.querySelector(`.edit-n1[data-index="${index}"]`);
    const inputN2 = document.querySelector(`.edit-n2[data-index="${index}"]`);
    const inputN3 = document.querySelector(`.edit-n3[data-index="${index}"]`);
    const inputF1 = document.querySelector(`.edit-f1[data-index="${index}"]`);
    const inputF2 = document.querySelector(`.edit-f2[data-index="${index}"]`);
    const inputF3 = document.querySelector(`.edit-f3[data-index="${index}"]`);

    const resN1 = validarNotaDigitada(inputN1.value);
    const resN2 = validarNotaDigitada(inputN2.value);
    const resN3 = validarNotaDigitada(inputN3.value);
    const resF1 = validarFaltaDigitada(inputF1.value);
    const resF2 = validarFaltaDigitada(inputF2.value);
    const resF3 = validarFaltaDigitada(inputF3.value);

    if (!resN1.valida) { inputN1.classList.add('invalido'); erroValidacao = true; }
    if (!resN2.valida) { inputN2.classList.add('invalido'); erroValidacao = true; }
    if (!resN3.valida) { inputN3.classList.add('invalido'); erroValidacao = true; }
    if (!resF1.valida) { inputF1.classList.add('invalido'); erroValidacao = true; }
    if (!resF2.valida) { inputF2.classList.add('invalido'); erroValidacao = true; }
    if (!resF3.valida) { inputF3.classList.add('invalido'); erroValidacao = true; }

    if (!erroValidacao) {
      novasDisciplinas[index].tri1 = resN1.valor;
      novasDisciplinas[index].tri2 = resN2.valor;
      novasDisciplinas[index].tri3 = resN3.valor;
      novasDisciplinas[index].faltas = [resF1.valor, resF2.valor, resF3.valor];
    }
  });

  if (erroValidacao) {
    salvarStatus.className = "status-message";
    salvarStatus.textContent = "Verifique os campos destacados em vermelho.";
    return;
  }

  salvarStatus.className = "status-message info";
  salvarStatus.textContent = "Salvando...";
  btnAlternarEdicao.disabled = true;

  try {
    const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/salvar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pinSessao,
        dados: {
          disciplinas: novasDisciplinas
        }
      })
    });

    if (!resposta.ok) {
      throw new Error("Erro ao salvar");
    }

    dadosAtuais = novasDisciplinas;
    modoEdicao = false;
    btnAlternarEdicao.textContent = "Alterar dados";
    btnAlternarEdicao.disabled = false;

    salvarStatus.className = "status-message success";
    salvarStatus.textContent = "Dados salvos com sucesso.";

    renderizarBoletim();

    setTimeout(() => {
      salvarStatus.textContent = "";
    }, 4000);

  } catch (err) {
    salvarStatus.className = "status-message";
    salvarStatus.textContent = "Falha ao salvar alterações. Tente novamente.";
    btnAlternarEdicao.disabled = false;
  }
}

// Event Listeners
btnLogin.addEventListener("click", efetuarLogin);

pinInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    efetuarLogin();
  }
});

btnAlternarEdicao.addEventListener("click", () => {
  if (!modoEdicao) {
    modoEdicao = true;
    btnAlternarEdicao.textContent = "Salvar alterações";
    salvarStatus.textContent = "";
    renderizarBoletim();
  } else {
    salvarAlteracoes();
  }
});