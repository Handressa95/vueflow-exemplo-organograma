import { describe, it, expect } from 'vitest'
import { obterCaminhoConexaoFlutuante } from './conexaoFlutuante'

const criarNo = (x, y, width = 240, height = 110) => ({
  computedPosition: { x, y },
  dimensions: { width, height },
})

// O "d" do path sempre começa em "M sourceX,sourceY" e termina em
// targetX,targetY: indicam por onde a conexão saiu e entrou.
const primeiroPonto = (caminho) => {
  const [, coords] = caminho.match(/^M\s*([\d.\s,-]+)/)
  const [x, y] = coords
    .trim()
    .split(/[\s,]+/)
    .map(Number)
  return { x, y }
}

const ultimoPonto = (caminho) => {
  const numeros = caminho.match(/-?\d+(?:\.\d+)?/g).map(Number)
  const [x, y] = numeros.slice(-2)
  return { x, y }
}

const pontos = (caminho) => {
  const numeros = caminho.match(/-?\d+(?:\.\d+)?/g).map(Number)
  const lista = []
  for (let i = 0; i < numeros.length; i += 2) lista.push({ x: numeros[i], y: numeros[i + 1] })
  return lista
}

describe('conexaoFlutuante', () => {
  it('Deve retornar string vazia quando um nó não existir ou não tiver dimensões', () => {
    expect(obterCaminhoConexaoFlutuante(null, criarNo(0, 0))).toBe('')
    expect(obterCaminhoConexaoFlutuante(criarNo(0, 0), criarNo(0, 0, 0, 0))).toBe('')
  })

  it('Deve sair pela base do pai e entrar pelo topo do filho no layout padrão', () => {
    const caminho = obterCaminhoConexaoFlutuante(criarNo(0, 0), criarNo(0, 210))

    expect(primeiroPonto(caminho)).toEqual({ x: 120, y: 110 })
    expect(ultimoPonto(caminho)).toEqual({ x: 120, y: 210 })
  })

  it('Deve compartilhar a altura do barramento entre irmãos à esquerda e à direita', () => {
    const pai = criarNo(300, 0)
    const esquerda = obterCaminhoConexaoFlutuante(pai, criarNo(0, 140))
    const direita = obterCaminhoConexaoFlutuante(pai, criarNo(600, 140))

    expect(pontos(esquerda)).toContainEqual({ x: 420, y: 125 })
    expect(pontos(direita)).toContainEqual({ x: 420, y: 125 })
  })

  it('Deve entrar pela lateral do filho arrastado para fora do eixo quando não cabe a dobra', () => {
    const caminho = obterCaminhoConexaoFlutuante(criarNo(0, 0), criarNo(600, 130), {
      destinoMovido: true,
    })

    expect(ultimoPonto(caminho)).toEqual({ x: 600, y: 185 })
  })

  it('Deve entrar pelo topo do filho próximo quando ele não foi arrastado', () => {
    const caminho = obterCaminhoConexaoFlutuante(criarNo(0, 0), criarNo(600, 130))

    expect(ultimoPonto(caminho)).toEqual({ x: 720, y: 130 })
  })

  it('Deve conectar pelas laterais quando as caixas estão na mesma linha', () => {
    const caminho = obterCaminhoConexaoFlutuante(criarNo(0, 0), criarNo(400, 10))

    expect(primeiroPonto(caminho)).toEqual({ x: 240, y: 60 })
    expect(ultimoPonto(caminho)).toEqual({ x: 400, y: 60 })
  })
})
