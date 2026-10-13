import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const pdfs = vi.hoisted(() => [])
vi.mock('jspdf', () => ({
  jsPDF: vi.fn(function (opcoes) {
    const pdf = {
      opcoes,
      text: vi.fn(),
      addImage: vi.fn(),
      addPage: vi.fn(),
      save: vi.fn(),
      setFontSize: vi.fn(),
      setTextColor: vi.fn(),
      setFont: vi.fn(),
      setDrawColor: vi.fn(),
      setLineWidth: vi.fn(),
      setFillColor: vi.fn(),
      line: vi.fn(),
      rect: vi.fn(),
      getTextWidth: vi.fn(() => 10),
      internal: {
        pageSize: { getWidth: () => opcoes.format[0], getHeight: () => opcoes.format[1] },
      },
    }
    pdfs.push(pdf)
    return pdf
  }),
}))

import { gerarJpg, gerarPdf, recortarFolhas } from './gerarArquivos'
import { RESERVA_CABECALHO_PX, RESERVA_LEGENDA_PX, RESERVA_MARGEM_PX } from './paginacao'

function criarOrganograma({ width = 2000, height = 600 } = {}) {
  return {
    obterDimensaoExportacao: vi.fn(() => ({ width, height })),
    capturarComoImagem: vi.fn(async (pixelRatio) => ({
      canvas: {
        width: width * pixelRatio,
        height: height * pixelRatio,
        toDataURL: vi.fn(() => 'data:image/jpeg;base64,'),
      },
      width,
      height,
      pixelRatio,
    })),
  }
}

const parametrosTresColunas = {
  papel: 'A4',
  orientacao: 'paisagem',
  escala: 100,
  folhas: { cols: 3, rows: 1 },
}

const cabecalho = { titulo: 'Organograma da Simulação', subtitulo: 'Subtítulo' }

describe('gerarArquivos', () => {
  beforeEach(() => {
    pdfs.length = 0
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: vi.fn() })
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Deve descartar folhas da grade que não recebem nenhum pixel do organograma', () => {
    const canvas = { width: 1000, height: 300 }

    expect(recortarFolhas(canvas, { cols: 3, rows: 1 }, 600, 300)).toEqual([
      { sx: 0, sy: 0, sw: 600, sh: 300 },
      { sx: 600, sy: 0, sw: 400, sh: 300 },
    ])
  })

  it('Deve desenhar o cabeçalho em todas as folhas do PDF', async () => {
    const organograma = criarOrganograma()

    const folhas = await gerarPdf({ organograma, parametros: parametrosTresColunas, cabecalho })

    const [pdf] = pdfs
    expect(folhas).toBe(2)
    expect(pdf.addPage).toHaveBeenCalledTimes(1)
    const titulos = pdf.text.mock.calls.filter(([texto]) => texto === cabecalho.titulo)
    expect(titulos).toHaveLength(2)
    expect(pdf.save).toHaveBeenCalledWith('organograma.pdf')
  })

  it('Deve posicionar o organograma abaixo do cabeçalho em todas as folhas', async () => {
    const organograma = criarOrganograma()

    await gerarPdf({ organograma, parametros: parametrosTresColunas, cabecalho })

    const posicoesY = pdfs[0].addImage.mock.calls.map(([, , , y]) => y)
    expect(posicoesY).toEqual([
      RESERVA_CABECALHO_PX + RESERVA_MARGEM_PX,
      RESERVA_CABECALHO_PX + RESERVA_MARGEM_PX,
    ])
  })

  it('Deve repetir a legenda em todas as folhas e reservar o espaço dela', async () => {
    const organograma = criarOrganograma()
    const legenda = [{ rotulo: 'Acréscimo', cor: '#28a745' }]

    await gerarPdf({ organograma, parametros: parametrosTresColunas, cabecalho, legenda })

    const [pdf] = pdfs
    expect(pdf.text.mock.calls.filter(([texto]) => texto === 'Acréscimo')).toHaveLength(2)
    const posicoesY = pdf.addImage.mock.calls.map(([, , , y]) => y)
    expect(new Set(posicoesY)).toEqual(
      new Set([RESERVA_CABECALHO_PX + RESERVA_LEGENDA_PX + RESERVA_MARGEM_PX]),
    )
  })

  it('Deve ocupar toda a largura útil da folha quando a escala preenche a página', async () => {
    const organograma = criarOrganograma({ width: 500, height: 200 })
    const pdfLarguraFolha = 297 / (25.4 / 96)
    const margemLateral = 15 / (25.4 / 96)
    const areaUtil = pdfLarguraFolha - margemLateral * 2

    await gerarPdf({
      organograma,
      parametros: {
        ...parametrosTresColunas,
        escala: (areaUtil / 500) * 100,
        folhas: { cols: 1, rows: 1 },
      },
      cabecalho,
    })

    const [, , x, , largura] = pdfs[0].addImage.mock.calls[0]
    expect(x).toBeCloseTo(margemLateral)
    expect(largura).toBeCloseTo(areaUtil)
  })

  it('Deve recusar exportar um organograma sem dimensões', async () => {
    const organograma = criarOrganograma({ width: 0, height: 0 })

    await expect(
      gerarPdf({ organograma, parametros: parametrosTresColunas, cabecalho }),
    ).rejects.toThrow('Dimensões inválidas do organograma: 0x0')
    expect(organograma.capturarComoImagem).not.toHaveBeenCalled()
  })

  it('Deve baixar o JPG reduzindo a densidade de captura conforme a escala', async () => {
    const organograma = criarOrganograma()
    const clicar = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    await gerarJpg({ organograma, parametros: { escala: 50 } })

    expect(organograma.capturarComoImagem).toHaveBeenCalledWith(2.5)
    expect(clicar).toHaveBeenCalledTimes(1)
  })
})
