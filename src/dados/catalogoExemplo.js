// Catálogos fictícios usados pelo modal de cadastro quando "Preencher
// manualmente" está desmarcado. Em um projeto real, cada função vira uma
// chamada ao serviço correspondente (tipos de unidade, unidades, tipos de
// símbolo, símbolos e parametrização cargo × símbolo × nível de atuação).

const TIPOS_UNIDADE = [
  { id: 1, descricao: 'Comando' },
  { id: 2, descricao: 'Divisão' },
  { id: 3, descricao: 'Setor' },
  { id: 4, descricao: 'Núcleo' },
  { id: 5, descricao: 'Laboratório' },
  { id: 6, descricao: 'Ouvidoria' },
]

const UNIDADES = [
  { id: 1, tipoUnidadeId: 2, nomeCompleto: 'Divisão de Navegação', sigla: 'NAV' },
  { id: 2, tipoUnidadeId: 2, nomeCompleto: 'Divisão de Diplomacia Estelar', sigla: 'DIP' },
  { id: 3, tipoUnidadeId: 3, nomeCompleto: 'Setor de Comunicações', sigla: 'COM' },
  { id: 4, tipoUnidadeId: 3, nomeCompleto: 'Setor de Escudos Defletores', sigla: 'ESC' },
  { id: 5, tipoUnidadeId: 4, nomeCompleto: 'Núcleo de Tradução Universal', sigla: 'TRD' },
  { id: 6, tipoUnidadeId: 4, nomeCompleto: 'Núcleo de Mapas Holográficos', sigla: 'HOL' },
  { id: 7, tipoUnidadeId: 5, nomeCompleto: 'Laboratório de Cristais Exóticos', sigla: 'LCX' },
]

const TIPOS_SIMBOLO = [
  { id: 1, descricao: 'Patente de Comando', tipo: 'PC' },
  { id: 2, descricao: 'Insígnia de Especialista', tipo: 'IE' },
]

const SIMBOLOS = [
  { id: 1, tipoSimboloId: 1, nome: 'N1' },
  { id: 2, tipoSimboloId: 1, nome: 'N2' },
  { id: 3, tipoSimboloId: 1, nome: 'N3' },
  { id: 4, tipoSimboloId: 2, nome: 'E1' },
  { id: 5, tipoSimboloId: 2, nome: 'E2' },
]

const PARAMETRIZACOES = [
  { simboloId: 1, cargoId: 1, cargoNome: 'Chefe de Divisão', nivelAtuacaoNome: 'Estratégico' },
  { simboloId: 1, cargoId: 2, cargoNome: 'Comandante da Nave', nivelAtuacaoNome: 'Estratégico' },
  { simboloId: 2, cargoId: 3, cargoNome: 'Líder de Setor', nivelAtuacaoNome: 'Tático' },
  { simboloId: 3, cargoId: 4, cargoNome: 'Coordenador de Núcleo', nivelAtuacaoNome: 'Operacional' },
  { simboloId: 4, cargoId: 5, cargoNome: 'Especialista de Bordo', nivelAtuacaoNome: 'Operacional' },
  { simboloId: 5, cargoId: 6, cargoNome: 'Cadete em Treinamento', nivelAtuacaoNome: 'Operacional' },
]

const porNome = (campo) => (a, b) => a[campo].localeCompare(b[campo], 'pt-BR')

export function listarTiposUnidade() {
  return [...TIPOS_UNIDADE].sort(porNome('descricao'))
}

export function listarUnidadesPorTipo(tipoUnidadeId) {
  return UNIDADES.filter((u) => u.tipoUnidadeId === tipoUnidadeId).sort(porNome('nomeCompleto'))
}

export function listarTiposSimbolo() {
  return [...TIPOS_SIMBOLO].sort(porNome('descricao'))
}

export function listarSimbolosPorTipo(tipoSimboloId) {
  return SIMBOLOS.filter((s) => s.tipoSimboloId === tipoSimboloId).sort(porNome('nome'))
}

// Cargos parametrizados para o símbolo, já com o nível de atuação: garante
// que só combinações previstas na parametrização possam ser escolhidas.
export function listarCargosParametrizados(simboloId) {
  return PARAMETRIZACOES.filter((p) => p.simboloId === simboloId)
    .map((p) => ({ id: p.cargoId, nome: p.cargoNome, nivelAtuacao: p.nivelAtuacaoNome }))
    .sort(porNome('nome'))
}
