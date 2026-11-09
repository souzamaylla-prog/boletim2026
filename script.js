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
      tdN2.textContent