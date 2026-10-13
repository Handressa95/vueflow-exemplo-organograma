import { reactive } from 'vue'

// Feedback ao usuário (notificações e diálogo de confirmação) sem depender
// de biblioteca externa. Renderizado por CentralFeedback.vue, que deve estar
// montado uma única vez na raiz da aplicação. Para usar a biblioteca do seu
// projeto (SweetAlert2, vue-toast-notification...), troque apenas este arquivo.
export const estadoFeedback = reactive({
  notificacoes: [],
  confirmacao: null,
})

const DURACAO_NOTIFICACAO_MS = 4000
let proximoIdNotificacao = 1

function notificar(tipo, textos) {
  const id = proximoIdNotificacao++
  const lista = Array.isArray(textos) ? textos : [textos]
  estadoFeedback.notificacoes.push({ id, tipo, textos: lista })
  setTimeout(() => fecharNotificacao(id), DURACAO_NOTIFICACAO_MS)
}

export function fecharNotificacao(id) {
  const indice = estadoFeedback.notificacoes.findIndex((n) => n.id === id)
  if (indice !== -1) estadoFeedback.notificacoes.splice(indice, 1)
}

export const notificacao = {
  sucesso: (textos) => notificar('sucesso', textos),
  erro: (textos) => notificar('erro', textos),
  info: (textos) => notificar('info', textos),
}

// Abre o diálogo de confirmação e resolve com true (confirmado) ou false.
// O texto é montado como "{pergunta} <strong>{destaque}</strong>?" seguido
// de `detalhe`, sem interpolar HTML vindo dos dados.
export function confirmar({
  titulo,
  pergunta,
  destaque = '',
  detalhe = '',
  textoConfirmar = 'Confirmar',
  variante = 'danger',
  icone = 'bi-exclamation-triangle',
}) {
  return new Promise((resolve) => {
    estadoFeedback.confirmacao = {
      titulo,
      pergunta,
      destaque,
      detalhe,
      textoConfirmar,
      variante,
      icone,
      responder(confirmado) {
        estadoFeedback.confirmacao = null
        resolve(confirmado)
      },
    }
  })
}
