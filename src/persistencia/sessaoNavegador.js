// Persistência na sessão do navegador (sessionStorage): os dados somem ao
// fechar a aba. Troque por chamadas à sua API quando houver backend.

export function gravarNaSessao(chave, valor) {
  sessionStorage.setItem(chave, JSON.stringify(valor))
}

export function lerDaSessao(chave) {
  const texto = sessionStorage.getItem(chave)
  if (!texto) return null
  try {
    return JSON.parse(texto)
  } catch {
    return null
  }
}

export function removerDaSessao(chave) {
  sessionStorage.removeItem(chave)
}
