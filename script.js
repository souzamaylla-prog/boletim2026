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
  if (isNaN