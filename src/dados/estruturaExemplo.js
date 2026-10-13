// Dados fictícios (tripulação da "Nave Estelar Andrômeda") no mesmo formato
// que a API devolve para o Organograma da Simulação: uma árvore de nós
// `unit` (unidades) cujos `filhos` são alocações `role` (cargos/funções,
// sempre antes das unidades) e unidades subordinadas. Substitua estas
// funções pela chamada ao seu serviço.
//
// - estruturaAtual: organograma vigente (somente leitura, usado para restaurar).
// - estruturaSimulacao: cópia editável; `snapshotId` aponta para o item
//   correspondente na estrutura atual (itens acrescidos não têm snapshotId).

let sequencial = 0

function proximoId() {
  sequencial += 1
  return sequencial
}

function cargo(siglaUnidade, indice, [simbolo, nomeCargo, nivelAtuacao]) {
  const tipoSimbolo = simbolo.startsWith('N')
    ? { descricao: 'Patente de Comando', sigla: 'PC' }
    : { descricao: 'Insígnia de Especialista', sigla: 'IE' }
  const sigla = `${siglaUnidade}[${indice + 1}]`
  return {
    id: proximoId(),
    tipo: 'role',
    rotulo: [simbolo, nomeCargo, sigla].join(' - '),
    status: 'Atual',
    sigla,
    nomeCargo,
    simbolo,
    nivelAtuacao,
    tipoSimboloDescricao: tipoSimbolo.descricao,
    tipoSimboloSigla: tipoSimbolo.sigla,
  }
}

function unidade(nome, sigla, tipoUnidade, cargos = [], subordinadas = []) {
  return {
    id: proximoId(),
    tipo: 'unit',
    rotulo: `${nome} - ${sigla}`,
    status: 'Atual',
    expandido: true,
    nome,
    sigla,
    tipoUnidade,
    filhos: [...cargos.map((c, i) => cargo(sigla, i, c)), ...subordinadas],
  }
}

const COMANDANTE = ['N1', 'Comandante da Nave', 'Estratégico']
const CHEFE_DIVISAO = ['N1', 'Chefe de Divisão', 'Estratégico']
const LIDER_SETOR = ['N2', 'Líder de Setor', 'Tático']
const COORDENADOR_NUCLEO = ['N3', 'Coordenador de Núcleo', 'Operacional']
const ESPECIALISTA = ['E1', 'Especialista de Bordo', 'Operacional']

export function criarEstruturaAtual() {
  sequencial = 0
  return [
    unidade(
      'Ponte de Comando',
      'CMD',
      'Comando',
      [COMANDANTE, ESPECIALISTA, ESPECIALISTA],
      [
        unidade(
          'Divisão de Engenharia',
          'ENG',
          'Divisão',
          [CHEFE_DIVISAO, ESPECIALISTA],
          [
            unidade(
              'Setor de Propulsão',
              'ENG-PRP',
              'Setor',
              [LIDER_SETOR, ESPECIALISTA],
              [
                unidade('Núcleo de Reatores', 'ENG-PRP-REA', 'Núcleo', [COORDENADOR_NUCLEO]),
                unidade('Núcleo de Dobra Espacial', 'ENG-PRP-DOB', 'Núcleo', [COORDENADOR_NUCLEO]),
              ],
            ),
            unidade('Setor de Robótica', 'ENG-ROB', 'Setor', [LIDER_SETOR]),
          ],
        ),
        unidade(
          'Divisão de Ciências',
          'CIE',
          'Divisão',
          [CHEFE_DIVISAO],
          [
            unidade('Setor de Astrobiologia', 'CIE-AST', 'Setor', [LIDER_SETOR, ESPECIALISTA]),
            unidade(
              'Setor de Cartografia Estelar',
              'CIE-CAR',
              'Setor',
              [LIDER_SETOR],
              [unidade('Núcleo de Sondas', 'CIE-CAR-SON', 'Núcleo', [COORDENADOR_NUCLEO])],
            ),
          ],
        ),
        unidade(
          'Divisão de Bem-Estar',
          'BEM',
          'Divisão',
          [CHEFE_DIVISAO, ESPECIALISTA],
          [
            unidade('Setor de Hidroponia', 'BEM-HID', 'Setor', [LIDER_SETOR]),
            unidade('Setor de Recreação', 'BEM-REC', 'Setor', [LIDER_SETOR]),
          ],
        ),
        unidade('Ouvidoria Intergaláctica', 'OUV', 'Ouvidoria', [
          ['N1', 'Ouvidor-Chefe', 'Estratégico'],
        ]),
      ],
    ),
  ]
}

function copiarComoSimulacao(nos) {
  return nos.map((no) => ({
    ...no,
    snapshotId: no.id,
    ...(no.filhos ? { filhos: copiarComoSimulacao(no.filhos) } : {}),
  }))
}

// Simulação de exemplo: cópia da estrutura atual com um acréscimo, para já
// exibir as cores de status diferentes de "Atual".
export function criarEstruturaSimulacao(estruturaAtual) {
  const simulacao = copiarComoSimulacao(estruturaAtual)
  const bemEstar = simulacao[0].filhos.find((f) => f.sigla === 'BEM')
  bemEstar.filhos.push({
    id: 1000,
    tipo: 'unit',
    rotulo: 'Setor de Culinária Espacial - BEM-CUL',
    status: 'Acrescimo',
    expandido: true,
    preenchidoManualmente: true,
    nome: 'Setor de Culinária Espacial',
    sigla: 'BEM-CUL',
    tipoUnidade: 'Setor',
    filhos: [],
  })
  return simulacao
}
