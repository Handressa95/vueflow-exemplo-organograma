import { describe, it, expect } from 'vitest'
import {
  calcularPosicoesArvore,
  idsDescendentes,
  idsRecolhidosPadrao,
  itensVisiveis,
} from './layoutArvore'

const itens = [
  { id: '1', parentId: null },
  { id: '2', parentId: '1' },
  { id: '3', parentId: '1' },
  { id: '4', parentId: '2' },
  { id: '5', parentId: '4' },
]

describe('layoutArvore', () => {
  it('Deve centralizar o pai sobre o primeiro e o último filho', () => {
    const posicoes = calcularPosicoesArvore(itens)

    expect(posicoes.get('2')).toEqual({ x: 0, y: 210 })
    expect(posicoes.get('3')).toEqual({ x: 280, y: 210 })
    expect(posicoes.get('1')).toEqual({ x: 140, y: 0 })
  })

  it('Deve recolher inicialmente as unidades com filhos a partir do último nível visível', () => {
    expect([...idsRecolhidosPadrao(itens)]).toEqual(['2', '4'])
  })

  it('Deve omitir os descendentes de unidades recolhidas', () => {
    const visiveis = itensVisiveis(itens, new Set(['2']))

    expect(visiveis.map((i) => i.id)).toEqual(['1', '2', '3'])
  })

  it('Deve listar todos os descendentes da unidade', () => {
    expect(idsDescendentes(itens, '2').sort()).toEqual(['4', '5'])
  })
})
