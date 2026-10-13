import { beforeEach, describe, it, expect } from 'vitest'
import { criarEstruturaAtual, criarEstruturaSimulacao } from '@/dados/estruturaExemplo'
import { proximoId } from '@/organograma/arvore'
import {
  CHAVE_SESSAO_DISPOSICAO,
  lerPayloadDisposicaoDaSessao,
  salvarDisposicaoNaSessao,
  simularRespostaBackend,
} from './exemploDisposicao'

const disposicao = {
  posicoes: { 1: { x: 10, y: 20, arrastada: true }, 'sigla:NOVA': { x: 5, y: 6 } },
  dimensoes: { 1: { width: 300, height: 120 } },
  corFundo: '#eef6ff',
  viewport: { x: 1, y: 2, zoom: 0.5 },
  recolhidos: ['26', 'sigla:NOVA'],
}

describe('exemploDisposicao', () => {
  let estruturaAtual
  let estruturaSimulacao

  beforeEach(() => {
    sessionStorage.clear()
    estruturaAtual = criarEstruturaAtual()
    estruturaSimulacao = criarEstruturaSimulacao(estruturaAtual)
  })

  it('Deve gravar na sessão a árvore e a disposição como string JSON', () => {
    salvarDisposicaoNaSessao(estruturaSimulacao, disposicao)

    const payload = JSON.parse(sessionStorage.getItem(CHAVE_SESSAO_DISPOSICAO))
    expect(Object.keys(payload)).toEqual(['nos', 'jsonPosicaoOrganograma'])
    expect(JSON.parse(payload.jsonPosicaoOrganograma)).toEqual(disposicao)
  })

  it('Deve enviar itens acrescidos sem id e com tipoAcao de acréscimo', () => {
    const { nos } = salvarDisposicaoNaSessao(estruturaSimulacao, disposicao)

    const bemEstar = nos[0].filhos.find((f) => f.sigla === 'BEM')
    const novo = bemEstar.filhos.find((f) => f.sigla === 'BEM-CUL')
    expect(novo).toMatchObject({ id: null, tipoAcao: 1, tipo: 'unit' })
    expect(nos[0]).toMatchObject({ id: 31, tipoAcao: 0 })
  })

  it('Deve recarregar com ids novos para os acréscimos e snapshotId para os existentes', () => {
    salvarDisposicaoNaSessao(estruturaSimulacao, disposicao)

    const resposta = simularRespostaBackend(lerPayloadDisposicaoDaSessao(), estruturaAtual)

    const raiz = resposta.estruturaSimulacao[0]
    expect(raiz).toMatchObject({ id: 31, snapshotId: 31, status: 'Atual' })
    const bemEstar = raiz.filhos.find((f) => f.sigla === 'BEM')
    const novo = bemEstar.filhos.find((f) => f.sigla === 'BEM-CUL')
    expect(novo).toMatchObject({
      status: 'Acrescimo',
      rotulo: 'Setor de Culinária Espacial - BEM-CUL',
    })
    expect(novo.id).toBe(proximoId(estruturaAtual))
    expect(novo.snapshotId).toBeUndefined()
    expect(resposta.disposicao).toEqual(disposicao)
  })
})
