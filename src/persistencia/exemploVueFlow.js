import { clonar } from '@/organograma/arvore'
import { gravarNaSessao, lerDaSessao, removerDaSessao } from './sessaoNavegador'

// ─────────────────────────────────────────────────────────────────────────
// EXEMPLO 2 — Salvar a estrutura nativa do Vue Flow ("Save & Restore" da
// documentação: https://vueflow.dev/examples/save.html).
//
// `fluxo` é exatamente o retorno de `toObject()` do useVueFlow:
//   { nodes, edges, position: [x, y], zoom, viewport: { x, y, zoom } }
// e é restaurado com `fromObject(fluxo)`.
//
// O Vue Flow só conhece o que está desenhado: a árvore de negócio (cargos,
// snapshotId, unidades recolhidas que não estão na tela) e a cor de fundo
// não fazem parte de `toObject()`, por isso são gravadas ao lado do fluxo.
// ─────────────────────────────────────────────────────────────────────────

export const CHAVE_SESSAO_VUE_FLOW = 'vueflow-template-organograma:vue-flow'

export function montarObjetoVueFlow(fluxo, estruturaSimulacao, corFundo) {
  return {
    fluxo,
    estruturaSimulacao: clonar(estruturaSimulacao),
    corFundo,
  }
}

export function salvarVueFlowNaSessao(fluxo, estruturaSimulacao, corFundo) {
  const objeto = montarObjetoVueFlow(fluxo, estruturaSimulacao, corFundo)
  gravarNaSessao(CHAVE_SESSAO_VUE_FLOW, objeto)
  return objeto
}

export function lerVueFlowDaSessao() {
  return lerDaSessao(CHAVE_SESSAO_VUE_FLOW)
}

export function removerVueFlowDaSessao() {
  removerDaSessao(CHAVE_SESSAO_VUE_FLOW)
}
