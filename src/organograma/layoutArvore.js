import {
  ALTURA_NO,
  ESPACO_HORIZONTAL,
  ESPACO_VERTICAL,
  LARGURA_NO,
  NIVEIS_VISIVEIS_INICIAIS,
} from './constantes'

// Funções puras sobre a lista "achatada" de itens ({ id, parentId, ... })
// usada para montar os nós do Vue Flow.

export function agruparPorPai(itens) {
  const filhosPorPai = new Map()
  itens.forEach((item) => {
    const chave = item.parentId || ''
    if (!filhosPorPai.has(chave)) filhosPorPai.set(chave, [])
    filhosPorPai.get(chave).push(item)
  })
  return filhosPorPai
}

// Profundidade de cada item na árvore, a partir das raízes (nível 0).
export function calcularProfundidades(itens) {
  const filhosPorPai = agruparPorPai(itens)
  const profundidades = new Map()

  const percorrer = (chavePai, profundidade) => {
    ;(filhosPorPai.get(chavePai) || []).forEach((filho) => {
      profundidades.set(filho.id, profundidade)
      percorrer(filho.id, profundidade + 1)
    })
  }

  percorrer('', 0)
  return profundidades
}

// Recolhimento inicial: unidades com filhos a partir do último nível
// visível já nascem recolhidas, escondendo os níveis seguintes.
export function idsRecolhidosPadrao(itens, niveisVisiveis = NIVEIS_VISIVEIS_INICIAIS) {
  const filhosPorPai = agruparPorPai(itens)
  const profundidades = calcularProfundidades(itens)
  return new Set(
    itens
      .filter(
        (item) => filhosPorPai.has(item.id) && profundidades.get(item.id) >= niveisVisiveis - 1,
      )
      .map((item) => item.id),
  )
}

// Layout automático em árvore: folhas lado a lado e cada pai centralizado
// sobre o primeiro e o último filho.
export function calcularPosicoesArvore(itens) {
  const filhosPorPai = agruparPorPai(itens)
  const posicoes = new Map()
  let cursor = 0

  const posicionar = (item, profundidade) => {
    const filhos = filhosPorPai.get(item.id) || []
    let x
    if (filhos.length === 0) {
      x = cursor * (LARGURA_NO + ESPACO_HORIZONTAL)
      cursor++
    } else {
      const centros = filhos.map((filho) => posicionar(filho, profundidade + 1))
      x = (centros[0] + centros[centros.length - 1]) / 2
    }
    posicoes.set(item.id, { x, y: profundidade * (ALTURA_NO + ESPACO_VERTICAL) })
    return x
  }

  ;(filhosPorPai.get('') || []).forEach((raiz) => posicionar(raiz, 0))
  return posicoes
}

// Itens visíveis em pré-ordem (pais antes dos filhos): só desce para os
// filhos de um item que não esteja recolhido.
export function itensVisiveis(itens, idsRecolhidos) {
  const filhosPorPai = agruparPorPai(itens)
  const resultado = []
  const percorrer = (chavePai) => {
    ;(filhosPorPai.get(chavePai) || []).forEach((filho) => {
      resultado.push(filho)
      if (!idsRecolhidos.has(filho.id)) percorrer(filho.id)
    })
  }
  percorrer('')
  return resultado
}

export function idsDescendentes(itens, id) {
  const resultado = []
  const pilha = [id]
  while (pilha.length) {
    const atual = pilha.pop()
    itens.forEach((item) => {
      if (item.parentId === atual) {
        resultado.push(item.id)
        pilha.push(item.id)
      }
    })
  }
  return resultado
}

// Retângulos sobrepostos ou a menos de `folga` px na horizontal.
export function colide(a, b, folga) {
  return (
    a.x < b.x + b.largura + folga &&
    a.x + a.largura + folga > b.x &&
    a.y < b.y + b.altura &&
    a.y + a.altura > b.y
  )
}
