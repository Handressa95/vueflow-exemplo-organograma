<template>
  <canvas ref="canvasRef" class="linhas-auxiliares-canvas"></canvas>
</template>

<script>
import { useVueFlow } from '@vue-flow/core'
import { ID_FLUXO } from '../constantes'

// Desenha, sobre o organograma, as linhas-guia (verde) mostradas enquanto um
// nó é arrastado e fica alinhado com a borda de outro nó.
export default {
  name: 'LinhasAuxiliares',
  props: {
    horizontal: { type: Number, default: undefined },
    vertical: { type: Number, default: undefined },
  },
  setup() {
    const { viewport, dimensions } = useVueFlow(ID_FLUXO)
    return { viewport, dimensions }
  },
  watch: {
    horizontal() {
      this.desenhar()
    },
    vertical() {
      this.desenhar()
    },
    viewport: {
      handler() {
        this.desenhar()
      },
      deep: true,
    },
    dimensions: {
      handler() {
        this.desenhar()
      },
      deep: true,
    },
  },
  mounted() {
    this.desenhar()
  },
  methods: {
    desenhar() {
      const canvas = this.$refs.canvasRef
      const contexto = canvas?.getContext('2d')
      if (!contexto || !canvas) return

      const largura = this.dimensions.width
      const altura = this.dimensions.height
      const dpi = window.devicePixelRatio || 1

      canvas.width = largura * dpi
      canvas.height = altura * dpi

      contexto.scale(dpi, dpi)
      contexto.clearRect(0, 0, largura, altura)
      contexto.strokeStyle = '#0075ff'

      const { x, y, zoom } = this.viewport

      if (typeof this.vertical === 'number') {
        contexto.beginPath()
        contexto.moveTo(this.vertical * zoom + x, 0)
        contexto.lineTo(this.vertical * zoom + x, altura)
        contexto.stroke()
      }

      if (typeof this.horizontal === 'number') {
        contexto.beginPath()
        contexto.moveTo(0, this.horizontal * zoom + y)
        contexto.lineTo(largura, this.horizontal * zoom + y)
        contexto.stroke()
      }
    },
  },
}
</script>

<style scoped>
.linhas-auxiliares-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  pointer-events: none;
}
</style>
