import { jsPDF } from 'jspdf'
import {
  MARGEM_MM,
  PIXEL_RATIO_JPG,
  PIXEL_RATIO_PDF,
  RESERVA_CABECALHO_PX,
  RESERVA_LEGENDA_PX,
  RESERVA_MARGEM_PX,
  RESERVA_RODAPE_PX,
  calcularPixelRatioSeguro,
  mmParaPx,
  papelNaOrientacao,
} from './paginacao'

// `organograma` é o componente Organograma.vue (ou qualquer objeto com
// obterDimensaoExportacao() e capturarComoImagem(pixelRatio)).

function dimensaoValida(organograma) {
  const { width, height } = organograma.obterDimensaoExportacao() || {}
  if (!width || !height || width <= 0 || height <= 0) {
    throw new Error(`Dimensões inválidas do organograma: ${width}x${height}`)
  }
  return { width, height }
}

// Mesmo pixelRatio que gerarPdf usará; o modal precisa dele para prever a
// redução do canvas acima do teto do html-to-image.
export function calcularPixelRatioPdf(organograma) {
  const { width, height } = organograma.obterDimensaoExportacao() || {}
  if (!width || !height) return null
  return calcularPixelRatioSeguro(width, height, PIXEL_RATIO_PDF)
}

function hexParaRgb(hex) {
  const valor = parseInt(hex.replace('#', ''), 16)
  return [(valor >> 16) & 255, (valor >> 8) & 255, valor & 255]
}

function desenharCabecalho(pdf, larguraFolha, { titulo = '', subtitulo = '' } = {}) {
  const margem = RESERVA_MARGEM_PX
  const centroX = larguraFolha / 2

  pdf.setFontSize(14)
  pdf.setTextColor(0, 0, 0)
  pdf.setFont('helvetica', 'bold')
  pdf.text(titulo, centroX, margem + 32, { align: 'center' })

  if (subtitulo) {
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(95, 107, 118)
    pdf.text(subtitulo, centroX, margem + 52, { align: 'center' })
  }

  pdf.setDrawColor(207, 214, 222)
  pdf.setLineWidth(1)
  pdf.line(margem, margem + 75, larguraFolha - margem, margem + 75)
}

function desenharLegenda(pdf, legenda, y) {
  let x = RESERVA_MARGEM_PX
  pdf.setFontSize(9)
  legenda.forEach(({ rotulo, cor }) => {
    const [r, g, b] = hexParaRgb(cor)
    pdf.setFillColor(r, g, b)
    pdf.rect(x, y - 7, 8, 8, 'F')
    pdf.setTextColor(60, 60, 60)
    pdf.setFont('helvetica', 'normal')
    pdf.text(rotulo, x + 12, y)
    x += 12 + pdf.getTextWidth(rotulo) + 18
  })
}

function desenharRodape(pdf, larguraFolha, alturaFolha, { rotulo = '', descricao = '' } = {}) {
  const margem = RESERVA_MARGEM_PX
  const rodapeY = alturaFolha - 15

  pdf.setDrawColor(207, 214, 222)
  pdf.setLineWidth(1)
  pdf.line(margem, rodapeY - 25, larguraFolha - margem, rodapeY - 25)

  pdf.setFontSize(9)
  pdf.setTextColor(100, 100, 100)
  if (rotulo) {
    pdf.setFont('helvetica', 'bold')
    pdf.text(rotulo, margem, rodapeY - 10)
  }
  if (descricao) {
    pdf.setFont('helvetica', 'normal')
    pdf.text(descricao, margem, rodapeY)
  }

  const agora = new Date()
  const data = agora.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const hora = agora.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const dataHora = `${data} às ${hora}`
  const rotuloDataHora = 'Data/Hora: '

  pdf.setFont('helvetica', 'normal')
  const larguraRotulo = pdf.getTextWidth(rotuloDataHora)
  pdf.setFont('helvetica', 'bold')
  const larguraDataHora = pdf.getTextWidth(dataHora)

  pdf.setFont('helvetica', 'normal')
  pdf.text(rotuloDataHora, larguraFolha - margem - larguraRotulo - larguraDataHora, rodapeY)
  pdf.setFont('helvetica', 'bold')
  pdf.text(dataHora, larguraFolha - margem - larguraDataHora, rodapeY)
}

// Fatias (px do canvas) de cada folha da grade, linha a linha. Folhas que
// não recebem nenhum pixel do organograma (arredondamentos entre a grade em
// mm e o canvas em px) são descartadas — mesma regra da pré-visualização.
export function recortarFolhas(canvas, { cols, rows }, larguraFatia, alturaFatia) {
  const recortes = []
  for (let linha = 0; linha < rows; linha += 1) {
    for (let coluna = 0; coluna < cols; coluna += 1) {
      const sx = coluna * larguraFatia
      const sy = linha * alturaFatia
      const sw = Math.min(larguraFatia, canvas.width - sx)
      const sh = Math.min(alturaFatia, canvas.height - sy)
      if (sw >= 1 && sh >= 1) recortes.push({ sx, sy, sw, sh })
    }
  }
  return recortes
}

// PDF paginado em folhas físicas (A4/A3/A2), com a escala e a grade
// (cols x rows) calculadas pelo modal. Toda folha recebe cabeçalho, legenda
// (quando houver) e rodapé. Devolve a quantidade de folhas geradas.
export async function gerarPdf({
  organograma,
  parametros,
  cabecalho,
  rodape,
  legenda = [],
  nomeArquivo = 'organograma.pdf',
}) {
  const { width, height } = dimensaoValida(organograma)
  const { papel, orientacao, escala, folhas } = parametros
  const papelMm = papelNaOrientacao(papel, orientacao)
  const alturaLegenda = legenda.length ? RESERVA_LEGENDA_PX : 0

  const larguraFolhaPx = mmParaPx(papelMm.width)
  const alturaFolhaPx = mmParaPx(papelMm.height)
  // A margem lateral física (a mesma da área útil do modal) é que posiciona
  // o conteúdo; a margem interna do cabeçalho deixaria uma faixa à direita.
  const margemLateralPx = mmParaPx(MARGEM_MM)
  const areaLarguraPx = larguraFolhaPx - margemLateralPx * 2
  const areaAlturaPx =
    alturaFolhaPx - RESERVA_CABECALHO_PX - alturaLegenda - RESERVA_RODAPE_PX - RESERVA_MARGEM_PX * 2
  const orientacaoJsPdf = orientacao === 'paisagem' ? 'landscape' : 'portrait'

  const pdf = new jsPDF({
    orientation: orientacaoJsPdf,
    unit: 'px',
    format: [larguraFolhaPx, alturaFolhaPx],
  })

  // Captura uma única vez, na resolução final; cada folha recorta 1:1 a sua
  // fatia (sem reamostragem).
  const fatorEscala = Math.max(escala, 1) / 100
  const pixelRatio = calcularPixelRatioSeguro(width, height, PIXEL_RATIO_PDF)
  const { canvas } = await organograma.capturarComoImagem(pixelRatio)

  const recortes = recortarFolhas(
    canvas,
    folhas,
    (areaLarguraPx / fatorEscala) * pixelRatio,
    (areaAlturaPx / fatorEscala) * pixelRatio,
  )

  recortes.forEach(({ sx, sy, sw, sh }, indice) => {
    if (indice > 0) pdf.addPage([larguraFolhaPx, alturaFolhaPx], orientacaoJsPdf)

    const larguraPagina = pdf.internal.pageSize.getWidth()
    const alturaPagina = pdf.internal.pageSize.getHeight()
    desenharCabecalho(pdf, larguraPagina, cabecalho)
    if (alturaLegenda) desenharLegenda(pdf, legenda, RESERVA_MARGEM_PX + 75 + 16)

    const fatia = document.createElement('canvas')
    fatia.width = Math.max(1, Math.round(sw))
    fatia.height = Math.max(1, Math.round(sh))
    fatia.getContext('2d').drawImage(canvas, sx, sy, sw, sh, 0, 0, fatia.width, fatia.height)

    // Centraliza na horizontal (só muda algo na última coluna, mais estreita);
    // na vertical o conteúdo fica sempre no topo, logo abaixo do cabeçalho.
    const larguraDestino = (sw / pixelRatio) * fatorEscala
    const alturaDestino = (sh / pixelRatio) * fatorEscala
    const x = margemLateralPx + Math.max(0, (areaLarguraPx - larguraDestino) / 2)
    const y = RESERVA_CABECALHO_PX + alturaLegenda + RESERVA_MARGEM_PX
    pdf.addImage(fatia.toDataURL('image/png'), 'PNG', x, y, larguraDestino, alturaDestino)

    desenharRodape(pdf, larguraPagina, alturaPagina, rodape)
  })

  pdf.save(nomeArquivo)
  return recortes.length
}

// JPG é um arquivo único (sem paginação): a escala do modal só reduz a
// densidade de captura.
export async function gerarJpg({ organograma, parametros, nomeArquivo = 'organograma.jpg' }) {
  const { width, height } = dimensaoValida(organograma)
  const pixelRatioBase = calcularPixelRatioSeguro(width, height, PIXEL_RATIO_JPG)
  const pixelRatio = parametros
    ? Math.max(1, pixelRatioBase * (parametros.escala / 100))
    : pixelRatioBase
  const { canvas } = await organograma.capturarComoImagem(pixelRatio)

  const link = document.createElement('a')
  link.download = nomeArquivo
  link.href = canvas.toDataURL('image/jpeg', 0.95)
  link.click()
}
