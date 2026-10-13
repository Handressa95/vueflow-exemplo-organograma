import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import ModalExportarOrganograma from './ModalExportarOrganograma.vue'
import { CAPTURA_PADDING_PX, MM_POR_PX, areaConteudoMm, papelNaOrientacao } from './paginacao'

const areaA4Paisagem = areaConteudoMm(papelNaOrientacao('A4', 'paisagem'), false)

// Dimensão (px) que ocupa exatamente `fracao` da largura útil de uma A4 paisagem.
const larguraPx = (fracao) => (areaA4Paisagem.width * fracao) / MM_POR_PX

async function abrir(props = {}) {
  const wrapper = mount(ModalExportarOrganograma, {
    props: { visivel: false, dimensaoOrganograma: { width: 800, height: 300 }, ...props },
  })
  await wrapper.setProps({ visivel: true })
  await flushPromises()
  return wrapper
}

describe('ModalExportarOrganograma', () => {
  it('Deve ampliar o organograma pequeno para preencher a largura útil em 1 folha', async () => {
    const { vm } = await abrir({ dimensaoOrganograma: { width: larguraPx(0.5), height: 100 } })

    expect(vm.orientacaoResolvida).toBe('paisagem')
    expect(vm.resultadoAjuste.escala).toBeCloseTo(200)
    expect(vm.totalFolhas).toBe(1)
    expect(vm.resumoTexto).toBe('A4 paisagem · escala 200% · 1 folha')
  })

  it('Deve paginar mantendo 100% no modo "Manter legível e paginar"', async () => {
    const { vm } = await abrir({ dimensaoOrganograma: { width: larguraPx(2.5), height: 100 } })

    vm.modoAjuste = 'manterPaginar'

    expect(vm.resultadoAjuste).toEqual({ escala: 100, folhas: { cols: 3, rows: 1 } })
    expect(vm.totalFolhas).toBe(3)
  })

  it('Não deve criar folha só para a borda em branco da captura', async () => {
    const sobraDentroDaBorda = CAPTURA_PADDING_PX / 2
    const { vm } = await abrir({
      dimensaoOrganograma: { width: larguraPx(2) + sobraDentroDaBorda, height: 100 },
    })

    vm.modoAjuste = 'manterPaginar'

    expect(vm.resultadoAjuste.folhas).toEqual({ cols: 2, rows: 1 })
  })

  it('Deve usar a medida da captura da pré-visualização no lugar da estimativa', async () => {
    const canvas = { toDataURL: vi.fn(() => 'data:image/png;base64,') }
    const capturarPreview = vi.fn(async () => ({ canvas, width: 300, height: 900 }))

    const { vm } = await abrir({ capturarPreview })

    expect(capturarPreview).toHaveBeenCalledWith(1)
    expect(vm.capturaPreviewUrl).toBe('data:image/png;base64,')
    expect(vm.orientacaoResolvida).toBe('retrato')
  })

  it('Deve oferecer só o modo automático no JPG e restaurar o modo do PDF ao voltar', async () => {
    const wrapper = await abrir()
    const { vm } = wrapper
    vm.modoAjuste = 'manterPaginar'

    vm.formato = 'jpg'
    await wrapper.vm.$nextTick()
    expect(vm.modoAjuste).toBe('automatico')
    expect(wrapper.find('#modoManterPaginar').exists()).toBe(false)

    vm.formato = 'pdf'
    await wrapper.vm.$nextTick()
    expect(vm.modoAjuste).toBe('manterPaginar')
  })

  it('Deve emitir os parâmetros da exportação ao confirmar', async () => {
    const wrapper = await abrir({ formatoInicial: 'jpg' })

    await wrapper.findAll('.modal-footer button')[1].trigger('click')

    const [parametros] = wrapper.emitted('confirmar')[0]
    expect(parametros).toMatchObject({
      formato: 'jpg',
      papel: 'A4',
      orientacao: 'paisagem',
      modoAjuste: 'automatico',
      folhas: { cols: 1, rows: 1 },
    })
  })
})
