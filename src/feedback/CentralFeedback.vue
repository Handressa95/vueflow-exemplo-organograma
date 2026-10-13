<template>
  <div class="central-feedback__notificacoes">
    <div
      v-for="item in estado.notificacoes"
      :key="item.id"
      class="central-feedback__notificacao"
      :class="`central-feedback__notificacao--${item.tipo}`"
      role="status"
    >
      <div>
        <div v-for="(texto, i) in item.textos" :key="i">{{ texto }}</div>
      </div>
      <button type="button" class="btn-close btn-close-white" @click="fechar(item.id)"></button>
    </div>
  </div>

  <div
    v-if="estado.confirmacao"
    class="modal fade show d-block"
    tabindex="-1"
    style="background: rgba(0, 0, 0, 0.5)"
  >
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content text-center p-3">
        <div class="modal-body">
          <i
            class="bi central-feedback__icone"
            :class="[estado.confirmacao.icone, `text-${estado.confirmacao.variante}`]"
          ></i>
          <h5 class="mt-2">{{ estado.confirmacao.titulo }}</h5>
          <p class="mb-0">
            {{ estado.confirmacao.pergunta }}
            <strong v-if="estado.confirmacao.destaque">{{ estado.confirmacao.destaque }}</strong
            >?
          </p>
          <p v-if="estado.confirmacao.detalhe" class="mt-3 mb-0">
            {{ estado.confirmacao.detalhe }}
          </p>
        </div>
        <div class="d-flex justify-content-center gap-2">
          <button
            type="button"
            class="btn btn-outline-secondary"
            @click="estado.confirmacao.responder(false)"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="btn"
            :class="`btn-${estado.confirmacao.variante}`"
            @click="estado.confirmacao.responder(true)"
          >
            {{ estado.confirmacao.textoConfirmar }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { estadoFeedback, fecharNotificacao } from './feedback'

export default {
  name: 'CentralFeedback',
  data() {
    return { estado: estadoFeedback }
  },
  methods: {
    fechar(id) {
      fecharNotificacao(id)
    },
  },
}
</script>

<style scoped lang="scss">
.central-feedback__notificacoes {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 360px;
}

.central-feedback__notificacao {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 6px;
  color: #fff;
  font-size: 0.85rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  &--sucesso {
    background: #198754;
  }

  &--erro {
    background: #dc3545;
  }

  &--info {
    background: #0d6efd;
  }
}

.central-feedback__icone {
  font-size: 3rem;
}
</style>
