// Linhas-guia (horizontal/vertical) exibidas ao arrastar um nó, e a posição
// de encaixe (snap) quando o nó arrastado fica a menos de `distancia` px da
// borda de outro nó. Baseado no exemplo oficial "Helper Lines" do Vue Flow.
export function obterLinhasAuxiliares(mudanca, nos, distancia = 5) {
  const resultadoPadrao = {
    horizontal: undefined,
    vertical: undefined,
    posicaoEncaixe: { x: undefined, y: undefined },
  }

  const noA = nos.find((no) => no.id === mudanca.id)
  if (!noA || !mudanca.position) return resultadoPadrao

  const limitesNoA = {
    left: mudanca.position.x,
    right: mudanca.position.x + (noA.dimensions?.width ?? 0),
    top: mudanca.position.y,
    bottom: mudanca.position.y + (noA.dimensions?.height ?? 0),
    width: noA.dimensions?.width ?? 0,
    height: noA.dimensions?.height ?? 0,
  }

  let distanciaHorizontal = distancia
  let distanciaVertical = distancia

  return nos
    .filter((no) => no.id !== noA.id)
    .reduce((resultado, noB) => {
      const limitesNoB = {
        left: noB.position.x,
        right: noB.position.x + (noB.dimensions?.width ?? 0),
        top: noB.position.y,
        bottom: noB.position.y + (noB.dimensions?.height ?? 0),
      }

      // Esquerda de A alinhada à esquerda de B
      const distanciaEsquerdaEsquerda = Math.abs(limitesNoA.left - limitesNoB.left)
      if (distanciaEsquerdaEsquerda < distanciaVertical) {
        resultado.posicaoEncaixe.x = limitesNoB.left
        resultado.vertical = limitesNoB.left
        distanciaVertical = distanciaEsquerdaEsquerda
      }

      // Direita de A alinhada à direita de B
      const distanciaDireitaDireita = Math.abs(limitesNoA.right - limitesNoB.right)
      if (distanciaDireitaDireita < distanciaVertical) {
        resultado.posicaoEncaixe.x = limitesNoB.right - limitesNoA.width
        resultado.vertical = limitesNoB.right
        distanciaVertical = distanciaDireitaDireita
      }

      // Esquerda de A alinhada à direita de B
      const distanciaEsquerdaDireita = Math.abs(limitesNoA.left - limitesNoB.right)
      if (distanciaEsquerdaDireita < distanciaVertical) {
        resultado.posicaoEncaixe.x = limitesNoB.right
        resultado.vertical = limitesNoB.right
        distanciaVertical = distanciaEsquerdaDireita
      }

      // Direita de A alinhada à esquerda de B
      const distanciaDireitaEsquerda = Math.abs(limitesNoA.right - limitesNoB.left)
      if (distanciaDireitaEsquerda < distanciaVertical) {
        resultado.posicaoEncaixe.x = limitesNoB.left - limitesNoA.width
        resultado.vertical = limitesNoB.left
        distanciaVertical = distanciaDireitaEsquerda
      }

      // Topo de A alinhado ao topo de B
      const distanciaTopoTopo = Math.abs(limitesNoA.top - limitesNoB.top)
      if (distanciaTopoTopo < distanciaHorizontal) {
        resultado.posicaoEncaixe.y = limitesNoB.top
        resultado.horizontal = limitesNoB.top
        distanciaHorizontal = distanciaTopoTopo
      }

      // Base de A alinhada ao topo de B
      const distanciaBaseTopo = Math.abs(limitesNoA.bottom - limitesNoB.top)
      if (distanciaBaseTopo < distanciaHorizontal) {
        resultado.posicaoEncaixe.y = limitesNoB.top - limitesNoA.height
        resultado.horizontal = limitesNoB.top
        distanciaHorizontal = distanciaBaseTopo
      }

      // Base de A alinhada à base de B
      const distanciaBaseBase = Math.abs(limitesNoA.bottom - limitesNoB.bottom)
      if (distanciaBaseBase < distanciaHorizontal) {
        resultado.posicaoEncaixe.y = limitesNoB.bottom - limitesNoA.height
        resultado.horizontal = limitesNoB.bottom
        distanciaHorizontal = distanciaBaseBase
      }

      // Topo de A alinhado à base de B
      const distanciaTopoBase = Math.abs(limitesNoA.top - limitesNoB.bottom)
      if (distanciaTopoBase < distanciaHorizontal) {
        resultado.posicaoEncaixe.y = limitesNoB.bottom
        resultado.horizontal = limitesNoB.bottom
        distanciaHorizontal = distanciaTopoBase
      }

      return resultado
    }, resultadoPadrao)
}
