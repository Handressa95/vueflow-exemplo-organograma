<template>
  <div class="org-chart">
    <div class="org-chart__toolbar" v-if="estruturaSimulacao.length <= 0">
      <div class="org-chart__toolbar-left">
        <button
          v-if="interativo"
          type="button"
          class="btn btn-sm btn-outline-primary"
          @click="adicionarNovaUnidade(null)"
        >
          Nova unidade funcional
        </button>
      </div>
    </div>

    <div ref="containerFluxo" class="flow-wrapper" :class="{ locked: !interativo }">
      <VueFlow
        :id="idFluxo"
        v-model:nodes="nodes"
        v-model:edges="edges"
        :apply-default="false"
        :default-viewport="{ zoom: 0.8 }"
        :min-zoom="0.1"
        :max-zoom="2"
        :style="{ backgroundColor: disposicao.corFundo }"
        :nodes-draggable="interativo"
        :edges-updatable="interativo"
        :nodes-connectable="false"
        :delete-key-code="null"
        :is-valid-connection="conexaoValida"
        fit-view-on-init
        @init="onFlowInit"
        @node-click="onNodeClick"
        @node-drag-start="onNodeDragStart"
        @node-drag="onNodeDrag"
        @node-drag-stop="onNodeDragStop"
        @nodes-change="onNodesChange"
        @edges-change="onEdgesChange"
        @viewport-change-end="onViewportChangeEnd"
        @keydown.delete.prevent
        @keydown.backspace.prevent
      >
        <template #node-org="{ id, data, selected }">
          <NodeResizer
            v-if="interativo"
            :node-id="id"
            :is-visible="selected"
            :min-width="larguraMinimaNo"
            :min-height="alturaMinimaDoNo(id)"
            @resize-start="onNodeResize(id, $event)"
            @resize="onNodeResize(id, $event)"
            @resize-end="onNodeResizeEnd(id, $event)"
          />

          <div
            class="org-node"
            :class="[
              id === idSelecionado ? 'org-node--selected' : '',
              id === idArrastado ? 'org-node--dragging' : '',
              id === idDestacado ? 'org-node--destacado' : '',
              `org-node--status-${classeStatus(data.status)}`,
            ]"
            :data-id="id"
          >
            <div v-if="interativo" class="org-node__menu nodrag nopan">
              <button
                v-if="podeExibir('adicionar', id)"
                type="button"
                class="btn btn-sm btn-link"
                title="Adicionar unidade ou cargo/função"
                @click.stop="addUnidade(id)"
              >
                + Unidade/Cargo
              </button>
              <button
                v-if="podeExibir('editar', id)"
                type="button"
                class="btn btn-sm btn-link"
                title="Editar"
                @click.stop="editarItem(id)"
              >
                Editar
              </button>
              <button
                v-if="podeExibir('excluir', id)"
                type="button"
                class="btn btn-sm btn-link text-danger"
                title="Excluir"
                @click.stop="excluirNode(id)"
              >
                Excluir
              </button>
              <button
                v-if="podeExibir('extinguir', id)"
                type="button"
                class="btn btn-sm btn-link text-danger"
                title="Extinguir"
                @click.stop="extinguir(id)"
              >
                Extinguir
              </button>
              <button
                v-if="podeExibir('restaurar', id)"
                type="button"
                class="btn btn-sm btn-link text-danger"
                title="Restaurar"
                @click.stop="restaurar(id)"
              >
                Restaurar
              </button>
            </div>

            <div class="org-node__content">
              <div class="org-node__nome">{{ data.nome || 'Unidade' }}</div>
              <div class="org-node__sigla">{{ data.sigla || '---' }}</div>
              <div
                class="org-node__status-badge"
                :class="`org-node__status-badge--${classeStatus(data.status)}`"
              >
                {{ rotulosStatus[data.status] || data.status || 'Atual' }}
              </div>
            </div>

            <div class="org-node__footer">
              <div v-if="data.temAlocacoes" class="org-node__alocacoes">
                <span
                  v-for="(info, simbolo) in data.alocacoes"
                  :key="simbolo"
                  class="org-node__alocacao"
                >
                  <span class="org-node__alocacao-simbolo">{{ simbolo }}</span>
                  <span class="org-node__alocacao-count">: {{ info.count }}</span>
                </span>
              </div>
              <button
                type="button"
                class="org-node__detalhes btn btn-sm btn-link nodrag nopan"
                :disabled="!data.temAlocacoes"
                @click.stop="abrirAlocacoes(id)"
              >
                Ver detalhes
              </button>
            </div>

            <button
              v-if="data.quantidadeFilhos > 0"
              type="button"
              class="org-node__toggle nodrag nopan"
              :title="data.recolhido ? 'Expandir subordinadas' : 'Recolher subordinadas'"
              @click.stop="alternarRecolhimento(id)"
            >
              <span class="org-node__toggle-icon">{{ data.recolhido ? '▶' : '▼' }}</span>
              <span>{{ data.quantidadeFilhos }}</span>
            </button>
          </div>
        </template>

        <template #edge-flutuante="edgeProps">
          <BaseEdge :id="edgeProps.id" :path="caminhoConexao(edgeProps)" />
        </template>

        <LinhasAuxiliares :horizontal="linhaAuxiliarHorizontal" :vertical="linhaAuxiliarVertical" />

        <Background pattern-color="#e9ecef" :gap="20" />
        <Controls
          :show-interactive="false"
          position="top-left"
          @zoom-in="onControlesViewportChange"
          @zoom-out="onControlesViewportChange"
          @fit-view="onControlesViewportChange"
        />
        <Panel position="top-right" class="d-flex align-items-center gap-2">
          <span class="badge bg-light text-dark">{{ nodes.length }} nós</span>
          <div v-if="interativo" class="org-fundo-selector">
            <label for="orgChartCorFundo">Cor de fundo</label>
            <input
              id="orgChartCorFundo"
              type="color"
              class="org-fundo-selector__input"
              :value="disposicao.corFundo"
              title="Selecionar cor de fundo do organograma"
              @input="onCorFundoChange($event.target.value)"
            />
          </div>
        </Panel>
      </VueFlow>
    </div>

    <ModalCadastroItem
      :visivel="modalCadastro.visivel"
      :item-selecionado="modalCadastro.itemSelecionado"
      :unidade-pai="modalCadastro.unidadePai"
      @fechar="fecharModalCadastro"
      @voltar="fecharModalCadastro"
      @enviar="aoEnviarModalCadastro"
    />

    <ModalAlocacoes
      v-if="modalAlocacoes.visivel && unidadeDasAlocacoes"
      :unidade="unidadeDasAlocacoes"
      :unidades-destino="unidadesDestinoTransferencia"
      :id-alocacao-destacada="idAlocacaoDestacada"
      :somente-leitura="!interativo"
      :pode-exibir="podeExibir"
      @fechar="fecharModalAlocacoes"
      @editar="editarAlocacao"
      @excluir="excluirAlocacao"
      @restaurar="restaurarAlocacao"
      @liberar="liberarAlocacao"
      @transferir="transferirAlocacoes"
    />
  </div>
</template>

<script>
import { Panel, VueFlow, Position, BaseEdge, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { NodeResizer } from '@vue-flow/node-resizer'
import '@vue-flow/node-resizer/dist/style.css'
import '@vue-flow/controls/dist/style.css'
import { toCanvas } from 'html-to-image'
import { confirmar, notificacao } from '@/feedback/feedback'
import { CAPTURA_PADDING_PX } from './exportacao/paginacao'
import LinhasAuxiliares from './linhasAuxiliares/LinhasAuxiliares.vue'
import { obterLinhasAuxiliares } from './linhasAuxiliares/linhasAuxiliares'
import { obterCaminhoConexaoFlutuante } from './conexaoFlutuante'
import ModalCadastroItem from './modais/ModalCadastroItem.vue'
import ModalAlocacoes from './modais/ModalAlocacoes.vue'
import {
  ALTURA_MINIMA_NO,
  ALTURA_NO,
  COR_FUNDO_PADRAO,
  ESPACO_HORIZONTAL,
  ESPACO_MINIMO_ABAIXO_DO_PAI,
  ESPACO_VERTICAL,
  FOLGA_MINIMA_ENTRE_CAIXAS,
  ID_FLUXO,
  LARGURA_MINIMA_NO,
  LARGURA_NO,
  LARGURA_VISUAL_NO,
  ROTULOS_STATUS,
  STATUS,
  disposicaoPadrao,
  normalizarDisposicao,
} from './constantes'
import {
  calcularPosicoesArvore,
  colide,
  idsDescendentes,
  idsRecolhidosPadrao,
  itensVisiveis,
} from './layoutArvore'
import {
  agruparAlocacoesPorSimbolo,
  buscarPorId,
  clonar,
  coletarUnidades,
  encontrarPai,
  encontrarPaiPorId,
  extrairAlocacoes,
  idsRecolhidosDaEstrutura,
  inserirOrdenado,
  mapearEstruturaParaItens,
  mesmoId,
  montarRotuloCargo,
  montarRotuloUnidade,
  moverItem,
  proximoId,
  removerDaEstrutura,
} from './arvore'

// Elementos que só fazem sentido na tela e ficam fora da imagem exportada:
// controles de zoom, painel (contador e cor de fundo), menu da caixa
// selecionada e alças do NodeResizer.
const CLASSES_FORA_DA_CAPTURA = [
  'vue-flow__controls',
  'vue-flow__panel',
  'vue-flow__resize-control',
  'org-node__menu',
]

export default {
  name: 'OrganogramaSimulacao',
  components: {
    Panel,
    VueFlow,
    Background,
    Controls,
    NodeResizer,
    BaseEdge,
    LinhasAuxiliares,
    ModalCadastroItem,
    ModalAlocacoes,
  },
  props: {
    somenteLeitura: { type: Boolean, default: false },
  },
  emits: ['alteracao'],
  setup() {
    const {
      updateNodeInternals,
      fitView,
      findNode,
      getNodes,
      setCenter,
      applyNodeChanges,
      applyEdgeChanges,
      setViewport,
      getViewport,
      toObject,
      fromObject,
    } = useVueFlow(ID_FLUXO)
    return {
      updateNodeInternals,
      fitView,
      findNode,
      getNodes,
      setCenter,
      applyNodeChanges,
      applyEdgeChanges,
      setViewport,
      getViewport,
      toObject,
      fromObject,
    }
  },
  data() {
    return {
      idFluxo: ID_FLUXO,
      rotulosStatus: ROTULOS_STATUS,
      larguraMinimaNo: LARGURA_MINIMA_NO,
      alturaMinimaNo: ALTURA_MINIMA_NO,
      // Altura mínima medida por caixa durante o redimensionamento manual,
      // para que sigla, alocações e "Ver detalhes" não fiquem fora do card.
      alturasMinimasNos: {},

      estruturaAtual: [],
      estruturaSimulacao: [],
      itens: [],
      nodes: [],
      edges: [],
      idsRecolhidos: new Set(),

      idSelecionado: null,
      idDestacado: null,
      idAlocacaoDestacada: null,
      idArrastado: null,
      arrastando: false,
      posicaoPonteiro: null,
      flowInicializado: false,

      disposicao: disposicaoPadrao(),
      viewportAplicadoInicial: false,

      linhaAuxiliarHorizontal: undefined,
      linhaAuxiliarVertical: undefined,

      temAlteracoes: false,

      modalCadastro: { visivel: false, itemSelecionado: null, unidadePai: null },
      modalAlocacoes: { visivel: false, unidadeId: null },
    }
  },
  computed: {
    interativo() {
      return !this.somenteLeitura
    },
    unidadeDasAlocacoes() {
      return buscarPorId(this.estruturaSimulacao, this.modalAlocacoes.unidadeId)
    },
    unidadesDestinoTransferencia() {
      return coletarUnidades(this.estruturaSimulacao)
        .filter((u) => !mesmoId(u.id, this.modalAlocacoes.unidadeId))
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
    },
  },
  watch: {
    somenteLeitura(valor) {
      if (valor) {
        this.idArrastado = null
        this.arrastando = false
        this.limparAlvosDeSoltura()
      }
      this.centralizarFlow()
    },
  },
  mounted() {
    this.$nextTick(() => this.updateNodeInternals())
  },
  methods: {
    // ─────────────────────────────────────────────
    // API pública (usada pela página via ref)
    // ─────────────────────────────────────────────

    // Carrega a estrutura e a disposição visual gravada. Sem `idsRecolhidos`,
    // aplica o recolhimento inicial por nível (NIVEIS_VISIVEIS_INICIAIS).
    carregar({ estruturaAtual, estruturaSimulacao, disposicao, idsRecolhidos = null }) {
      this.estruturaAtual = estruturaAtual || []
      this.estruturaSimulacao = estruturaSimulacao || []
      this.disposicao = normalizarDisposicao(disposicao)
      this.viewportAplicadoInicial = false
      this.limparDestaque()
      this.montarOrganograma(false, true)
      if (idsRecolhidos) {
        this.idsRecolhidos = new Set(idsRecolhidos)
        this.reconstruir()
      }
      this.temAlteracoes = false
      this.emitirAlteracao()
    },

    obterEstruturaSimulacao() {
      return clonar(this.estruturaSimulacao)
    },

    obterDisposicao() {
      return {
        ...clonar(this.disposicao),
        recolhidos: [...this.idsRecolhidos].map((id) =>
          String(this.chaveDisposicao(buscarPorId(this.estruturaSimulacao, id)) ?? id),
        ),
      }
    },

    // Exemplo 2: estrutura nativa do Vue Flow (nodes, edges, position, zoom,
    // viewport), exatamente como `toObject()` da documentação.
    exportarFluxoVueFlow() {
      return this.toObject()
    },

    // Exemplo 2: restaura com `fromObject()`. Como a árvore de negócio e a cor
    // de fundo não fazem parte do objeto do Vue Flow, elas vêm à parte; a
    // disposição interna é reconstruída a partir dos nós para que as próximas
    // ações (expandir, incluir, arrastar) partam das posições restauradas.
    // Nós recolhidos não fazem parte de `toObject()`: ao expandi-los, voltam
    // a ser posicionados junto do pai.
    async restaurarFluxoVueFlow({ estruturaAtual, estruturaSimulacao, fluxo, corFundo }) {
      this.estruturaAtual = estruturaAtual || []
      this.estruturaSimulacao = estruturaSimulacao || []

      const disposicao = disposicaoPadrao()
      disposicao.corFundo = corFundo || COR_FUNDO_PADRAO
      if (fluxo.viewport) {
        const { x, y, zoom } = fluxo.viewport
        disposicao.viewport = { x, y, zoom }
      }

      const idsNoFluxo = new Set()
      const recolhidos = new Set()
      ;(fluxo.nodes || []).forEach((no) => {
        idsNoFluxo.add(no.id)
        const chave = this.chaveDisposicao(buscarPorId(this.estruturaSimulacao, no.id)) ?? no.id
        disposicao.posicoes[chave] = {
          x: no.position.x,
          y: no.position.y,
          ...(no.data?.posicaoArrastada ? { arrastada: true } : {}),
        }
        const largura = parseFloat(no.style?.width)
        const altura = parseFloat(no.style?.height)
        if (isFinite(largura) && isFinite(altura)) {
          disposicao.dimensoes[chave] = { width: largura, height: altura }
        }
        if (no.data?.recolhido) recolhidos.add(no.id)
      })

      const itens = mapearEstruturaParaItens(this.estruturaSimulacao)
      const idsComFilhos = new Set(itens.filter((i) => i.parentId).map((i) => i.parentId))
      itens.forEach((item) => {
        if (!idsNoFluxo.has(item.id) && idsComFilhos.has(item.id)) recolhidos.add(item.id)
      })

      this.disposicao = disposicao
      this.viewportAplicadoInicial = false
      this.idsRecolhidos = recolhidos
      this.limparDestaque()
      this.montarOrganograma()

      await this.$nextTick()
      await this.fromObject(fluxo)

      this.temAlteracoes = false
      this.emitirAlteracao()
    },

    marcarComoSalvo() {
      this.temAlteracoes = false
      this.emitirAlteracao()
    },

    // Posiciona e destaca a unidade. Se o id for de uma alocação (cargo),
    // destaca a unidade que a contém e abre "Editar alocações" com ela em foco.
    async focarNode(id) {
      const alvo = String(id)
      let unidade = this.itens.find((i) => i.id === alvo)
      let alocacaoId = null

      if (!unidade) {
        const unidadeId = this.encontrarUnidadeDaAlocacao(alvo)
        if (unidadeId == null) return
        alocacaoId = alvo
        unidade = this.itens.find((i) => mesmoId(i.id, unidadeId))
        if (!unidade) return
      }

      let paiId = unidade.parentId
      while (paiId) {
        this.idsRecolhidos.delete(String(paiId))
        const pai = this.itens.find((i) => mesmoId(i.id, paiId))
        paiId = pai ? pai.parentId : null
      }

      this.idDestacado = unidade.id
      this.reconstruir()
      await this.$nextTick()

      const no = this.findNode(unidade.id)
      if (no) {
        const largura = no.dimensions?.width || LARGURA_NO
        const altura = no.dimensions?.height || ALTURA_NO
        this.setCenter(no.position.x + largura / 2, no.position.y + altura / 2, {
          zoom: 1,
          duration: 600,
        })
      } else {
        this.fitView({ nodes: [unidade.id], duration: 600, padding: 0.5, maxZoom: 1 })
      }

      if (alocacaoId != null) {
        this.idAlocacaoDestacada = alocacaoId
        this.modalAlocacoes = { visivel: true, unidadeId: unidade.id }
      }
    },

    limparDestaque() {
      this.idDestacado = null
      this.idAlocacaoDestacada = null
    },

    adicionarNovaUnidade(unidadePai = null) {
      if (!this.interativo) return
      this.modalCadastro = { visivel: true, itemSelecionado: null, unidadePai }
    },

    // Status das caixas exibidas, na ordem de STATUS (legenda da exportação).
    statusExibidos() {
      const presentes = new Set(this.nodes.map((no) => no.data.status))
      return Object.values(STATUS).filter((status) => presentes.has(status))
    },

    // Caixa delimitadora das caixas exibidas, no espaço do fluxo: não depende
    // do zoom atual nem do tamanho da janela do navegador.
    obterCaixaDelimitadora() {
      const nos = this.getNodes
      if (!nos || nos.length === 0) return null

      let minX = Infinity
      let minY = Infinity
      let maxX = -Infinity
      let maxY = -Infinity
      nos.forEach((no) => {
        const largura = no.dimensions?.width || LARGURA_VISUAL_NO
        const altura = no.dimensions?.height || ALTURA_NO
        minX = Math.min(minX, no.position.x)
        minY = Math.min(minY, no.position.y)
        maxX = Math.max(maxX, no.position.x + largura)
        maxY = Math.max(maxY, no.position.y + altura)
      })
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
    },

    // Tamanho (px lógicos) da imagem gerada por capturarComoImagem, sem
    // capturar nada. Só usa o tamanho do container quando não há caixas.
    obterDimensaoExportacao() {
      const caixa = this.obterCaixaDelimitadora()
      if (caixa) {
        return {
          width: caixa.width + CAPTURA_PADDING_PX * 2,
          height: caixa.height + CAPTURA_PADDING_PX * 2,
        }
      }
      const container = this.$refs.containerFluxo
      return container ? { width: container.clientWidth, height: container.clientHeight } : null
    },

    // Captura o organograma inteiro em escala natural (zoom 1) para a
    // exportação em PDF/JPG, com o mesmo resultado qualquer que seja o zoom
    // ou o tamanho da janela. Usa html-to-image, recomendado pelo Vue Flow:
    // o html2canvas não desenha os <svg> das ligações.
    async capturarComoImagem(pixelRatio = 1) {
      const container = this.$refs.containerFluxo
      if (!container) throw new Error('Organograma não encontrado')
      await this.$nextTick()

      const caixa = this.obterCaixaDelimitadora()
      const viewportAnterior = caixa ? this.getViewport() : null
      const largura = caixa ? caixa.width + CAPTURA_PADDING_PX * 2 : container.clientWidth
      const altura = caixa ? caixa.height + CAPTURA_PADDING_PX * 2 : container.clientHeight
      const larguraOriginal = container.style.width
      const alturaOriginal = container.style.height

      try {
        if (caixa) {
          // O wrapper do Vue Flow tem overflow: hidden; sem aumentar o
          // container, a captura recortaria o que não cabe na tela.
          container.style.width = `${largura}px`
          container.style.height = `${altura}px`
          this.setViewport(
            { x: CAPTURA_PADDING_PX - caixa.x, y: CAPTURA_PADDING_PX - caixa.y, zoom: 1 },
            { duration: 0 },
          )
          await this.$nextTick()
        }

        const canvas = await toCanvas(container, {
          backgroundColor: this.disposicao.corFundo,
          pixelRatio,
          cacheBust: true,
          ...(caixa ? { width: largura, height: altura } : {}),
          filter: (elemento) =>
            !CLASSES_FORA_DA_CAPTURA.some((classe) => elemento.classList?.contains(classe)),
        })
        return { canvas, width: largura, height: altura, pixelRatio }
      } finally {
        container.style.width = larguraOriginal
        container.style.height = alturaOriginal
        if (viewportAnterior) this.setViewport(viewportAnterior, { duration: 0 })
      }
    },

    // ─────────────────────────────────────────────
    // Montagem dos nós e arestas
    // ─────────────────────────────────────────────

    montarOrganograma(renderizarTudo = true, remontarEstrutura = false) {
      this.itens = mapearEstruturaParaItens(this.estruturaSimulacao)
      if (remontarEstrutura) {
        if (renderizarTudo) this.idsRecolhidos = idsRecolhidosDaEstrutura(this.estruturaSimulacao)
        else if (this.disposicao.recolhidos) this.idsRecolhidos = this.recolhidosSalvos(this.itens)
        else this.idsRecolhidos = idsRecolhidosPadrao(this.itens)
      }
      this.reconstruir()
    },

    // Ids das unidades cuja chave de disposição foi gravada como recolhida.
    recolhidosSalvos(itens) {
      const recolhidos = new Set(this.disposicao.recolhidos)
      return new Set(
        itens
          .filter((item) => recolhidos.has(String(this.chaveDisposicao(item) ?? item.id)))
          .map((item) => item.id),
      )
    },

    reconstruir() {
      const visiveis = itensVisiveis(this.itens, this.idsRecolhidos).filter((i) => i && i.id)
      if (visiveis.length === 0) {
        this.nodes = []
        this.edges = []
        return
      }

      const posicoes = this.calcularPosicoes(visiveis)

      this.nodes = visiveis.map((item) => {
        const alocacoes = agruparAlocacoesPorSimbolo(item.alocacoes || [])
        const chave = this.chaveDisposicao(item)
        const dimensaoSalva = this.disposicao.dimensoes[chave]
        const status = item.status || STATUS.ATUAL

        // Só caixas redimensionadas pelo usuário têm width/height fixos. As
        // demais usam a largura padrão e altura automática: impor uma altura
        // fixa a cada reconstrução desfaria a correção de min-height que o
        // NodeResizer registra internamente, e o rodapé vazaria da caixa.
        const style = dimensaoSalva
          ? { width: `${dimensaoSalva.width}px`, height: `${dimensaoSalva.height}px` }
          : { width: `${LARGURA_VISUAL_NO}px` }

        return {
          id: item.id,
          type: 'org',
          position: posicoes.get(item.id),
          style,
          data: {
            sigla: item.sigla || '',
            nome: item.nome || '',
            quantidadeFilhos: this.quantidadeFilhos(item.id),
            recolhido: this.idsRecolhidos.has(item.id),
            status,
            alocacoes,
            temAlocacoes: Object.keys(alocacoes).length > 0,
            posicaoArrastada: Boolean(this.disposicao.posicoes[chave]?.arrastada),
          },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
          class: `org-node--status-${this.classeStatus(status)}`,
        }
      })

      // Aresta customizada (#edge-flutuante): o ponto de conexão é calculado
      // pela lateral mais próxima de cada nó, ajustando-se ao arrastar.
      this.edges = visiveis
        .filter((item) => item.parentId)
        .map((item) => ({
          id: `e${item.parentId}-${item.id}`,
          source: item.parentId,
          target: item.id,
          type: 'flutuante',
        }))

      this.centralizarFlow()
    },

    classeStatus(status) {
      return (status || STATUS.ATUAL).replace('/', '-')
    },

    quantidadeFilhos(id) {
      return this.itens.filter((item) => item.parentId === id).length
    },

    alternarRecolhimento(id) {
      if (this.idsRecolhidos.has(id)) this.idsRecolhidos.delete(id)
      else this.idsRecolhidos.add(id)
      this.reconstruir()
      if (!this.interativo) return
      this.marcarAlteracao()
    },

    caminhoConexao(edgeProps) {
      const origem = buscarPorId(this.estruturaSimulacao, edgeProps.sourceNode?.id)
      const destino = buscarPorId(this.estruturaSimulacao, edgeProps.targetNode?.id)
      const posicoes = this.disposicao.posicoes
      return obterCaminhoConexaoFlutuante(edgeProps.sourceNode, edgeProps.targetNode, {
        origemMovida: Boolean(
          posicoes[this.chaveDisposicao(origem) ?? edgeProps.sourceNode?.id]?.arrastada,
        ),
        destinoMovido: Boolean(
          posicoes[this.chaveDisposicao(destino) ?? edgeProps.targetNode?.id]?.arrastada,
        ),
      })
    },

    // ─────────────────────────────────────────────
    // Eventos do Vue Flow
    // ─────────────────────────────────────────────

    onNodesChange(mudancas) {
      const proximas = mudancas.filter((m) => m.type !== 'remove')

      // Linhas-guia: recalculadas só quando há uma única mudança de posição
      // em andamento (arraste ativo).
      this.linhaAuxiliarHorizontal = undefined
      this.linhaAuxiliarVertical = undefined

      const [primeira] = proximas
      if (
        proximas.length === 1 &&
        primeira.type === 'position' &&
        primeira.dragging &&
        primeira.position
      ) {
        const linhas = obterLinhasAuxiliares(primeira, this.nodes)
        if (linhas.posicaoEncaixe.x !== undefined) primeira.position.x = linhas.posicaoEncaixe.x
        if (linhas.posicaoEncaixe.y !== undefined) primeira.position.y = linhas.posicaoEncaixe.y
        this.linhaAuxiliarHorizontal = linhas.horizontal
        this.linhaAuxiliarVertical = linhas.vertical
        this.marcarAlteracao()
      }

      this.applyNodeChanges(proximas)
    },

    onEdgesChange(mudancas) {
      this.applyEdgeChanges(mudancas.filter((m) => m.type !== 'remove'))
    },

    onFlowInit() {
      this.flowInicializado = true
      this.centralizarFlow()
    },

    // Na primeira centralização após um carregamento, restaura o zoom e o
    // deslocamento gravados. Nas demais, enquadra todos os nós.
    centralizarFlow() {
      if (!this.flowInicializado) return
      this.$nextTick(() => {
        if (!this.flowInicializado) return
        if (!this.viewportAplicadoInicial && this.disposicao.viewport) {
          this.setViewport(this.disposicao.viewport)
        } else {
          this.fitView({ padding: 0.2, duration: 500 })
        }
        this.viewportAplicadoInicial = true
      })
    },

    // Grava o zoom/deslocamento assim que o usuário para de mover/ampliar.
    onViewportChangeEnd(viewport) {
      const anterior = this.disposicao.viewport
      this.disposicao.viewport = { x: viewport.x, y: viewport.y, zoom: viewport.zoom }
      if (!this.interativo) return
      if (
        anterior &&
        anterior.x === viewport.x &&
        anterior.y === viewport.y &&
        anterior.zoom === viewport.zoom
      ) {
        return
      }
      this.marcarAlteracao()
    },

    // Os botões de zoom/enquadramento alteram o viewport programaticamente,
    // sem emitir viewport-change-end.
    onControlesViewportChange() {
      this.onViewportChangeEnd(this.getViewport())
    },

    onCorFundoChange(cor) {
      this.disposicao.corFundo = cor
      this.marcarAlteracao()
    },

    // O NodeResizer também pode mover a origem do nó (ao puxar pelo lado
    // esquerdo/superior), por isso a posição resultante também é gravada.
    onNodeResizeEnd(id, { params }) {
      if (!this.interativo) return
      const item = buscarPorId(this.estruturaSimulacao, id)
      const chave = this.chaveDisposicao(item) ?? id
      // O NodeResizer informa a última altura calculada pelo arraste, que
      // pode ser menor que a corrigida pelo novo mínimo da caixa.
      const height = Math.max(params.height, this.alturasMinimasNos[id] ?? 0)
      this.disposicao.dimensoes[chave] = { width: params.width, height }
      if (isFinite(params.x) && isFinite(params.y)) {
        this.disposicao.posicoes[chave] = {
          ...this.disposicao.posicoes[chave],
          x: params.x,
          y: params.y,
        }
      }
      this.marcarAlteracao()
    },

    alturaMinimaDoNo(id) {
      return this.alturasMinimasNos[id] ?? this.alturaMinimaNo
    },

    // Recalcula, na largura em redimensionamento, a altura mínima da caixa:
    // ao estreitá-la o conteúdo quebra linha e precisa de mais altura. O
    // NodeResizer limita o arraste a esse mínimo e corrige a altura do nó
    // quando ele muda.
    onNodeResize(id, { params }) {
      const alturaConteudo = this.medirAlturaConteudoNo(id, params.width)
      this.alturasMinimasNos[id] = Math.max(ALTURA_MINIMA_NO, alturaConteudo)
    },

    // Altura natural do conteúdo da caixa (.org-node) em uma dada largura.
    // Os estilos são trocados e restaurados de forma síncrona, sem pintura
    // intermediária; a transição é desligada para que a leitura reflita a
    // largura informada, e não um valor intermediário da animação.
    medirAlturaConteudoNo(id, largura) {
      const caixa = this.$el?.querySelector?.(`.org-node[data-id="${id}"]`)
      if (!caixa) return 0
      const estiloOriginal = caixa.style.cssText
      caixa.style.transition = 'none'
      caixa.style.width = `${largura}px`
      caixa.style.height = 'auto'
      caixa.style.minHeight = '0'
      const altura = caixa.offsetHeight
      caixa.style.cssText = estiloOriginal
      return Math.ceil(altura)
    },

    onNodeClick({ node }) {
      this.idSelecionado = node.id
    },

    onNodeDragStart({ node }) {
      if (!this.interativo) return
      this.idArrastado = node.id
      this.arrastando = true
      this.posicaoPonteiro = null
    },

    // Feedback visual: destaca a caixa sob o ponteiro quando ela pode
    // receber a unidade arrastada como subordinada.
    onNodeDrag({ event }) {
      if (!this.interativo) return
      this.limparAlvosDeSoltura()
      this.posicaoPonteiro = { x: event.clientX, y: event.clientY }

      if (!this.arrastando || !this.idArrastado) return
      const idAlvo = this.idNoSobPonteiro(this.idArrastado)
      if (idAlvo && this.conexaoValida({ source: idAlvo, target: this.idArrastado })) {
        this.$el
          .querySelector(`.org-node[data-id="${idAlvo}"]`)
          ?.classList.add('org-node--drop-target')
      }
    },

    // Ao soltar: grava a posição manual e, se houver caixa válida sob o
    // ponteiro, a unidade arrastada passa a ser subordinada dela.
    onNodeDragStop({ node }) {
      if (!this.interativo) return
      this.arrastando = false
      this.limparAlvosDeSoltura()

      // `arrastada` distingue o arraste das posições fixadas automaticamente
      // e habilita a entrada lateral da conexão (ver caminhoConexao).
      if (node?.position) {
        const item = buscarPorId(this.estruturaSimulacao, node.id)
        this.disposicao.posicoes[this.chaveDisposicao(item) ?? node.id] = {
          x: node.position.x,
          y: node.position.y,
          arrastada: true,
        }
      }

      const idAlvo = this.posicaoPonteiro ? this.idNoSobPonteiro(node.id) : null
      if (idAlvo) this.reestruturar(node.id, idAlvo)

      this.idArrastado = null
      this.posicaoPonteiro = null
    },

    idNoSobPonteiro(idIgnorado) {
      const { x, y } = this.posicaoPonteiro
      for (const elemento of document.elementsFromPoint(x, y)) {
        const id = elemento.closest('[data-id]')?.dataset.id
        if (id && id !== idIgnorado) return id
      }
      return null
    },

    limparAlvosDeSoltura() {
      this.$el
        ?.querySelectorAll?.('.org-node--drop-target')
        .forEach((el) => el.classList.remove('org-node--drop-target'))
    },

    reestruturar(idArrastado, idAlvo) {
      if (!this.conexaoValida({ source: idAlvo, target: idArrastado })) return

      const alvo = buscarPorId(this.estruturaSimulacao, idAlvo)
      if (!alvo || alvo.status === STATUS.EXTINCAO || alvo.status === 'Extinto') return

      const itemArrastado = this.itens.find((i) => i.id === idArrastado)
      if (!itemArrastado || itemArrastado.parentId === idAlvo) return

      // A reestruturação descarta a posição da unidade e dos descendentes:
      // eles são reposicionados junto do novo pai sem sobrepor as demais
      // caixas, que ficam fixas onde estão (ver calcularPosicoes).
      this.fixarPosicoesAtuais()
      const chavesAnteriores = this.removerPosicoesDaSubarvore(
        buscarPorId(this.estruturaSimulacao, idArrastado),
      )

      if (!moverItem(this.estruturaSimulacao, idArrastado, idAlvo)) return

      // Chaves de itens acrescidos dependem do pai: migra as dimensões.
      chavesAnteriores.forEach(({ item, chave }) => {
        const chaveNova = this.chaveDisposicao(item)
        if (chaveNova !== chave && this.disposicao.dimensoes[chave]) {
          this.disposicao.dimensoes[chaveNova] = this.disposicao.dimensoes[chave]
          delete this.disposicao.dimensoes[chave]
        }
      })

      this.idsRecolhidos.delete(idAlvo)
      this.montarOrganograma()
      this.marcarAlteracao()
    },

    // Impede vincular uma unidade a ela mesma ou a um descendente (ciclo).
    conexaoValida({ source, target }) {
      if (!source || !target || source === target) return false
      return !idsDescendentes(this.itens, target).includes(source)
    },

    // ─────────────────────────────────────────────
    // Disposição visual (posições e dimensões)
    // ─────────────────────────────────────────────

    // Chave usada em disposicao.posicoes/dimensoes. Itens acrescidos ainda
    // não têm id definitivo (o backend atribui um id novo a cada gravação
    // enquanto o item não for aprovado), então usam a sigla — qualificada
    // pela chave do pai e pela ordem entre irmãos acrescidos de mesma sigla.
    chaveDisposicao(item) {
      if (!item) return null
      if (item.status !== STATUS.ACRESCIMO || !item.sigla) return String(item.id)

      const pai = encontrarPai(this.estruturaSimulacao, item.id)
      const irmaos = pai ? pai.filhos || [] : this.estruturaSimulacao
      const ordem =
        irmaos
          .filter(
            (i) => i.tipo === item.tipo && i.status === STATUS.ACRESCIMO && i.sigla === item.sigla,
          )
          .findIndex((i) => mesmoId(i.id, item.id)) + 1

      const chave = pai ? `${this.chaveDisposicao(pai)}>sigla:${item.sigla}` : `sigla:${item.sigla}`
      return ordem > 1 ? `${chave}#${ordem}` : chave
    },

    // Grava a posição atual das caixas que ainda seguem o layout automático.
    // Incluir/mover uma unidade recalcula a árvore, o que desfaria a
    // organização montada pelo usuário.
    fixarPosicoesAtuais() {
      this.nodes.forEach((no) => {
        const item = buscarPorId(this.estruturaSimulacao, no.id)
        const chave = this.chaveDisposicao(item) ?? no.id
        if (this.disposicao.posicoes[chave]) return

        const posicao = this.findNode(no.id)?.position || no.position
        if (posicao && isFinite(posicao.x) && isFinite(posicao.y)) {
          this.disposicao.posicoes[chave] = { x: posicao.x, y: posicao.y }
        }
      })
    },

    // Posição final de cada item visível. A disposição gravada tem
    // prioridade; sem ela vale o layout automático, exceto para itens cujo
    // pai já tem posição definida (unidade nova ou movida): esses são
    // posicionados junto do pai sem sobrepor outras caixas. `itens` deve
    // estar em pré-ordem (pais antes dos filhos).
    calcularPosicoes(itens) {
      const automaticas = calcularPosicoesArvore(itens)
      const posicoes = new Map()
      const salvos = new Set()
      const pendentes = new Set()

      itens.forEach((item) => {
        const salva = this.disposicao.posicoes[this.chaveDisposicao(item)]
        if (salva && isFinite(salva.x) && isFinite(salva.y)) {
          posicoes.set(item.id, { x: salva.x, y: salva.y })
          salvos.add(item.id)
        } else if (item.parentId && (salvos.has(item.parentId) || pendentes.has(item.parentId))) {
          pendentes.add(item.id)
        } else {
          const auto = automaticas.get(item.id)
          posicoes.set(item.id, {
            x: auto && isFinite(auto.x) ? auto.x : 0,
            y: auto && isFinite(auto.y) ? auto.y : 0,
          })
        }
      })

      itens
        .filter((item) => pendentes.has(item.id) && !pendentes.has(item.parentId))
        .forEach((raiz) => this.posicionarSubarvore(raiz, itens, pendentes, posicoes))

      return posicoes
    },

    // Dimensão de uma caixa: medida pelo Vue Flow, redimensionada ou padrão.
    dimensaoDoItem(item) {
      const noFlow = this.findNode(String(item.id))
      const dimensao = this.disposicao.dimensoes[this.chaveDisposicao(item)]
      return {
        largura: noFlow?.dimensions?.width || dimensao?.width || LARGURA_VISUAL_NO,
        altura: noFlow?.dimensions?.height || dimensao?.height || ALTURA_NO,
      }
    },

    // Posiciona uma subárvore pendente (sem posição, com pai posicionado)
    // mantendo o formato do layout automático, como um bloco:
    // - primeiro filho: centralizado abaixo do pai;
    // - com irmãos: vai à direita do grupo, ou à esquerda quando já há mais
    //   irmãos à direita do centro do pai do que à esquerda.
    // Os irmãos não se movem; se faltar espaço, os ramos vizinhos são
    // empurrados para o lado (ver abrirEspacoParaSubarvore).
    posicionarSubarvore(raiz, itens, pendentes, posicoes) {
      const itensPorId = new Map(itens.map((i) => [i.id, i]))
      const retangulo = (id) => ({
        ...posicoes.get(id),
        ...this.dimensaoDoItem(itensPorId.get(id)),
      })

      const subarvore = []
      const coletar = (id) => {
        subarvore.push(itensPorId.get(id))
        itens.forEach((i) => {
          if (i.parentId === id && pendentes.has(i.id)) coletar(i.id)
        })
      }
      coletar(raiz.id)

      const layout = calcularPosicoesArvore(
        subarvore.map((i) => (i.id === raiz.id ? { ...i, parentId: null } : i)),
      )
      const origem = layout.get(raiz.id)
      const relativas = subarvore.map((i) => ({
        item: i,
        x: layout.get(i.id).x - origem.x,
        y: layout.get(i.id).y - origem.y,
      }))
      const minX = Math.min(...relativas.map((r) => r.x))
      const maxX = Math.max(...relativas.map((r) => r.x)) + LARGURA_VISUAL_NO

      const pai = retangulo(raiz.parentId)
      const centroPai = pai.x + pai.largura / 2
      const irmaos = itens.filter(
        (i) => i.parentId === raiz.parentId && i.id !== raiz.id && posicoes.has(i.id),
      )

      let xRaiz, y
      if (irmaos.length > 0) {
        // Extensão de cada irmão com a sua subárvore exibida, para que o
        // novo bloco não fique sobre os sobrinhos.
        const extensoes = irmaos.map((i) => {
          const caixas = this.coletarVisiveis([i.id], itens, posicoes).map(retangulo)
          const propria = retangulo(i.id)
          return {
            centro: propria.x + propria.largura / 2,
            y: propria.y,
            esquerda: Math.min(...caixas.map((c) => c.x)),
            direita: Math.max(...caixas.map((c) => c.x + c.largura)),
          }
        })
        const aDireita = extensoes.filter((e) => e.centro > centroPai + 1).length
        const aEsquerda = extensoes.filter((e) => e.centro < centroPai - 1).length
        y = extensoes[0].y
        xRaiz =
          aDireita > aEsquerda
            ? Math.min(...extensoes.map((e) => e.esquerda)) - ESPACO_HORIZONTAL - maxX
            : Math.max(...extensoes.map((e) => e.direita)) + ESPACO_HORIZONTAL - minX
      } else {
        // Mesma distância entre linhas do layout automático (e não a altura
        // real do pai), para alinhar o topo ao das caixas vizinhas.
        const distanciaDoPai = Math.max(
          ALTURA_NO + ESPACO_VERTICAL,
          pai.altura + ESPACO_MINIMO_ABAIXO_DO_PAI,
        )
        xRaiz = centroPai - LARGURA_VISUAL_NO / 2
        y = pai.y + distanciaDoPai
      }

      relativas.forEach(({ item, x, y: dy }) => {
        const posicao = { x: xRaiz + x, y: y + dy }
        posicoes.set(item.id, posicao)
        this.disposicao.posicoes[this.chaveDisposicao(item)] = posicao
      })

      this.abrirEspacoParaSubarvore(
        raiz.parentId,
        subarvore.map((i) => i.id),
        itens,
        posicoes,
        retangulo,
      )
    },

    // Ids exibidos (com posição) das unidades informadas e descendentes.
    coletarVisiveis(ids, itens, posicoes) {
      const visiveis = []
      const coletar = (id) => {
        visiveis.push(id)
        itens.forEach((i) => {
          if (i.parentId === id && posicoes.has(i.id)) coletar(i.id)
        })
      }
      ids.forEach(coletar)
      return visiveis
    },

    // Abre espaço para a subárvore recém-posicionada empurrando os ramos
    // vizinhos: em cada nível do caminho entre o pai e a raiz, os irmãos do
    // ancestral à direita (com a subárvore) vão para a direita e os à
    // esquerda, para a esquerda — a distância mínima para voltar a haver
    // ESPACO_HORIZONTAL entre as caixas. Pai, ancestrais e irmãos não se movem.
    abrirEspacoParaSubarvore(paiId, idsNovos, itens, posicoes, retangulo) {
      const itensPorId = new Map(itens.map((i) => [i.id, i]))
      const mesmoPai = (a, b) => (a.parentId || '') === (b.parentId || '')

      const ramosDireita = []
      const ramosEsquerda = []
      let ancestral = itensPorId.get(paiId)
      while (ancestral) {
        const xAncestral = posicoes.get(ancestral.id)?.x
        itens
          .filter((i) => i.id !== ancestral.id && mesmoPai(i, ancestral) && posicoes.has(i.id))
          .forEach((i) => {
            if (posicoes.get(i.id).x > xAncestral) ramosDireita.push(i)
            else if (posicoes.get(i.id).x < xAncestral) ramosEsquerda.push(i)
          })
        ancestral = ancestral.parentId ? itensPorId.get(ancestral.parentId) : null
      }

      const novos = idsNovos.map(retangulo)
      const visiveisDireita = this.coletarVisiveis(
        ramosDireita.map((r) => r.id),
        itens,
        posicoes,
      )
      const visiveisEsquerda = this.coletarVisiveis(
        ramosEsquerda.map((r) => r.id),
        itens,
        posicoes,
      )

      let deslocamentoDireita = 0
      visiveisDireita.map(retangulo).forEach((r) =>
        novos.forEach((a) => {
          if (colide(a, r, FOLGA_MINIMA_ENTRE_CAIXAS)) {
            deslocamentoDireita = Math.max(
              deslocamentoDireita,
              a.x + a.largura + ESPACO_HORIZONTAL - r.x,
            )
          }
        }),
      )
      let deslocamentoEsquerda = 0
      visiveisEsquerda.map(retangulo).forEach((r) =>
        novos.forEach((a) => {
          if (colide(a, r, FOLGA_MINIMA_ENTRE_CAIXAS)) {
            deslocamentoEsquerda = Math.max(
              deslocamentoEsquerda,
              r.x + r.largura + ESPACO_HORIZONTAL - a.x,
            )
          }
        }),
      )

      if (deslocamentoDireita > 0) {
        this.deslocarRamos(ramosDireita, visiveisDireita, deslocamentoDireita, itensPorId, posicoes)
      }
      if (deslocamentoEsquerda > 0) {
        this.deslocarRamos(
          ramosEsquerda,
          visiveisEsquerda,
          -deslocamentoEsquerda,
          itensPorId,
          posicoes,
        )
      }
    },

    // Desloca horizontalmente os ramos (caixas exibidas e descendentes
    // recolhidos com posição gravada), preservando os demais dados gravados
    // (ex.: `arrastada`).
    deslocarRamos(ramos, idsVisiveis, deslocamento, itensPorId, posicoes) {
      const deslocarPosicaoGravada = (item, posicaoAtual) => {
        const chave = this.chaveDisposicao(item)
        const base = posicaoAtual || this.disposicao.posicoes[chave]
        if (!base) return null
        const nova = { ...this.disposicao.posicoes[chave], x: base.x + deslocamento, y: base.y }
        this.disposicao.posicoes[chave] = nova
        return nova
      }

      const visiveis = new Set(idsVisiveis)
      visiveis.forEach((id) => {
        const nova = deslocarPosicaoGravada(itensPorId.get(id), posicoes.get(id))
        posicoes.set(id, { x: nova.x, y: nova.y })
      })

      // Descendentes recolhidos acompanham o ramo, para não ficarem para
      // trás ao expandir.
      const deslocarRecolhidos = (no) => {
        ;(no?.filhos || [])
          .filter((f) => f.tipo === 'unit')
          .forEach((filho) => {
            if (!visiveis.has(String(filho.id))) deslocarPosicaoGravada(filho, null)
            deslocarRecolhidos(filho)
          })
      }
      ramos.forEach((r) => deslocarRecolhidos(buscarPorId(this.estruturaSimulacao, r.id)))
    },

    // Remove as posições gravadas da unidade e das unidades descendentes,
    // retornando a chave anterior de cada uma.
    removerPosicoesDaSubarvore(item) {
      if (!item) return []
      const chave = this.chaveDisposicao(item)
      delete this.disposicao.posicoes[chave]
      const filhos = (item.filhos || []).filter((f) => f.tipo === 'unit')
      return [{ item, chave }, ...filhos.flatMap((f) => this.removerPosicoesDaSubarvore(f))]
    },

    // ─────────────────────────────────────────────
    // Regras de exibição das ações
    // ─────────────────────────────────────────────

    podeExibir(acao, id) {
      const item = buscarPorId(this.estruturaSimulacao, id)
      if (!item) return false
      const extinto = item.status === STATUS.EXTINCAO
      const existeNaEstruturaAtual = Boolean(item.snapshotId)

      if (acao === 'editar') return !extinto
      if (acao === 'restaurar') {
        return existeNaEstruturaAtual && (item.status === STATUS.ALTERACAO || extinto)
      }
      if (acao === 'excluir') return item.status === STATUS.ACRESCIMO && !existeNaEstruturaAtual

      if (item.tipo === 'unit') {
        if (acao === 'extinguir') return existeNaEstruturaAtual && !extinto
        if (acao === 'adicionar') return !extinto
      } else if (acao === 'liberar') {
        return item.status !== STATUS.ACRESCIMO && existeNaEstruturaAtual && !extinto
      }
      return false
    },

    // ─────────────────────────────────────────────
    // Incluir / editar
    // ─────────────────────────────────────────────

    addUnidade(id) {
      this.adicionarNovaUnidade(buscarPorId(this.estruturaSimulacao, id))
    },

    editarItem(id) {
      this.modalCadastro = {
        visivel: true,
        itemSelecionado: buscarPorId(this.estruturaSimulacao, id),
        unidadePai: null,
      }
    },

    fecharModalCadastro() {
      this.modalCadastro = { visivel: false, itemSelecionado: null, unidadePai: null }
    },

    aoEnviarModalCadastro(dados) {
      const ehCargo = dados.modo === 'cargo'
      const { itemSelecionado, unidadePai } = this.modalCadastro

      if (itemSelecionado) {
        if (ehCargo) {
          itemSelecionado.rotulo = montarRotuloCargo(dados) || itemSelecionado.rotulo
          itemSelecionado.nome = dados.nomeCargo
          itemSelecionado.nomeCargo = dados.nomeCargo
          itemSelecionado.simbolo = dados.simbolo
          itemSelecionado.nivelAtuacao = dados.nivelAtuacao
          itemSelecionado.tipoSimboloDescricao = dados.tipoSimboloDescricao
          itemSelecionado.tipoSimboloSigla = dados.tipoSimboloSigla
        } else {
          itemSelecionado.rotulo = montarRotuloUnidade(dados) || itemSelecionado.rotulo
          itemSelecionado.nome = dados.nomeUnidade
          itemSelecionado.nomeUnidade = dados.nomeUnidade
          itemSelecionado.tipoUnidade = dados.tipoUnidade
          itemSelecionado.tipoUnidadeId = dados.tipoUnidadeId
        }
        itemSelecionado.sigla = dados.sigla
        itemSelecionado.preenchidoManualmente = dados.preenchidoManualmente
        if (itemSelecionado.status !== STATUS.ACRESCIMO) itemSelecionado.status = STATUS.ALTERACAO
        notificacao.sucesso(
          `${ehCargo ? 'Cargo/Função alterado' : 'Unidade alterada'} com sucesso.`,
        )
      } else {
        // Fixa as caixas atuais para que a nova unidade seja posicionada
        // junto do pai sem reorganizar a árvore (ver calcularPosicoes).
        if (!ehCargo) this.fixarPosicoesAtuais()

        const novoItem = {
          id: proximoId(this.estruturaSimulacao),
          tipo: ehCargo ? 'role' : 'unit',
          rotulo: (ehCargo ? montarRotuloCargo(dados) : montarRotuloUnidade(dados)) || dados.sigla,
          status: STATUS.ACRESCIMO,
          expandido: true,
          preenchidoManualmente: dados.preenchidoManualmente,
          sigla: dados.sigla,
          nomeCargo: dados.nomeCargo,
          simbolo: dados.simbolo,
          nivelAtuacao: dados.nivelAtuacao,
          tipoSimboloDescricao: dados.tipoSimboloDescricao,
          tipoSimboloSigla: dados.tipoSimboloSigla,
          nome: dados.nomeUnidade,
          tipoUnidade: dados.tipoUnidade,
          tipoUnidadeId: dados.tipoUnidadeId,
        }
        if (!ehCargo) novoItem.filhos = []

        if (unidadePai) {
          if (!unidadePai.filhos) unidadePai.filhos = []
          inserirOrdenado(unidadePai.filhos, novoItem)
          unidadePai.expandido = true
          this.idsRecolhidos.delete(String(unidadePai.id))
        } else {
          inserirOrdenado(this.estruturaSimulacao, novoItem)
        }
        notificacao.sucesso(
          `${ehCargo ? 'Cargo/Função adicionado' : 'Unidade adicionada'} com sucesso.`,
        )
      }

      this.montarOrganograma()
      this.fecharModalCadastro()
      this.marcarAlteracao()
    },

    // ─────────────────────────────────────────────
    // Excluir / extinguir / liberar / restaurar
    // ─────────────────────────────────────────────

    async excluirNode(id) {
      const item = buscarPorId(this.estruturaSimulacao, id)
      const confirmado = await confirmar({
        titulo: 'Excluir item',
        pergunta: 'Deseja excluir',
        destaque: item.rotulo,
        detalhe: item.filhos?.length
          ? 'Todos os itens acrescidos vinculados também serão excluídos e os demais serão movidos para o item superior.'
          : '',
        textoConfirmar: 'Sim, excluir',
      })
      if (!confirmado) return

      this.excluirNodeEFilhos(id)
      this.montarOrganograma()
      notificacao.sucesso('Item(ns) excluído(s) com sucesso.')
      this.marcarAlteracao()
    },

    // Só itens acrescidos são removidos; os demais filhos de uma unidade
    // acrescida excluída sobem para o item superior.
    excluirNodeEFilhos(id, parentId = null) {
      if (parentId == null) parentId = encontrarPaiPorId(this.estruturaSimulacao, id)
      const item = buscarPorId(this.estruturaSimulacao, id)
      if (!item) return

      ;[...(item.filhos || [])].forEach((filho) => {
        if (filho?.id != null) this.excluirNodeEFilhos(filho.id, item.id)
      })

      if (item.status !== STATUS.ACRESCIMO) return
      if (item.tipo === 'unit' && item.filhos?.length) {
        const pai = buscarPorId(this.estruturaSimulacao, parentId)
        if (pai) this.reatribuirFilhosParaPai(item, pai)
      }
      removerDaEstrutura(this.estruturaSimulacao, id)
    },

    reatribuirFilhosParaPai(no, pai) {
      ;(no.filhos || []).forEach((filho) => {
        if (filho.status !== STATUS.ACRESCIMO) pai.filhos.push(filho)
        else this.reatribuirFilhosParaPai(filho, pai)
      })
    },

    async extinguir(id) {
      const item = buscarPorId(this.estruturaSimulacao, id)
      if (!item) return
      const confirmado = await confirmar({
        titulo: 'Extinguir unidade',
        pergunta: 'Deseja extinguir a unidade',
        destaque: item.rotulo,
        detalhe: item.filhos?.length
          ? 'Todos os itens vinculados também serão extintos e itens acrescidos serão excluídos.'
          : '',
        textoConfirmar: 'Sim, extinguir',
      })
      if (!confirmado) return

      this.marcarExtinto(item)
      notificacao.sucesso('Unidade extinta com sucesso.')
      this.montarOrganograma()
      this.marcarAlteracao()
    },

    async liberarCargo(item) {
      const confirmado = await confirmar({
        titulo: 'Liberar cargo/função',
        pergunta: 'Deseja liberar o cargo/função',
        destaque: item.rotulo,
        textoConfirmar: 'Sim, liberar',
      })
      if (!confirmado) return

      this.marcarExtinto(item)
      notificacao.sucesso('Cargo/Função liberado com sucesso.')
      this.montarOrganograma()
      this.marcarAlteracao()
    },

    // Itens existentes passam a "Extincao"; itens acrescidos são removidos
    // (os filhos não acrescidos sobem para o pai).
    marcarExtinto(item) {
      ;[...(item.filhos || [])].forEach((filho) => this.marcarExtinto(filho))

      if (item.status !== STATUS.ACRESCIMO) {
        item.status = STATUS.EXTINCAO
        return
      }
      if (item.filhos?.length) {
        const pai = encontrarPai(this.estruturaSimulacao, item.id)
        if (pai) {
          if (!pai.filhos) pai.filhos = []
          pai.filhos.push(...item.filhos.filter((f) => f.status !== STATUS.ACRESCIMO))
        }
      }
      removerDaEstrutura(this.estruturaSimulacao, item.id)
    },

    async restaurar(id) {
      const item = buscarPorId(this.estruturaSimulacao, id)
      if (!item) return
      const confirmado = await confirmar({
        titulo: 'Restaurar item',
        pergunta: 'Deseja restaurar para o estado original da estrutura atual o item',
        destaque: item.rotulo,
        textoConfirmar: 'Sim, restaurar',
        variante: 'primary',
        icone: 'bi-question-circle',
      })
      if (!confirmado) return

      const eraExtinto = item.status === STATUS.EXTINCAO
      const paiAtual = encontrarPai(this.estruturaSimulacao, item.id)
      if (paiAtual?.status === STATUS.EXTINCAO) {
        notificacao.erro(
          item.tipo === 'unit'
            ? 'Não é possível restaurar uma unidade cuja unidade superior está extinta.'
            : 'Não é possível restaurar um cargo/função alocado em uma unidade extinta.',
        )
        return
      }

      this.validarStatusFilho(item)
      if (eraExtinto && item.tipo === 'unit') this.restaurarFilhosExtintos(item)

      notificacao.sucesso(
        item.tipo === 'unit'
          ? 'Unidade restaurada com sucesso.'
          : 'Cargo/Função restaurado com sucesso.',
      )
      this.montarOrganograma()
      this.marcarAlteracao()
    },

    aplicarSnapshot(item, snapshot) {
      if (item.tipo === 'unit') {
        item.nome = snapshot.nome
        item.nomeUnidade = snapshot.nome
        item.sigla = snapshot.sigla
        item.tipoUnidade = snapshot.tipoUnidade
        item.rotulo = montarRotuloUnidade(snapshot)
      } else {
        item.nomeCargo = snapshot.nomeCargo
        item.simbolo = snapshot.simbolo
        item.sigla = snapshot.sigla
        item.nivelAtuacao = snapshot.nivelAtuacao
        item.tipoSimboloDescricao = snapshot.tipoSimboloDescricao
        item.rotulo = montarRotuloCargo(snapshot) || item.rotulo
      }
    },

    // Restaura os dados do item a partir da estrutura atual. Continua
    // "Alteracao" se estiver sob um pai diferente do original.
    validarStatusFilho(filho) {
      const idPaiOriginal = encontrarPaiPorId(this.estruturaAtual, filho.snapshotId || filho.id)
      const idPaiAtual = encontrarPaiPorId(this.estruturaSimulacao, filho.id)
      const paiAtual = buscarPorId(this.estruturaSimulacao, idPaiAtual)

      if (filho.snapshotId) {
        const snapshot = buscarPorId(this.estruturaAtual, filho.snapshotId)
        if (snapshot) this.aplicarSnapshot(filho, snapshot)
      }

      if (idPaiOriginal == null && paiAtual == null) filho.status = STATUS.ATUAL
      else if (paiAtual && mesmoId(idPaiOriginal, paiAtual.snapshotId || idPaiAtual)) {
        filho.status = STATUS.ATUAL
      } else filho.status = STATUS.ALTERACAO
    },

    restaurarFilhosExtintos(item) {
      ;(item.filhos || []).forEach((filho) => {
        if (filho.status !== STATUS.EXTINCAO || !filho.snapshotId) return
        this.validarStatusFilho(filho)
        if (filho.tipo === 'unit') this.restaurarFilhosExtintos(filho)
      })
    },

    // ─────────────────────────────────────────────
    // Modal "Editar alocações"
    // ─────────────────────────────────────────────

    abrirAlocacoes(id) {
      if (!extrairAlocacoes(buscarPorId(this.estruturaSimulacao, id)).length) return
      this.idAlocacaoDestacada = null
      this.modalAlocacoes = { visivel: true, unidadeId: id }
    },

    encontrarUnidadeDaAlocacao(alocacaoId) {
      const percorrer = (nos) => {
        for (const no of nos || []) {
          if (no.tipo !== 'unit') continue
          if (extrairAlocacoes(no).some((a) => mesmoId(a.id, alocacaoId))) return no.id
          const encontrado = percorrer(no.filhos)
          if (encontrado != null) return encontrado
        }
        return null
      }
      return percorrer(this.estruturaSimulacao)
    },

    fecharModalAlocacoes() {
      this.modalAlocacoes = { visivel: false, unidadeId: null }
      this.idAlocacaoDestacada = null
    },

    editarAlocacao(id) {
      if (!this.interativo) return
      this.fecharModalAlocacoes()
      this.editarItem(id)
    },

    async excluirAlocacao(id) {
      if (!this.interativo) return
      const item = buscarPorId(this.estruturaSimulacao, id)
      const confirmado = await confirmar({
        titulo: 'Excluir item',
        pergunta: 'Deseja excluir',
        destaque: item.rotulo,
        textoConfirmar: 'Sim, excluir',
      })
      if (!confirmado) return

      this.fecharModalAlocacoes()
      removerDaEstrutura(this.estruturaSimulacao, id)
      this.montarOrganograma()
      notificacao.sucesso('Item(ns) excluído(s) com sucesso.')
      this.marcarAlteracao()
    },

    restaurarAlocacao(id) {
      if (!this.interativo) return
      this.fecharModalAlocacoes()
      this.restaurar(id)
    },

    liberarAlocacao(id) {
      if (!this.interativo) return
      const item = buscarPorId(this.estruturaSimulacao, id)
      if (!item) return
      this.fecharModalAlocacoes()
      this.liberarCargo(item)
    },

    transferirAlocacoes({ ids, unidadeDestinoId }) {
      const destino = buscarPorId(this.estruturaSimulacao, unidadeDestinoId)
      if (!destino || !ids.length) return

      ids.forEach((id) => {
        moverItem(this.estruturaSimulacao, id, destino.id)
        this.recomporSiglaAlocacao(buscarPorId(this.estruturaSimulacao, id), destino)
      })

      notificacao.sucesso('Cargo/Função transferido com sucesso.')
      this.fecharModalAlocacoes()
      this.montarOrganograma()
      this.marcarAlteracao()
    },

    // A alocação movida adota a sigla da unidade de destino + sequencial
    // (quantidade de alocações do destino + 1), descartando a anterior.
    recomporSiglaAlocacao(alocacao, unidadeDestino) {
      if (!alocacao || alocacao.tipo !== 'role' || !unidadeDestino?.sigla) return
      const sequencial =
        extrairAlocacoes(unidadeDestino).filter((f) => !mesmoId(f.id, alocacao.id)).length + 1
      alocacao.sigla = `${unidadeDestino.sigla}[${sequencial}]`
      alocacao.rotulo = montarRotuloCargo(alocacao) || alocacao.rotulo
    },

    // ─────────────────────────────────────────────
    // Controle de alterações pendentes
    // ─────────────────────────────────────────────

    marcarAlteracao() {
      this.temAlteracoes = true
      this.emitirAlteracao()
    },

    emitirAlteracao() {
      this.$emit('alteracao', {
        temAlteracoes: this.temAlteracoes,
        estruturaSimulacao: this.estruturaSimulacao,
      })
    },
  },
}
</script>

<style scoped src="./organograma.scss" lang="scss"></style>
