// Medidas compartilhadas pelo modal de exportação (pré-visualização) e pela
// geração do PDF/JPG: as duas pontas precisam usar exatamente os mesmos
// valores para que a pré-visualização mostre as mesmas folhas do arquivo.

// 1 px CSS a 96 dpi em milímetros físicos.
export const MM_POR_PX = 25.4 / 96

export const PAPEL_TAMANHOS_MM = {
  A4: { width: 210, height: 297 },
  A3: { width: 297, height: 420 },
  A2: { width: 420, height: 594 },
}

// Margem física (mm) nas laterais de cada folha.
export const MARGEM_MM = 15

// Espaço reservado em toda folha para cabeçalho, legenda, rodapé e margens
// internas (px lógicos do jsPDF).
export const RESERVA_CABECALHO_PX = 100
export const RESERVA_RODAPE_PX = 40
export const RESERVA_LEGENDA_PX = 24
export const RESERVA_MARGEM_PX = 20

// Borda em branco (espaço do fluxo) que a captura reserva ao redor das
// caixas, para não cortar bordas e sombras. Como essa faixa é sempre vazia,
// uma folha que receberia só ela é descartada.
export const CAPTURA_PADDING_PX = 40

// Densidade de captura pedida para o PDF e para o JPG.
export const PIXEL_RATIO_PDF = 4
export const PIXEL_RATIO_JPG = 5

// Teto de canvas dos navegadores.
const LIMITE_CANVAS_NAVEGADOR_PX = 32767

// Teto de canvas do html-to-image (`checkCanvasDimensions`): acima dele a
// captura é encolhida proporcionalmente, mas o PDF continua fatiando pelo
// pixelRatio pedido — cada folha passa a receber mais organograma.
export const LIMITE_CANVAS_CAPTURA_PX = 16384

export function mmParaPx(mm) {
  return mm / MM_POR_PX
}

// Papel na orientação escolhida, em mm.
export function papelNaOrientacao(papel, orientacao) {
  const base = PAPEL_TAMANHOS_MM[papel] || PAPEL_TAMANHOS_MM.A4
  return orientacao === 'paisagem'
    ? { width: base.height, height: base.width }
    : { width: base.width, height: base.height }
}

// Área útil (mm) de uma folha para o organograma, descontando margens
// laterais e a reserva de cabeçalho/legenda/rodapé.
export function areaConteudoMm(papelMm, mostrarLegenda) {
  const reservaAlturaPx =
    RESERVA_CABECALHO_PX +
    (mostrarLegenda ? RESERVA_LEGENDA_PX : 0) +
    RESERVA_RODAPE_PX +
    RESERVA_MARGEM_PX * 2
  return {
    width: Math.max(papelMm.width - MARGEM_MM * 2, 10),
    height: Math.max(papelMm.height - reservaAlturaPx * MM_POR_PX, 10),
  }
}

// Maior pixelRatio possível sem estourar o teto de canvas do navegador, com
// margem de segurança.
export function calcularPixelRatioSeguro(width, height, pixelRatioDesejado) {
  const larguraFinal = width * pixelRatioDesejado
  const alturaFinal = height * pixelRatioDesejado
  if (larguraFinal <= LIMITE_CANVAS_NAVEGADOR_PX && alturaFinal <= LIMITE_CANVAS_NAVEGADOR_PX) {
    return pixelRatioDesejado
  }

  const maximo = Math.min(LIMITE_CANVAS_NAVEGADOR_PX / width, LIMITE_CANVAS_NAVEGADOR_PX / height)
  const escala = Math.max(1.5, Math.floor(maximo * 0.85 * 10) / 10)
  if (width * escala > LIMITE_CANVAS_NAVEGADOR_PX || height * escala > LIMITE_CANVAS_NAVEGADOR_PX) {
    return Math.max(1, maximo * 0.95)
  }
  return escala
}
