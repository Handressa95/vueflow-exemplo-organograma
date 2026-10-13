import { beforeEach, describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { criarEstruturaAtual, criarEstruturaSimulacao } from '@/dados/estruturaExemplo'
import { buscarPorId } from './arvore'
import { STATUS } from './constantes'

const vueFlow = vi.hoisted(() => ({
  updateNodeInternals: vi.fn(),
  fitView: vi.fn(),
  findNode: vi.fn(),
  getNodes: [],
  setCenter: vi.fn(),
  applyNodeChanges: vi.fn(),
  applyEdgeChanges: vi.fn(),
  setViewport: vi.fn(),
  getViewport: vi.fn(() => ({ x: 0, y: 0, zoom: 1 })),
  toObject: vi.fn(),
  fromObject: vi.fn(() => Promise.resolve(true)),
}))

vi.mock('@vue-flow/core', () => ({
  useVueFlow: () => vueFlow,
  Position: { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' },
  getSmoothStepPath: () => [''],
  VueFlow: { template: '<div />' },
  Panel: { template: '<div />' },
  BaseEdge: { template: '<div />' },
}))
vi.mock('@vue-flow/background', () => ({ Background: { template: '<div />' } }))
vi.mock('@vue-flow/controls', () => ({ Controls: { template: '<div />' } }))
vi.mock('@vue-flow/node-resizer', () => ({ NodeResizer: { template: '<div />' } }))

const feedback = vi.hoisted(() => ({
  confirmar: vi.fn(() => Promise.resolve(true)),
  notificacao: { sucesso: vi.fn(), erro: vi.fn(), info: vi.fn() },
}))
vi.mock('@/feedback/feedback', () => feedback)

const htmlToImage = vi.hoisted(() => ({ toCanvas: vi.fn() }))
vi.mock('html-to-image', () => htmlToImage)

import Organograma from './Organograma.vue'

const siglaParaId = (estrutura, sigla) => {
  const percorrer = (nos) => {
    for (const no of nos) {
      if (no.sigla === sigla) return no.id
      const id = no.filhos ? percorrer(no.filhos) : null
      if (id != null) return id
    }
    return null
  }
  return percorrer(estrutura)
}

function montar(props = {}) {
  const wrapper = shallowMount(Organograma, {
    props,
    global: { stubs: { LinhasAuxiliares: true, ModalCadastroItem: true, ModalAlocacoes: true } },
  })
  const estruturaAtual = criarEstruturaAtual()
  wrapper.vm.carregar({
    estruturaAtual,
    estruturaSimulacao: criarEstruturaSimulacao(estruturaAtual),
    disposicao: null,
  })
  return wrapper
}

describe('Organograma', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    feedback.confirmar.mockResolvedValue(true)
  })

  it('Deve exibir inicialmente apenas as raízes e seus filhos diretos', () => {
    const { vm } = montar()

    expect(vm.nodes.map((n) => n.data.sigla)).toEqual(['CMD', 'ENG', 'CIE', 'BEM', 'OUV'])
    expect(vm.edges).toHaveLength(4)
  })

  it('Deve exibir as subordinadas ao expandir uma unidade', () => {
    const { vm } = montar()
    const idBem = String(siglaParaId(vm.estruturaSimulacao, 'BEM'))

    vm.alternarRecolhimento(idBem)

    expect(vm.nodes.map((n) => n.data.sigla)).toContain('BEM-CUL')
  })

  it('Deve incluir uma unidade acrescida sob o pai e marcar alterações pendentes', () => {
    const wrapper = montar()
    const { vm } = wrapper
    const pai = buscarPorId(vm.estruturaSimulacao, siglaParaId(vm.estruturaSimulacao, 'OUV'))
    vm.addUnidade(pai.id)

    vm.aoEnviarModalCadastro({
      modo: 'unidade',
      nomeUnidade: 'Núcleo de Tradução Universal',
      tipoUnidade: 'Núcleo',
      sigla: 'OUV-TRD',
      preenchidoManualmente: true,
    })

    const nova = pai.filhos.find((f) => f.sigla === 'OUV-TRD')
    expect(nova).toMatchObject({
      status: 'Acrescimo',
      rotulo: 'Núcleo de Tradução Universal - OUV-TRD',
    })
    expect(vm.nodes.map((n) => n.data.sigla)).toContain('OUV-TRD')
    expect(wrapper.emitted('alteracao').at(-1)[0].temAlteracoes).toBe(true)
  })

  it('Deve extinguir a unidade e os cargos vinculados após confirmação', async () => {
    const { vm } = montar()
    const unidade = buscarPorId(vm.estruturaSimulacao, siglaParaId(vm.estruturaSimulacao, 'CIE'))

    await vm.extinguir(unidade.id)

    expect(unidade.status).toBe('Extincao')
    expect(unidade.filhos.every((f) => f.status === 'Extincao')).toBe(true)
  })

  it('Não deve extinguir quando a confirmação é cancelada', async () => {
    feedback.confirmar.mockResolvedValue(false)
    const { vm } = montar()
    const unidade = buscarPorId(vm.estruturaSimulacao, siglaParaId(vm.estruturaSimulacao, 'CIE'))

    await vm.extinguir(unidade.id)

    expect(unidade.status).toBe('Atual')
  })

  it('Deve restaurar uma unidade extinta e seus filhos a partir da estrutura atual', async () => {
    const { vm } = montar()
    const unidade = buscarPorId(vm.estruturaSimulacao, siglaParaId(vm.estruturaSimulacao, 'CIE'))
    await vm.extinguir(unidade.id)

    await vm.restaurar(unidade.id)

    expect(unidade.status).toBe('Atual')
    expect(unidade.filhos.every((f) => f.status === 'Atual')).toBe(true)
  })

  it('Deve transferir alocações e recompor a sigla com a unidade de destino', () => {
    const { vm } = montar()
    const origem = buscarPorId(vm.estruturaSimulacao, siglaParaId(vm.estruturaSimulacao, 'BEM'))
    const destino = buscarPorId(vm.estruturaSimulacao, siglaParaId(vm.estruturaSimulacao, 'OUV'))
    const alocacao = origem.filhos.find((f) => f.tipo === 'role' && f.simbolo === 'E1')

    vm.transferirAlocacoes({ ids: [alocacao.id], unidadeDestinoId: destino.id })

    expect(destino.filhos).toContain(alocacao)
    expect(alocacao).toMatchObject({ sigla: 'OUV[2]', status: 'Alteracao' })
    expect(origem.filhos).not.toContain(alocacao)
  })

  it('Deve tornar a unidade arrastada subordinada da unidade alvo', () => {
    const { vm } = montar()
    const idArrastado = String(siglaParaId(vm.estruturaSimulacao, 'OUV'))
    const idAlvo = String(siglaParaId(vm.estruturaSimulacao, 'CIE'))

    vm.reestruturar(idArrastado, idAlvo)

    const alvo = buscarPorId(vm.estruturaSimulacao, idAlvo)
    expect(alvo.filhos.find((f) => String(f.id) === idArrastado).status).toBe('Alteracao')
  })

  it('Não deve permitir tornar uma unidade subordinada de um descendente', () => {
    const { vm } = montar()
    const idRaiz = String(vm.estruturaSimulacao[0].id)
    const idFilho = String(siglaParaId(vm.estruturaSimulacao, 'CIE'))

    expect(vm.conexaoValida({ source: idFilho, target: idRaiz })).toBe(false)
  })

  it('Deve usar a sigla como chave de disposição de itens acrescidos', () => {
    const { vm } = montar()
    const novo = buscarPorId(vm.estruturaSimulacao, 1000)
    const idPai = siglaParaId(vm.estruturaSimulacao, 'BEM')

    expect(vm.chaveDisposicao(novo)).toBe(`${idPai}>sigla:BEM-CUL`)
  })

  it('Deve gravar dimensão e posição ao redimensionar uma caixa', () => {
    const { vm } = montar()

    vm.onNodeResizeEnd('1000', { params: { width: 320, height: 150, x: 10, y: 20 } })

    const chave = vm.chaveDisposicao(buscarPorId(vm.estruturaSimulacao, 1000))
    expect(vm.disposicao.dimensoes[chave]).toEqual({ width: 320, height: 150 })
    expect(vm.disposicao.posicoes[chave]).toEqual({ x: 10, y: 20 })
  })

  it('Não deve gravar altura menor que o mínimo medido para o conteúdo da caixa', () => {
    const { vm } = montar()
    vm.alturasMinimasNos['1000'] = 180

    vm.onNodeResizeEnd('1000', { params: { width: 170, height: 120, x: 10, y: 20 } })

    const chave = vm.chaveDisposicao(buscarPorId(vm.estruturaSimulacao, 1000))
    expect(vm.disposicao.dimensoes[chave]).toEqual({ width: 170, height: 180 })
    expect(vm.alturaMinimaDoNo('1000')).toBe(180)
    expect(vm.alturaMinimaDoNo('31')).toBe(vm.alturaMinimaNo)
  })

  it('Deve gravar as unidades recolhidas e restaurá-las ao carregar', () => {
    const wrapper = montar()
    const { vm } = wrapper
    const idBem = String(siglaParaId(vm.estruturaSimulacao, 'BEM'))

    vm.alternarRecolhimento(idBem)
    expect(wrapper.emitted('alteracao').at(-1)[0].temAlteracoes).toBe(true)

    const disposicao = vm.obterDisposicao()
    expect(disposicao.recolhidos).not.toContain(idBem)

    const estruturaSimulacao = vm.obterEstruturaSimulacao()
    vm.carregar({ estruturaAtual: vm.estruturaAtual, estruturaSimulacao, disposicao })

    expect(vm.nodes.map((n) => n.data.sigla)).toContain('BEM-CUL')
  })

  it('Não deve gravar redimensionamento em modo somente leitura', () => {
    const { vm } = montar({ somenteLeitura: true })

    vm.onNodeResizeEnd('1000', { params: { width: 320, height: 150, x: 10, y: 20 } })

    expect(vm.disposicao.dimensoes).toEqual({})
  })

  it('Deve restaurar o fluxo do Vue Flow com fromObject e reconstruir a disposição', async () => {
    const { vm } = montar()
    const estruturaAtual = criarEstruturaAtual()
    const fluxo = {
      nodes: [
        {
          id: '31',
          position: { x: 50, y: 60 },
          style: { width: '300px', height: '140px' },
          data: { posicaoArrastada: true, recolhido: false },
        },
      ],
      edges: [],
      viewport: { x: 5, y: 6, zoom: 0.7 },
    }

    await vm.restaurarFluxoVueFlow({
      estruturaAtual,
      estruturaSimulacao: criarEstruturaSimulacao(estruturaAtual),
      fluxo,
      corFundo: '#123456',
    })

    expect(vueFlow.fromObject).toHaveBeenCalledWith(fluxo)
    expect(vm.disposicao).toMatchObject({
      corFundo: '#123456',
      viewport: { x: 5, y: 6, zoom: 0.7 },
      posicoes: { 31: { x: 50, y: 60, arrastada: true } },
      dimensoes: { 31: { width: 300, height: 140 } },
    })
  })

  describe('Exportação', () => {
    const nosDoFluxo = [
      { position: { x: 100, y: 50 }, dimensions: { width: 240, height: 110 } },
      { position: { x: 500, y: 300 }, dimensions: { width: 240, height: 120 } },
    ]

    beforeEach(() => {
      vueFlow.getNodes = nosDoFluxo
    })

    it('Deve medir a exportação pela caixa delimitadora das caixas mais a borda da captura', () => {
      const { vm } = montar()

      expect(vm.obterDimensaoExportacao()).toEqual({ width: 640 + 80, height: 370 + 80 })
    })

    it('Deve capturar em zoom 1, sem os controles de tela, e restaurar o viewport e o container', async () => {
      const canvas = { width: 720, height: 450 }
      htmlToImage.toCanvas.mockResolvedValue(canvas)
      vueFlow.getViewport.mockReturnValue({ x: 7, y: 8, zoom: 0.6 })
      const { vm } = montar()
      const container = vm.$refs.containerFluxo

      const resultado = await vm.capturarComoImagem(2)

      expect(resultado).toEqual({ canvas, width: 720, height: 450, pixelRatio: 2 })
      expect(vueFlow.setViewport).toHaveBeenCalledWith({ x: -60, y: -10, zoom: 1 }, { duration: 0 })
      expect(vueFlow.setViewport).toHaveBeenLastCalledWith(
        { x: 7, y: 8, zoom: 0.6 },
        { duration: 0 },
      )
      expect(container.style.width).toBe('')
      expect(container.style.height).toBe('')

      const [, opcoes] = htmlToImage.toCanvas.mock.calls[0]
      expect(opcoes).toMatchObject({
        pixelRatio: 2,
        width: 720,
        height: 450,
        backgroundColor: '#ffffff',
      })
      const elemento = (classe) => ({ classList: { contains: (c) => c === classe } })
      expect(opcoes.filter(elemento('vue-flow__controls'))).toBe(false)
      expect(opcoes.filter(elemento('vue-flow__panel'))).toBe(false)
      expect(opcoes.filter(elemento('org-node__menu'))).toBe(false)
      expect(opcoes.filter(elemento('org-node'))).toBe(true)
    })

    it('Deve listar os status exibidos na ordem dos status', () => {
      const { vm } = montar()
      vm.nodes = [
        { data: { status: STATUS.ALTERACAO } },
        { data: { status: STATUS.ATUAL } },
        { data: { status: STATUS.ALTERACAO } },
      ]

      expect(vm.statusExibidos()).toEqual([STATUS.ATUAL, STATUS.ALTERACAO])
    })
  })
})
