// Dados fictícios padronizados das 15 disciplinas do 8º Ano
const dadosBoletim = [
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

// NOTA: A frequência de 92% exibida no HTML é APENAS DEMONSTRATIVA e fictícia nesta etapa.

// Função para normalizar qualquer valor de nota para a escala 0 a 10
function normalizarNota(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  // Se o valor vier como texto com vírgula, substitui por ponto para converter
  if (typeof valor === 'string') {
    valor = valor.replace(',', '.');
  }

  const num = parseFloat(valor);

  if (isNaN(num)) return null;

  // Trata notas entre 0 e 10
  if (num >= 0 && num <= 10) {
    return num;
  }

  // Trata notas maiores que 10 e menores ou iguais a 100 (ex: 82 vira 8.2)
  if (num > 10 && num <= 100) {
    return num / 10;
  }

  // Valores fora dessas regras são considerados inválidos
  return null;
}

// Função para formatar o texto de exibição da nota
function formatarNota(nota) {
  if (nota === null) return "—";
  return nota.toFixed(1).replace('.', ',');
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

  dadosBoletim.forEach(item => {
    // Normaliza notas de cada trimestre
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

    // Calcula a média das notas disponíveis (sem transformar ausente em 0)
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

    // Somar total de faltas da disciplina
    const totalFaltasDisciplina = item.faltas.reduce((acc, f) => acc + f, 0);
    totalFaltasGeral += totalFaltasDisciplina;

    // Criar a linha da tabela no DOM
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${item.disciplina}</strong></td>
      <td>${formatarNota(n1)}</td>
      <td>${formatarNota(n2)}</td>
      <td>${formatarNota(n3)}</td>
      <td><strong>${formatarNota(media)}</strong></td>
      <td>${totalFaltasDisciplina}</td>
      <td><span class="status ${statusClass}">${situacao}</span></td>
    `;

    tbody.appendChild(tr);
  });

  // Atualizar os Cards de Resumo no DOM
  const mediaGeral = disciplinasComMediaCount > 0 
    ? (somaMediasGerais / disciplinasComMediaCount).toFixed(1).replace('.', ',')
    : "—";

  document.getElementById("media-geral").textContent = mediaGeral;
  document.getElementById("total-faltas").textContent = totalFaltasGeral;
  document.getElementById("bom-desempenho-count").textContent = bomDesempenhoCount;
  document.getElementById("atencao-count").textContent = atencaoCount;
}

// Executa a função assim que a página carrega
renderizarBoletim();