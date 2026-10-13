<template>
  <div
    v-if="visivel"
    class="modal fade show d-block"
    tabindex="-1"
    style="background: rgba(0, 0, 0, 0.5)"
  >
    <div class="modal-dialog modal-dialog-centered modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Exportar organograma</h5>
          <button type="button" class="btn-close" @click="fechar"></button>
        </div>

        <div class="modal-body">
          <div class="row g-4">
            <div class="col-12 col-lg-5">
              <div class="row g-3">
                <div class="col-6">
                  <label for="exportarPapel" class="form-label">Tamanho do papel</label>
                  <select id="exportarPapel" v-model="papel" class="form-select">
                    <option value="A4">A4</option>
                    <option value="A3">A3</option>
                    <option value="A2">A2</option>
                  </select>
                </div>
                <div class="col-6">
                  <label for="exportarOrientacao" class="form-label">Orientação</label>
                  <select id="exportarOrientacao" v-model="orientacao" class="form-select">
                    <option value="automatica">Automática</option>
                    <option value="retrato">Retrato</option>
                    <option value="paisagem">Paisagem</option>
                  </select>
                </div>
              </div>

              <fieldset class="mt-3">
                <legend class="form-label h6">Modo de ajuste</legend>
                <div class="form-check">
                  <input
                    id="modoAutomatico"
                    v-model="modoAjuste"
                    class="form-check-input"
                    type="radio"
                    value="automatico"
                  />
                  <label class="form-check-label" for="modoAutomatico"
                    >Melhor ajuste automático</label
                  >
                </div>
                <div v-if="formato !== 'jpg'" class="form-check">
                  <input
                    id="modoPiso"
                    v-model="modoAjuste"
                    class="form-check-input"
                    type="radio"
                    value="pisoLegibilidade"
                  />
                  <label class="form-check-label" for="modoPiso">
                    Ajustar à página com piso de legibilidade
                  </label>
                </div>
                <div v-if="formato !== 'jpg'" class="form-check">
                  <input
                    id="modoUmaFolha"
                    v-model="modoAjuste"
                    class="form-check-input"
                    type="radio"
                    value="umaFolha"
                  />
                  <label class="form-check-label" for="modoUmaFolha"
                    >Ajustar à página (1 folha)</label
                  >
                </div>
                <div v-if="formato !== 'jpg'" class="form-check">
                  <input
                    id="modoManterPaginar"
                    v-model="modoAjuste"
                    class="form-check-input"
                    type="radio"
                    value="manterPaginar"
                  />
                  <label class="form-check-label" for="modoManterPaginar"
                    >Manter legível e paginar</label
                  >
                </div>
              </fieldset>

              <div class="mt-3">
                <label class="form-label h6 d-block">Formato</label>
                <div class="btn-group" role="group">
                  <button
                    type="button"
                    class="btn"
                    :class="formato === 'pdf' ? 'btn-primary' : 'btn-outline-secondary'"
                    @click="formato = 'pdf'"
                  >
                    PDF
                  </button>
                  <button
                    type="button"
                    class="btn"
                    :class="formato === 'jpg' ? 'btn-primary' : 'btn-outline-secondary'"
                    @click="formato = 'jpg'"
                  >
                    JPG
                  </button>
                </div>
              </div>

              <div class="alert alert-secondary mt-3 mb-0">
                <strong>{{ resumoTexto }}</strong>
                <div class="text-muted small mt-1">{{ descricaoModoAjuste }}</div>
                <div v-if="formatoNaoPagina" class="text-muted small mt-1">
                  JPG é sempre exportado em um único arquivo (sem paginação).
                </div>
                <div class="text-muted small mt-1">{{ conteudoTexto }}</div>
              </div>
            </div>

            <div class="col-12 col-lg-7">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="text-uppercase text-muted small fw-bold">
                  Pré-visualização do {{ formato === 'pdf' ? 'PDF' : 'JPG' }}
                </span>
                <div v-if="totalFolhas > 1" class="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-secondary"
                    :disabled="paginaAtual === 0"
                    @click="irParaPagina(paginaAtual - 1)"
                  >
                    ‹
                  </button>
                  <span class="small">Folha {{ paginaAtual + 1 }} de {{ totalFolhas }}</span>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-secondary"
                    :disabled="paginaAtual === totalFolhas - 1"
                    @click="irParaPagina(paginaAtual + 1)"
                  >
                    ›
                  </button>
                </div>
              </div>

              <div class="exportar-folha">
                <div v-if="carregandoPreview" class="exportar-folha__status">
                  Gerando pré-visualização…
                </div>
                <div v-else-if="capturaPreviewUrl" class="exportar-folha__conteudo">
                  <img :src="capturaPreviewUrl" alt="Pré-visualização do organograma" />
                  <div class="exportar-folha__grade">
                    <div
                      v-for="pagina in paginas"
                      :key="pagina"
                      class="exportar-folha__celula"
                      :class="{ 'exportar-folha__celula--atual': pagina === paginaAtual }"
                      :style="estiloCelula(celulasGrade[pagina])"
                    ></div>
                  </div>
                </div>
                <div v-else class="exportar-folha__status">Sem pré-visualização disponível</div>
              </div>

              <div v-if="totalFolhas > 1" class="d-flex flex-wrap gap-1 mt-2">
                <button
                  v-for="pagina in paginas"
                  :key="pagina"
                  type="button"
                  class="btn btn-sm"
                  :class="pagina === paginaAtual ? 'btn-primary' : 'btn-outline-secondary'"
                  @click="irParaPagina(pagina)"
                >
                  {{ pagina + 1 }}
                </button>
              </div>

              <div class="exportar-legenda mt-2">
                <span>{{ legendaRevisaoTexto }}</span>
                <span v-if="totalFolhas > 1" class="exportar-legenda__continuacao">
                  <span class="exportar-legenda__faixa"></span>
                  Faixa laranja = continua na folha seguinte
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="fechar">Cancelar</button>
          <button type="button" class="btn btn-primary" @click="confirmar">Exportar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  CAPTURA_PADDING_PX,
  LIMITE_CANVAS_CAPTURA_PX,
  MM_POR_PX,
  areaConteudoMm,
  papelNaOrientacao,
} from './paginacao'

// Escala mínima (%) para o texto continuar legível no papel; abaixo dela,
// prefere-se paginar a reduzir ainda mais.
const LEGIBILIDADE_MINIMA = 70

// Acima desse número de folhas, o "Melhor ajuste automático" prefere aceitar
// uma escala abaixo do piso de legibilidade a gerar tantas páginas.
const MAX_FOLHAS_MODO_AUTOMATICO = 6

// Fração mínima do conteúdo (%) para uma folha ser exportável: arredondamentos
// da grade podem produzir uma folha final só com espaço em branco.
const FRACAO_MINIMA_FOLHA = 1e-6

// No JPG o único modo oferecido é o automático, porque a imagem nunca pagina.
const MODO_AJUSTE_JPG = 'automatico'

export default {
  name: 'ModalExportarOrganograma',
  props: {
    visivel: { type: Boolean, default: false },
    // Estimativa (px lógicos) usada até a captura da pré-visualização
    // devolver a medida real.
    dimensaoOrganograma: { type: Object, default: () => ({ width: 0, height: 0 }) },
    // Reserva o mesmo espaço de legenda que o PDF usa.
    mostrarLegenda: { type: Boolean, default: false },
    formatoInicial: { type: String, default: 'pdf' },
    // Captura usada só na pré-visualização; recebe o pixelRatio.
    capturarPreview: { type: Function, default: null },
    // pixelRatio com que o PDF será capturado.
    calcularPixelRatioExportacao: { type: Function, default: null },
  },
  emits: ['fechar', 'confirmar'],
  data() {
    return {
      papel: 'A4',
      orientacao: 'automatica',
      modoAjuste: 'automatico',
      formato: 'pdf',
      // Último modo escolhido no PDF, restaurado ao voltar de JPG para PDF.
      modoAjustePdf: 'automatico',
      paginaAtual: 0,
      capturaPreviewUrl: null,
      dimensaoCapturada: null,
      pixelRatioExportacao: null,
      carregandoPreview: false,
      dataReferencia: new Date(),
    }
  },
  computed: {
    dimensaoConteudo() {
      return this.dimensaoCapturada || this.dimensaoOrganograma || { width: 0, height: 0 }
    },
    orientacaoResolvida() {
      if (this.orientacao !== 'automatica') return this.orientacao
      const { width = 0, height = 0 } = this.dimensaoConteudo
      return width >= height ? 'paisagem' : 'retrato'
    },
    papelMm() {
      return papelNaOrientacao(this.papel, this.orientacaoResolvida)
    },
    areaConteudoMm() {
      return areaConteudoMm(this.papelMm, this.mostrarLegenda)
    },
    conteudoMm() {
      const { width = 0, height = 0 } = this.dimensaoConteudo
      return {
        width: Math.max(width * MM_POR_PX, 1),
        height: Math.max(height * MM_POR_PX, 1),
      }
    },
    // Maior escala (%) que ainda cabe inteira em 1 folha, sem ampliar.
    escalaAjustarUmaPagina() {
      const escala =
        Math.min(
          this.areaConteudoMm.width / this.conteudoMm.width,
          this.areaConteudoMm.height / this.conteudoMm.height,
        ) * 100
      return Math.max(1, Math.min(100, Math.floor(escala)))
    },
    // Fração (≤ 1) a que o html-to-image reduz o canvas quando ele passa do
    // teto; o PDF imprime o organograma nessa proporção da escala escolhida.
    fatorReducaoCaptura() {
      if (!this.pixelRatioExportacao) return 1
      const { width = 0, height = 0 } = this.dimensaoConteudo
      const maiorLadoPx = Math.max(width, height) * this.pixelRatioExportacao
      return maiorLadoPx > LIMITE_CANVAS_CAPTURA_PX ? LIMITE_CANVAS_CAPTURA_PX / maiorLadoPx : 1
    },
    // Escala (%) que faz o organograma ocupar toda a largura útil da folha —
    // ou toda a altura, quando é ela que limita —, ampliando se preciso e sem
    // arredondar. Compensa a redução do canvas.
    escalaPreencherFolha() {
      const proporcao = Math.min(
        this.areaConteudoMm.width / this.conteudoMm.width,
        this.areaConteudoMm.height / this.conteudoMm.height,
      )
      return (proporcao * 100) / this.fatorReducaoCaptura
    },
    resultadoAjuste() {
      return this.calcularAjuste(this.modoAjuste)
    },
    fracaoPorFolhaLargura() {
      const fator = (this.resultadoAjuste.escala / 100) * this.fatorReducaoCaptura
      return Math.min(1, this.areaConteudoMm.width / fator / this.conteudoMm.width)
    },
    fracaoPorFolhaAltura() {
      const fator = (this.resultadoAjuste.escala / 100) * this.fatorReducaoCaptura
      return Math.min(1, this.areaConteudoMm.height / fator / this.conteudoMm.height)
    },
    // Retângulos (% do conteúdo capturado) de cada folha, na mesma ordem e
    // com o mesmo recorte do PDF. Folhas sem conteúdo são descartadas.
    celulasGrade() {
      const { cols, rows } = this.resultadoAjuste.folhas
      const colunas = [0, ...this.calcularLimites(cols, this.fracaoPorFolhaLargura), 100]
      const linhas = [0, ...this.calcularLimites(rows, this.fracaoPorFolhaAltura), 100]
      const celulas = []
      for (let linha = 0; linha < rows; linha += 1) {
        for (let coluna = 0; coluna < cols; coluna += 1) {
          const width = colunas[coluna + 1] - colunas[coluna]
          const height = linhas[linha + 1] - linhas[linha]
          if (width <= FRACAO_MINIMA_FOLHA || height <= FRACAO_MINIMA_FOLHA) continue
          celulas.push({ left: colunas[coluna], top: linhas[linha], width, height })
        }
      }
      return celulas
    },
    totalFolhas() {
      return this.celulasGrade.length
    },
    paginas() {
      return this.celulasGrade.map((_celula, indice) => indice)
    },
    resumoTexto() {
      const orientacao = this.orientacaoResolvida === 'paisagem' ? 'paisagem' : 'retrato'
      const plural = this.totalFolhas > 1 ? 's' : ''
      const escala = Math.round(this.resultadoAjuste.escala)
      return `${this.papel} ${orientacao} · escala ${escala}% · ${this.totalFolhas} folha${plural}`
    },
    descricaoModoAjuste() {
      const descricoes = {
        automatico: 'O sistema escolhe o melhor equilíbrio entre legibilidade e número de folhas.',
        pisoLegibilidade: `Reduz a escala para caber em 1 folha, nunca abaixo de ${LEGIBILIDADE_MINIMA}% — pagina quando necessário para manter a leitura.`,
        umaFolha: 'Todo o organograma em uma única folha. Textos podem ficar reduzidos.',
        manterPaginar:
          'Tamanho original preservado, distribuído entre as folhas com marcas de corte.',
      }
      return descricoes[this.modoAjuste] || ''
    },
    conteudoTexto() {
      return `${Math.round(this.conteudoMm.width)}×${Math.round(this.conteudoMm.height)} mm de conteúdo`
    },
    formatoNaoPagina() {
      return this.formato === 'jpg' && this.totalFolhas <= 1
    },
    // DPI efetivo da imagem impressa, a partir de 96 dpi.
    resolucaoDpi() {
      return Math.round(96 * (100 / Math.max(this.resultadoAjuste.escala, 1)))
    },
    legendaRevisaoTexto() {
      const data = this.dataReferencia.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
      const formato = this.formato === 'jpg' ? 'JPG' : 'PDF'
      return `Revisão: ${data} · ${formato} ${this.resolucaoDpi} dpi, uma imagem por folha`
    },
  },
  watch: {
    visivel(aberto) {
      if (!aberto) return
      this.paginaAtual = 0
      this.formato = this.formatoInicial === 'jpg' ? 'jpg' : 'pdf'
      this.dataReferencia = new Date()
      this.dimensaoCapturada = null
      this.pixelRatioExportacao = null
      this.capturarPreviewAsync()
    },
    papel() {
      this.paginaAtual = 0
    },
    orientacao() {
      this.paginaAtual = 0
    },
    modoAjuste() {
      this.paginaAtual = 0
    },
    formato(atual, anterior) {
      this.paginaAtual = 0
      // Sem sincronizar o v-model, nenhum radio ficaria marcado no JPG.
      if (atual === 'jpg') {
        if (anterior !== 'jpg') this.modoAjustePdf = this.modoAjuste
        this.modoAjuste = MODO_AJUSTE_JPG
      } else if (anterior === 'jpg') {
        this.modoAjuste = this.modoAjustePdf
      }
    },
  },
  methods: {
    // Escala e grade de folhas (cols x rows) de um modo de ajuste.
    calcularAjuste(modo) {
      const umaFolha = { escala: this.escalaPreencherFolha, folhas: { cols: 1, rows: 1 } }
      if (this.formato === 'jpg') {
        return { escala: this.escalaAjustarUmaPagina, folhas: { cols: 1, rows: 1 } }
      }
      if (modo === 'manterPaginar') {
        return { escala: 100, folhas: this.calcularGrade(100) }
      }
      const comPiso = {
        escala: LEGIBILIDADE_MINIMA,
        folhas: this.calcularGrade(LEGIBILIDADE_MINIMA),
      }
      if (modo === 'pisoLegibilidade') {
        return this.escalaAjustarUmaPagina >= LEGIBILIDADE_MINIMA ? umaFolha : comPiso
      }
      if (modo === 'automatico') {
        if (this.escalaAjustarUmaPagina >= LEGIBILIDADE_MINIMA) return umaFolha
        // A decisão usa a grade nominal (sem a redução do canvas).
        const nominal = this.calcularGrade(LEGIBILIDADE_MINIMA, 1)
        return nominal.cols * nominal.rows > MAX_FOLHAS_MODO_AUTOMATICO ? umaFolha : comPiso
      }
      return umaFolha
    },
    // A escala efetivamente impressa é a escolhida vezes a redução do canvas.
    calcularGrade(escala, reducao = this.fatorReducaoCaptura) {
      const fator = (escala / 100) * reducao
      return {
        cols: this.contarFolhas(this.conteudoMm.width * fator, this.areaConteudoMm.width, fator),
        rows: this.contarFolhas(this.conteudoMm.height * fator, this.areaConteudoMm.height, fator),
      }
    },
    // Folhas ocupadas num eixo. A sobra que não passa da borda em branco da
    // captura (CAPTURA_PADDING_PX) não gera folha nova: ela sairia sem
    // nenhuma caixa.
    contarFolhas(medidaMm, areaMm, fator) {
      const cheias = Math.floor(medidaMm / areaMm)
      const sobraMm = medidaMm - cheias * areaMm
      if (cheias >= 1 && sobraMm <= CAPTURA_PADDING_PX * MM_POR_PX * fator) return cheias
      return Math.max(1, cheias + 1)
    },
    // Divisórias internas (%) de um eixo: todas as folhas, exceto a última,
    // recebem a mesma fração do conteúdo.
    calcularLimites(quantidade, fracaoPorFolha) {
      const limites = []
      for (let indice = 1; indice < quantidade; indice += 1) {
        limites.push(Math.min(1, indice * fracaoPorFolha) * 100)
      }
      return limites
    },
    estiloCelula(celula) {
      return {
        left: `${celula.left}%`,
        top: `${celula.top}%`,
        width: `${celula.width}%`,
        height: `${celula.height}%`,
      }
    },
    async capturarPreviewAsync() {
      if (this.capturarPreview) {
        this.carregandoPreview = true
        try {
          const resultado = await this.capturarPreview(1)
          this.capturaPreviewUrl = resultado?.canvas?.toDataURL
            ? resultado.canvas.toDataURL('image/png')
            : null
          this.dimensaoCapturada = this.extrairDimensaoCaptura(resultado)
          this.paginaAtual = 0
        } catch {
          this.capturaPreviewUrl = null
          this.dimensaoCapturada = null
        } finally {
          this.carregandoPreview = false
        }
      }
      this.pixelRatioExportacao = this.lerPixelRatioExportacao()
    },
    lerPixelRatioExportacao() {
      if (!this.calcularPixelRatioExportacao) return null
      try {
        const pixelRatio = Number(this.calcularPixelRatioExportacao())
        return Number.isFinite(pixelRatio) && pixelRatio > 0 ? pixelRatio : null
      } catch {
        return null
      }
    },
    extrairDimensaoCaptura(resultado) {
      const width = Number(resultado?.width)
      const height = Number(resultado?.height)
      if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
        return null
      }
      return { width, height }
    },
    irParaPagina(indice) {
      if (indice < 0 || indice >= this.totalFolhas) return
      this.paginaAtual = indice
    },
    fechar() {
      this.$emit('fechar')
    },
    confirmar() {
      this.$emit('confirmar', {
        formato: this.formato,
        papel: this.papel,
        orientacao: this.orientacaoResolvida,
        modoAjuste: this.modoAjuste,
        escala: this.resultadoAjuste.escala,
        folhas: this.resultadoAjuste.folhas,
      })
    },
  },
}
</script>

<style scoped lang="scss">
.exportar-folha {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  min-height: 120px;
  margin: 0 auto;
  background: #fff;
  border: 1px solid #dfe8f3;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.08);
  overflow: hidden;

  // Encolhe até as dimensões exatas da imagem: a grade é posicionada sobre
  // este elemento, então qualquer sobra apareceria marcada como folha.
  &__conteudo {
    position: relative;
    width: fit-content;
    max-width: 100%;
    line-height: 0;
  }

  img {
    display: block;
    width: auto;
    height: auto;
    max-width: 100%;
    max-height: 420px;
  }

  &__status {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    font-size: 0.85rem;
    text-align: center;
    padding: 1rem;
  }

  &__grade {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  &__celula {
    position: absolute;
    box-sizing: border-box;
    border: 1px dashed rgba(100, 116, 139, 0.35);

    &--atual {
      border: 2px dashed #f97316;
    }
  }
}

.exportar-legenda {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem 1rem;
  font-size: 0.78rem;
  color: #64748b;

  &__continuacao {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  &__faixa {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 2px;
    background: #f97316;
    flex-shrink: 0;
  }
}
</style>
