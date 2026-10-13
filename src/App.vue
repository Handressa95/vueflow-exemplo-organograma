<template>
  <CentralFeedback />

  <div class="container-fluid py-3 pagina">
    <header class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
      <div>
        <h1 class="h4 mb-0">Organograma da Simulação</h1>
        <small class="text-muted"
          >Template Vue 3 + Vue Flow, sem API (dados na sessão do navegador)</small
        >
      </div>
      <span v-if="temAlteracoes" class="badge text-bg-warning">Alterações não salvas</span>
      <span v-else class="badge text-bg-success">Sem alterações pendentes</span>
    </header>

    <section class="card mb-3">
      <div class="card-body d-flex flex-wrap align-items-center gap-3">
        <div class="busca">
          <select v-model="idBusca" class="form-select form-select-sm" @change="aoBuscar">
            <option :value="null">Localizar unidade ou cargo/função...</option>
            <option v-for="item in opcoesBusca" :key="item.id" :value="String(item.id)">
              {{ item.tipo === 'role' ? '\u00a0\u00a0\u00a0↳ ' : '' }}{{ item.rotulo }}
            </option>
          </select>
        </div>

        <label class="checkbox-manual mb-0">
          <input v-model="somenteLeitura" type="checkbox" />
          <span>Somente leitura</span>
        </label>

        <div class="legenda ms-auto">
          <span v-for="(cor, status) in coresStatus" :key="status" class="legenda__item">
            <span class="legenda__cor" :style="{ background: cor }"></span>{{ status }}
          </span>
        </div>
      </div>
    </section>

    <div class="row g-3 mb-3">
      <div class="col-12 col-lg-6">
        <section class="card h-100">
          <div class="card-body">
            <h2 class="h6">Exemplo 1 — Disposição (formato atual)</h2>
            <p class="small text-muted mb-2">
              Salva a árvore (<code>nos</code>) e a disposição visual
              (<code>jsonPosicaoOrganograma</code>: posições, dimensões, cor de fundo e zoom/posição
              do organograma) exatamente como é enviado hoje para a API.
            </p>
            <div class="d-flex flex-wrap gap-2">
              <button type="button" class="btn btn-sm btn-primary" @click="salvarDisposicao">
                <i class="bi bi-save me-1"></i>Salvar na sessão
              </button>
              <button
                type="button"
                class="btn btn-sm btn-outline-primary"
                :disabled="!salvoDisposicao"
                @click="carregarDisposicao"
              >
                <i class="bi bi-arrow-repeat me-1"></i>Carregar da sessão
              </button>
              <button
                type="button"
                class="btn btn-sm btn-outline-danger"
                :disabled="!salvoDisposicao"
                @click="removerDisposicao"
              >
                Remover
              </button>
            </div>
            <details v-if="salvoDisposicao" class="mt-2">
              <summary class="small">Ver JSON salvo</summary>
              <pre class="json">{{ jsonDisposicao }}</pre>
            </details>
          </div>
        </section>
      </div>

      <div class="col-12 col-lg-6">
        <section class="card h-100">
          <div class="card-body">
            <h2 class="h6">Exemplo 2 — Estrutura nativa do Vue Flow</h2>
            <p class="small text-muted mb-2">
              Salva o retorno de <code>toObject()</code> (nodes, edges, viewport) e restaura com
              <code>fromObject()</code>, como na documentação do Vue Flow. A árvore de negócio e a
              cor de fundo vão ao lado, pois não fazem parte do objeto do Vue Flow.
            </p>
            <div class="d-flex flex-wrap gap-2">
              <button type="button" class="btn btn-sm btn-primary" @click="salvarVueFlow">
                <i class="bi bi-save me-1"></i>Salvar na sessão
              </button>
              <button
                type="button"
                class="btn btn-sm btn-outline-primary"
                :disabled="!salvoVueFlow"
                @click="carregarVueFlow"
              >
                <i class="bi bi-arrow-repeat me-1"></i>Carregar da sessão
              </button>
              <button
                type="button"
                class="btn btn-sm btn-outline-danger"
                :disabled="!salvoVueFlow"
                @click="removerVueFlow"
              >
                Remover
              </button>
            </div>
            <details v-if="salvoVueFlow" class="mt-2">
              <summary class="small">Ver JSON salvo</summary>
              <pre class="json">{{ jsonVueFlow }}</pre>
            </details>
          </div>
        </section>
      </div>
    </div>

    <div class="d-flex flex-wrap justify-content-end gap-2 mb-2">
      <button
        type="button"
        class="btn btn-sm btn-outline-secondary"
        :disabled="exportando"
        @click="abrirExportacao('pdf')"
      >
        <i class="bi bi-filetype-pdf text-danger me-1"></i>Exportar PDF
      </button>
      <button
        type="button"
        class="btn btn-sm btn-outline-secondary"
        :disabled="exportando"
        @click="abrirExportacao('jpg')"
      >
        <i class="bi bi-filetype-jpg text-danger me-1"></i>Exportar JPG
      </button>
      <button type="button" class="btn btn-sm btn-outline-secondary" @click="carregarExemplo">
        <i class="bi bi-arrow-counterclockwise me-1"></i>Recarregar dados de exemplo
      </button>
    </div>

    <Organograma ref="organograma" :somente-leitura="somenteLeitura" @alteracao="aoAlterar" />

    <ModalExportarOrganograma
      :visivel="exportacao.visivel"
      :dimensao-organograma="exportacao.dimensao"
      :mostrar-legenda="exportacao.legenda.length > 0"
      :formato-inicial="exportacao.formato"
      :capturar-preview="capturarPreviewExportacao"
      :calcular-pixel-ratio-exportacao="calcularPixelRatioExportacao"
      @fechar="exportacao.visivel = false"
      @confirmar="confirmarExportacao"
    />
  </div>
</template>

<script>
import CentralFeedback from '@/feedback/CentralFeedback.vue'
import { notificacao } from '@/feedback/feedback'
import Organograma from '@/organograma/Organograma.vue'
import ModalExportarOrganograma from '@/organograma/exportacao/ModalExportarOrganograma.vue'
import { calcularPixelRatioPdf, gerarJpg, gerarPdf } from '@/organograma/exportacao/gerarArquivos'
import { coletarTodos } from '@/organograma/arvore'
import { ROTULOS_STATUS, STATUS } from '@/organograma/constantes'
import { criarEstruturaAtual, criarEstruturaSimulacao } from '@/dados/estruturaExemplo'
import {
  lerPayloadDisposicaoDaSessao,
  removerDisposicaoDaSessao,
  salvarDisposicaoNaSessao,
  simularRespostaBackend,
} from '@/persistencia/exemploDisposicao'
import {
  lerVueFlowDaSessao,
  removerVueFlowDaSessao,
  salvarVueFlowNaSessao,
} from '@/persistencia/exemploVueFlow'

export default {
  name: 'App',
  components: { CentralFeedback, Organograma, ModalExportarOrganograma },
  data() {
    return {
      estruturaAtual: criarEstruturaAtual(),
      somenteLeitura: false,
      temAlteracoes: false,
      opcoesBusca: [],
      idBusca: null,
      salvoDisposicao: lerPayloadDisposicaoDaSessao(),
      salvoVueFlow: lerVueFlowDaSessao(),
      coresStatus: {
        Atual: '#007bff',
        Acréscimo: '#28a745',
        Alteração: '#eab308',
        Extinção: '#dc3545',
      },
      exportando: false,
      exportacao: {
        visivel: false,
        formato: 'pdf',
        dimensao: { width: 0, height: 0 },
        legenda: [],
      },
    }
  },
  computed: {
    jsonDisposicao() {
      if (!this.salvoDisposicao) return ''
      // jsonPosicaoOrganograma é uma string JSON; exibida expandida só para leitura.
      const { nos, jsonPosicaoOrganograma } = this.salvoDisposicao
      return JSON.stringify(
        { jsonPosicaoOrganograma: JSON.parse(jsonPosicaoOrganograma), nos },
        null,
        2,
      )
    },
    jsonVueFlow() {
      return this.salvoVueFlow ? JSON.stringify(this.salvoVueFlow, null, 2) : ''
    },
  },
  watch: {
    idBusca(valor) {
      if (valor == null) this.$refs.organograma.limparDestaque()
    },
  },
  mounted() {
    this.carregarExemplo()
  },
  methods: {
    carregarExemplo() {
      this.idBusca = null
      this.$refs.organograma.carregar({
        estruturaAtual: this.estruturaAtual,
        estruturaSimulacao: criarEstruturaSimulacao(this.estruturaAtual),
        disposicao: null,
      })
    },

    aoAlterar({ temAlteracoes, estruturaSimulacao }) {
      this.temAlteracoes = temAlteracoes
      this.opcoesBusca = coletarTodos(estruturaSimulacao)
    },

    aoBuscar() {
      if (this.idBusca != null) this.$refs.organograma.focarNode(this.idBusca)
    },

    salvarDisposicao() {
      const organograma = this.$refs.organograma
      this.salvoDisposicao = salvarDisposicaoNaSessao(
        organograma.obterEstruturaSimulacao(),
        organograma.obterDisposicao(),
      )
      organograma.marcarComoSalvo()
      notificacao.sucesso('Disposição salva na sessão do navegador.')
    },

    carregarDisposicao() {
      const payload = lerPayloadDisposicaoDaSessao()
      if (!payload) return
      const { estruturaSimulacao, disposicao } = simularRespostaBackend(
        payload,
        this.estruturaAtual,
      )
      this.idBusca = null
      this.$refs.organograma.carregar({
        estruturaAtual: this.estruturaAtual,
        estruturaSimulacao,
        disposicao,
      })
      notificacao.sucesso('Disposição carregada da sessão do navegador.')
    },

    removerDisposicao() {
      removerDisposicaoDaSessao()
      this.salvoDisposicao = null
    },

    salvarVueFlow() {
      const organograma = this.$refs.organograma
      this.salvoVueFlow = salvarVueFlowNaSessao(
        organograma.exportarFluxoVueFlow(),
        organograma.obterEstruturaSimulacao(),
        organograma.obterDisposicao().corFundo,
      )
      organograma.marcarComoSalvo()
      notificacao.sucesso('Estrutura do Vue Flow salva na sessão do navegador.')
    },

    async carregarVueFlow() {
      const salvo = lerVueFlowDaSessao()
      if (!salvo) return
      this.idBusca = null
      await this.$refs.organograma.restaurarFluxoVueFlow({
        estruturaAtual: this.estruturaAtual,
        estruturaSimulacao: salvo.estruturaSimulacao,
        fluxo: salvo.fluxo,
        corFundo: salvo.corFundo,
      })
      notificacao.sucesso('Estrutura do Vue Flow carregada da sessão do navegador.')
    },

    removerVueFlow() {
      removerVueFlowDaSessao()
      this.salvoVueFlow = null
    },

    abrirExportacao(formato) {
      const organograma = this.$refs.organograma
      if (!organograma.nodes.length) {
        notificacao.info('Não há unidades para exportar.')
        return
      }
      this.exportacao = {
        visivel: true,
        formato,
        dimensao: organograma.obterDimensaoExportacao() || { width: 0, height: 0 },
        legenda: this.montarLegendaExportacao(organograma.statusExibidos()),
      }
    },

    // A legenda só aparece quando há caixas com status diferente de "Atual".
    montarLegendaExportacao(status) {
      if (!status.some((s) => s !== STATUS.ATUAL)) return []
      return status.map((s) => ({
        rotulo: ROTULOS_STATUS[s],
        cor: this.coresStatus[ROTULOS_STATUS[s]],
      }))
    },

    capturarPreviewExportacao(pixelRatio) {
      return this.$refs.organograma.capturarComoImagem(pixelRatio)
    },

    calcularPixelRatioExportacao() {
      return calcularPixelRatioPdf(this.$refs.organograma)
    },

    async confirmarExportacao(parametros) {
      this.exportacao.visivel = false
      this.exportando = true
      const organograma = this.$refs.organograma
      try {
        if (parametros.formato === 'jpg') {
          await gerarJpg({ organograma, parametros })
          notificacao.sucesso('Imagem JPG exportada com sucesso.')
        } else {
          await gerarPdf({
            organograma,
            parametros,
            cabecalho: {
              titulo: 'Organograma da Simulação',
              subtitulo: 'Template Vue 3 + Vue Flow',
            },
            rodape: { rotulo: 'Simulação', descricao: 'Dados fictícios de exemplo' },
            legenda: this.exportacao.legenda,
          })
          notificacao.sucesso('PDF exportado com sucesso.')
        }
      } catch (erro) {
        console.error('Erro ao exportar o organograma:', erro)
        notificacao.erro(erro?.message || 'Erro ao exportar o organograma.')
      } finally {
        this.exportando = false
      }
    },
  },
}
</script>

<style scoped lang="scss">
.pagina {
  max-width: 1600px;
}

.busca {
  min-width: 320px;
  flex: 1 1 320px;
  max-width: 520px;
}

.legenda {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  font-size: 0.75rem;
  color: #495057;

  &__item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  &__cor {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 3px;
    border: 1px solid rgba(0, 0, 0, 0.1);
  }
}

.json {
  max-height: 260px;
  overflow: auto;
  font-size: 0.7rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 8px;
  margin: 6px 0 0;
}
</style>
