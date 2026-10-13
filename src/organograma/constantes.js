// Id da instância do Vue Flow: compartilhado entre o organograma e as linhas
// auxiliares, que acessam o mesmo estado via useVueFlow(ID_FLUXO).
export const ID_FLUXO = 'org-chart-flow'

// Dimensões usadas para espaçar os nós na árvore (layout automático).
export const LARGURA_NO = 200
export const ALTURA_NO = 110
export const ESPACO_HORIZONTAL = 80
export const ESPACO_VERTICAL = 100

// Largura visual padrão da caixa quando ainda não há redimensionamento
// manual salvo. Aplicada como `style` explícito no nó para que o
// NodeResizer tenha uma base concreta a partir da qual redimensionar. A
// altura fica automática para não conflitar com a correção de min-height
// feita internamente pelo NodeResizer.
export const LARGURA_VISUAL_NO = 240

// Folga mínima entre caixas ao procurar espaço para uma unidade nova. Deve
// ser menor que o espaço entre caixas vizinhas do layout automático
// (LARGURA_NO + ESPACO_HORIZONTAL - LARGURA_VISUAL_NO = 40px).
export const FOLGA_MINIMA_ENTRE_CAIXAS = 20

// Espaço vertical mínimo entre a base do pai e o topo do primeiro filho,
// usado quando o pai é mais alto que a linha do layout automático.
export const ESPACO_MINIMO_ABAIXO_DO_PAI = 40

// Limites do redimensionamento manual. Devem ficar abaixo da altura natural
// de qualquer caixa (iguais ao min-width/min-height de .org-node): ao
// montar, o NodeResizer força caixas menores que o mínimo para o mínimo.
export const LARGURA_MINIMA_NO = 160
export const ALTURA_MINIMA_NO = 90

// Níveis visíveis no carregamento inicial (raiz = nível 0). 2 mostra raízes
// e filhos diretos; os níveis abaixo nascem recolhidos.
export const NIVEIS_VISIVEIS_INICIAIS = 2

export const COR_FUNDO_PADRAO = '#ffffff'

export const TAMANHO_PAGINA_ALOCACOES = 5

export const STATUS = {
  ATUAL: 'Atual',
  ACRESCIMO: 'Acrescimo',
  ALTERACAO: 'Alteracao',
  EXTINCAO: 'Extincao',
}

export const ROTULOS_STATUS = {
  Atual: 'Atual',
  Acrescimo: 'Acréscimo',
  Alteracao: 'Alteração',
  Extincao: 'Extinção',
  'Extincao/Liberacao': 'Extinção/Liberação',
}

// Estado inicial (vazio) da disposição visual: posições e dimensões manuais
// dos nós, cor de fundo, viewport (zoom/deslocamento) e unidades recolhidas
// (null = sem gravação, usa NIVEIS_VISIVEIS_INICIAIS).
export function disposicaoPadrao() {
  return {
    posicoes: {},
    dimensoes: {},
    corFundo: COR_FUNDO_PADRAO,
    viewport: null,
    recolhidos: null,
  }
}

// Preenche valores padrão quando ainda não há disposição gravada.
export function normalizarDisposicao(disposicao) {
  return {
    posicoes: { ...(disposicao?.posicoes || {}) },
    dimensoes: { ...(disposicao?.dimensoes || {}) },
    corFundo: disposicao?.corFundo || COR_FUNDO_PADRAO,
    viewport: disposicao?.viewport || null,
    recolhidos: Array.isArray(disposicao?.recolhidos) ? disposicao.recolhidos.map(String) : null,
  }
}
