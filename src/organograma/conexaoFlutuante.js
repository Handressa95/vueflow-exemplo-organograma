import { Position, getSmoothStepPath } from '@vue-flow/core'

// Calcula o caminho (smoothstep) entre dois nós escolhendo dinamicamente o
// lado de saída/entrada mais adequado, em vez de um lado fixo. É o que faz a
// ligação se ajustar sozinha quando um nó é arrastado, sem pontos de dobra
// manuais.
function obterRetangulo(no) {
  const { x, y } = no.computedPosition
  const { width, height } = no.dimensions
  return {
    left: x,
    right: x + width,
    top: y,
    bottom: y + height,
    centerX: x + width / 2,
    centerY: y + height / 2,
  }
}

// Duas caixas estão "na mesma linha" quando suas faixas verticais se
// sobrepõem — só nesse caso (ex.: filho arrastado ao lado do pai) a conexão
// vira lateral. Como o layout automático sempre separa as linhas, isso só
// ocorre quando um nó foi arrastado manualmente.
function estaoNaMesmaLinha(retA, retB) {
  return retA.top < retB.bottom && retB.top < retA.bottom
}

// Espaço vertical mínimo entre a base do nó de cima e o topo do nó de baixo
// para que a conexão desça, dobre na horizontal e entre por cima sem formar
// um desvio apertado em "Z".
const ESPACO_MINIMO_DOBRA = 40

// Afastamento padrão (offset) do getSmoothStepPath antes da primeira dobra.
// Entre uma base e um topo, a lib só traça a dobra única na altura média
// (barramento reto compartilhado pelos irmãos) quando o espaço vertical é
// maior que 2 × offset; abaixo disso ela desvia em "Z" pelo meio horizontal
// entre as caixas. Por isso, com pouco espaço, o afastamento é reduzido.
const AFASTAMENTO_PADRAO = 20

function calcularAfastamento(saida, entrada) {
  const verticalEntreBaseETopo =
    (saida.position === Position.Bottom && entrada.position === Position.Top) ||
    (saida.position === Position.Top && entrada.position === Position.Bottom)
  if (!verticalEntreBaseETopo) return AFASTAMENTO_PADRAO
  return Math.min(AFASTAMENTO_PADRAO, Math.abs(entrada.y - saida.y) / 4)
}

// Conexão entre um nó de cima e um de baixo que não estão na mesma linha. O
// de cima sai reto por baixo (tronco vertical) e o de baixo entra por cima,
// centralizado — efeito de "galho" da árvore. Só quando o nó de baixo foi
// arrastado manualmente para fora do eixo do tronco E ficou perto demais da
// linha do pai para caber a dobra, a entrada vira lateral.
function calcularConexaoVertical(retSuperior, retInferior, inferiorMovido) {
  const saida = { x: retSuperior.centerX, y: retSuperior.bottom, position: Position.Bottom }

  if (inferiorMovido) {
    const troncoAlinhado =
      retSuperior.centerX >= retInferior.left && retSuperior.centerX <= retInferior.right
    const cabeDobra = retInferior.top - retSuperior.bottom >= ESPACO_MINIMO_DOBRA
    if (!troncoAlinhado && !cabeDobra) {
      const entrada =
        retSuperior.centerX < retInferior.left
          ? { x: retInferior.left, y: retInferior.centerY, position: Position.Left }
          : { x: retInferior.right, y: retInferior.centerY, position: Position.Right }
      return { saida, entrada }
    }
  }

  return { saida, entrada: { x: retInferior.centerX, y: retInferior.top, position: Position.Top } }
}

// `opcoes.origemMovida` / `opcoes.destinoMovido`: o nó foi arrastado
// manualmente (posição gravada com `arrastada`), o que habilita a entrada
// lateral descrita acima.
export function obterCaminhoConexaoFlutuante(noOrigem, noDestino, opcoes = {}) {
  if (
    !noOrigem?.dimensions?.width ||
    !noOrigem?.dimensions?.height ||
    !noDestino?.dimensions?.width ||
    !noDestino?.dimensions?.height
  ) {
    return ''
  }

  const { origemMovida = false, destinoMovido = false } = opcoes

  const retOrigem = obterRetangulo(noOrigem)
  const retDestino = obterRetangulo(noDestino)

  let sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition
  let offset = AFASTAMENTO_PADRAO

  if (estaoNaMesmaLinha(retOrigem, retDestino)) {
    const topoSobreposicao = Math.max(retOrigem.top, retDestino.top)
    const baseSobreposicao = Math.min(retOrigem.bottom, retDestino.bottom)
    const y = (topoSobreposicao + baseSobreposicao) / 2

    if (retOrigem.centerX <= retDestino.centerX) {
      sourceX = retOrigem.right
      sourcePosition = Position.Right
      targetX = retDestino.left
      targetPosition = Position.Left
    } else {
      sourceX = retOrigem.left
      sourcePosition = Position.Left
      targetX = retDestino.right
      targetPosition = Position.Right
    }
    sourceY = y
    targetY = y
  } else {
    const origemEhSuperior = retOrigem.centerY <= retDestino.centerY
    const retSuperior = origemEhSuperior ? retOrigem : retDestino
    const retInferior = origemEhSuperior ? retDestino : retOrigem
    const inferiorMovido = origemEhSuperior ? destinoMovido : origemMovida

    const { saida, entrada } = calcularConexaoVertical(retSuperior, retInferior, inferiorMovido)
    const pontoOrigem = origemEhSuperior ? saida : entrada
    const pontoDestino = origemEhSuperior ? entrada : saida

    sourceX = pontoOrigem.x
    sourceY = pontoOrigem.y
    sourcePosition = pontoOrigem.position
    targetX = pontoDestino.x
    targetY = pontoDestino.y
    targetPosition = pontoDestino.position
    offset = calcularAfastamento(saida, entrada)
  }

  const [caminho] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
    offset,
  })

  return caminho
}
