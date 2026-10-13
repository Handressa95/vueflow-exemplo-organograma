import {
  buscarPorId,
  montarRotuloCargo,
  montarRotuloUnidade,
  proximoId,
} from '@/organograma/arvore'
import { STATUS } from '@/organograma/constantes'
import { gravarNaSessao, lerDaSessao, removerDaSessao } from './sessaoNavegador'

// ─────────────────────────────────────────────────────────────────────────
// EXEMPLO 1 — Salvar só a disposição visual, no formato usado hoje.
//
// O payload tem duas partes, iguais às enviadas hoje para a API:
//   - nos: a árvore de negócio (unidades e cargos/funções), com `tipoAcao`;
//   - jsonPosicaoOrganograma: string JSON com a disposição visual:
//       {
//         posicoes:  { [chave]: { x, y, arrastada? } },
//         dimensoes: { [chave]: { width, height } },
//         corFundo:  '#ffffff',
//         viewport:  { x, y, zoom } | null,
//         recolhidos: [chave] | null
//       }
//     `chave` é o id do item ou, para itens acrescidos, uma chave baseada na
//     sigla (ver chaveDisposicao em Organograma.vue).
//
// Aqui o "backend" é a sessão do navegador: `simularRespostaBackend` faz o
// que a API faz ao devolver a simulação (atribui ids aos itens novos e
// reconstrói status/rótulos).
// ─────────────────────────────────────────────────────────────────────────

export const CHAVE_SESSAO_DISPOSICAO = 'vueflow-template-organograma:disposicao'

const TIPO_ACAO_POR_STATUS = {
  [STATUS.ATUAL]: 0,
  [STATUS.ACRESCIMO]: 1,
  [STATUS.ALTERACAO]: 2,
  [STATUS.EXTINCAO]: 3,
}

const STATUS_POR_TIPO_ACAO = Object.fromEntries(
  Object.entries(TIPO_ACAO_POR_STATUS).map(([status, tipoAcao]) => [tipoAcao, status]),
)

export function statusParaTipoAcao(status) {
  return TIPO_ACAO_POR_STATUS[status] ?? 0
}

// Itens acrescidos vão sem id: quem define o id definitivo é o backend.
export function construirPayloadOrganograma(itens) {
  return itens.map((item) => ({
    id: item.status === STATUS.ACRESCIMO ? null : item.id > 0 ? item.id : null,
    tipo: item.tipo,
    tipoAcao: statusParaTipoAcao(item.status),
    nome: item.nomeUnidade || item.nome || (item.tipo === 'unit' ? item.rotulo : null),
    sigla: item.sigla || null,
    tipoUnidade: item.tipoUnidade || null,
    nomeCargo: item.nomeCargo || null,
    simbolo: item.simbolo || null,
    nivelAtuacao: item.nivelAtuacao || null,
    tipoSimboloDescricao: item.tipoSimboloDescricao || null,
    tipoSimboloSigla: item.tipoSimboloSigla || null,
    filhos: item.filhos ? construirPayloadOrganograma(item.filhos) : [],
  }))
}

export function construirDisposicaoParaSalvar(disposicao) {
  return JSON.stringify({
    posicoes: { ...disposicao.posicoes },
    dimensoes: { ...disposicao.dimensoes },
    corFundo: disposicao.corFundo,
    viewport: disposicao.viewport,
    recolhidos: disposicao.recolhidos ?? null,
  })
}

export function montarPayloadSalvar(estruturaSimulacao, disposicao) {
  return {
    nos: construirPayloadOrganograma(estruturaSimulacao),
    jsonPosicaoOrganograma: construirDisposicaoParaSalvar(disposicao),
  }
}

export function salvarDisposicaoNaSessao(estruturaSimulacao, disposicao) {
  const payload = montarPayloadSalvar(estruturaSimulacao, disposicao)
  gravarNaSessao(CHAVE_SESSAO_DISPOSICAO, payload)
  return payload
}

export function lerPayloadDisposicaoDaSessao() {
  return lerDaSessao(CHAVE_SESSAO_DISPOSICAO)
}

export function removerDisposicaoDaSessao() {
  removerDaSessao(CHAVE_SESSAO_DISPOSICAO)
}

// Equivalente ao que a API devolve ao carregar a simulação: a estrutura com
// ids (os itens novos recebem um id novo a cada gravação), `snapshotId`
// apontando para a estrutura atual e a disposição já interpretada.
export function simularRespostaBackend(payload, estruturaAtual) {
  let proximo = Math.max(proximoId(estruturaAtual), proximoId(payload.nos))

  const converter = (nos) =>
    nos.map((no) => {
      const id = no.id ?? proximo++
      const existeNaAtual = no.id != null && buscarPorId(estruturaAtual, no.id)
      const base = {
        id,
        tipo: no.tipo,
        status: STATUS_POR_TIPO_ACAO[no.tipoAcao] || STATUS.ATUAL,
        sigla: no.sigla,
        ...(existeNaAtual ? { snapshotId: no.id } : {}),
      }

      if (no.tipo === 'role') {
        const cargo = {
          ...base,
          nome: no.nome,
          nomeCargo: no.nomeCargo,
          simbolo: no.simbolo,
          nivelAtuacao: no.nivelAtuacao,
          tipoSimboloDescricao: no.tipoSimboloDescricao,
          tipoSimboloSigla: no.tipoSimboloSigla,
        }
        return { ...cargo, rotulo: montarRotuloCargo(cargo) }
      }

      const unidade = {
        ...base,
        nome: no.nome,
        tipoUnidade: no.tipoUnidade,
        expandido: true,
        filhos: converter(no.filhos || []),
      }
      return { ...unidade, rotulo: montarRotuloUnidade(unidade) }
    })

  return {
    estruturaSimulacao: converter(payload.nos || []),
    disposicao: JSON.parse(payload.jsonPosicaoOrganograma || 'null'),
  }
}
