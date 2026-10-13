import { STATUS } from './constantes'

// Operações sobre a estrutura aninhada da simulação: nós `unit` com `filhos`
// (alocações `role` sempre antes das unidades subordinadas). Unidades e
// alocações compartilham o mesmo espaço de ids.

export const mesmoId = (a, b) => String(a) === String(b)

export function buscarPorId(estrutura, id) {
  for (const item of estrutura || []) {
    if (mesmoId(item.id, id)) return item
    if (item.filhos?.length) {
      const encontrado = buscarPorId(item.filhos, id)
      if (encontrado) return encontrado
    }
  }
  return null
}

// Id do pai do item (null quando o item é raiz ou não existe).
export function encontrarPaiPorId(estrutura, id, pai = null) {
  for (const item of estrutura || []) {
    if (mesmoId(item.id, id)) return pai?.id ?? null
    if (item.filhos?.length) {
      const resultado = encontrarPaiPorId(item.filhos, id, item)
      if (resultado != null) return resultado
    }
  }
  return null
}

export function encontrarPai(estrutura, id) {
  const paiId = encontrarPaiPorId(estrutura, id)
  return paiId != null ? buscarPorId(estrutura, paiId) : null
}

export function removerDaEstrutura(estrutura, id) {
  for (let i = 0; i < estrutura.length; i++) {
    if (mesmoId(estrutura[i].id, id)) return estrutura.splice(i, 1)[0]
    if (estrutura[i].filhos) {
      const removido = removerDaEstrutura(estrutura[i].filhos, id)
      if (removido) return removido
    }
  }
  return null
}

// Alocações entram antes da primeira unidade; unidades vão para o final.
export function inserirOrdenado(lista, novoItem) {
  if (novoItem.tipo === 'role') {
    const indicePrimeiraUnidade = lista.findIndex((i) => i.tipo === 'unit')
    if (indicePrimeiraUnidade === -1) lista.push(novoItem)
    else lista.splice(indicePrimeiraUnidade, 0, novoItem)
  } else {
    lista.push(novoItem)
  }
}

// Move o item para o novo pai. Um item "Atual" movido passa a "Alteracao".
export function moverItem(estrutura, itemId, novoPaiId) {
  if (mesmoId(itemId, novoPaiId)) return false
  const novoPai = buscarPorId(estrutura, novoPaiId)
  if (!novoPai) return false

  const item = removerDaEstrutura(estrutura, itemId)
  if (!item) return false

  if (item.status === STATUS.ATUAL) item.status = STATUS.ALTERACAO
  if (!novoPai.filhos) novoPai.filhos = []
  inserirOrdenado(novoPai.filhos, item)
  return true
}

export function proximoId(estrutura) {
  let maior = 0
  const percorrer = (itens) => {
    ;(itens || []).forEach((item) => {
      const id = Number(item.id)
      if (!Number.isNaN(id) && id > maior) maior = id
      percorrer(item.filhos)
    })
  }
  percorrer(estrutura)
  return maior + 1
}

export function extrairAlocacoes(unidade) {
  return (unidade?.filhos || []).filter((filho) => filho.tipo === 'role')
}

// Unidades não extintas (destinos possíveis de uma transferência).
export function coletarUnidades(estrutura) {
  let unidades = []
  for (const no of estrutura || []) {
    if (no.tipo === 'unit' && no.status !== STATUS.EXTINCAO) {
      unidades.push({ id: no.id, nome: no.rotulo })
    }
    if (no.filhos?.length) unidades = unidades.concat(coletarUnidades(no.filhos))
  }
  return unidades
}

// Todos os itens (unidades e alocações) para a caixa de busca.
export function coletarTodos(estrutura) {
  const itens = []
  const percorrer = (nos) => {
    ;(nos || []).forEach((no) => {
      itens.push({ id: no.id, tipo: no.tipo, rotulo: no.rotulo })
      percorrer(no.filhos)
    })
  }
  percorrer(estrutura)
  return itens
}

export function montarRotuloUnidade({ nome, nomeUnidade, sigla }) {
  return [nomeUnidade || nome, sigla].filter(Boolean).join(' - ')
}

export function montarRotuloCargo({ simbolo, nomeCargo, sigla }) {
  return [simbolo, nomeCargo, sigla].filter(Boolean).join(' - ')
}

// Estrutura aninhada -> lista achatada de unidades (com suas alocações),
// que é a entrada do layout e da montagem dos nós do Vue Flow.
export function mapearEstruturaParaItens(estrutura) {
  const itens = []

  const processar = (no, parentId = null) => {
    const alocacoes = (no.filhos || []).filter((f) => f.tipo === 'role')
    const unidades = (no.filhos || []).filter((f) => f.tipo === 'unit')

    itens.push({
      id: String(no.id),
      parentId: parentId != null ? String(parentId) : null,
      tipo: no.tipo,
      rotulo: no.rotulo,
      status: no.status || STATUS.ATUAL,
      expandido: no.expandido,
      nome: no.nome || no.nomeUnidade,
      sigla: no.sigla,
      tipoUnidade: no.tipoUnidade,
      snapshotId: no.snapshotId,
      alocacoes: alocacoes.map((a) => ({
        id: a.id,
        status: a.status || STATUS.ATUAL,
        sigla: a.sigla,
        nomeCargo: a.nomeCargo,
        simbolo: a.simbolo,
      })),
    })

    unidades.forEach((u) => processar(u, no.id))
  }

  ;(estrutura || []).forEach((no) => processar(no, null))
  return itens
}

// Unidades marcadas como não expandidas na estrutura recebida.
export function idsRecolhidosDaEstrutura(estrutura) {
  const ids = new Set()
  const percorrer = (nos) => {
    nos.forEach((no) => {
      if (no.filhos?.length) {
        if (!no.expandido) ids.add(String(no.id))
        percorrer(no.filhos.filter((f) => f.tipo === 'unit'))
      }
    })
  }
  percorrer(estrutura || [])
  return ids
}

// Quantidade de alocações por símbolo, sem contar as extintas.
export function agruparAlocacoesPorSimbolo(alocacoes) {
  const agrupadas = {}
  alocacoes.forEach((alocacao) => {
    const simbolo = alocacao.simbolo || 'Sem símbolo'
    if (!agrupadas[simbolo]) {
      agrupadas[simbolo] = { count: 0, status: alocacao.status, nomeCargo: alocacao.nomeCargo }
    }
    if (alocacao.status !== STATUS.EXTINCAO) agrupadas[simbolo].count++
  })
  return agrupadas
}

export function clonar(valor) {
  return JSON.parse(JSON.stringify(valor))
}
