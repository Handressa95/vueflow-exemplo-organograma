<template>
  <div class="modal fade show d-block" tabindex="-1" style="background: rgba(0, 0, 0, 0.5)">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Editar alocações — {{ unidade.rotulo }}</h5>
          <button type="button" class="btn-close" @click="$emit('fechar')"></button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <input
              v-model="filtro"
              name="filtroAlocacao"
              class="form-control search-input"
              placeholder="Buscar por cargo/função, símbolo ou sigla"
            />
          </div>

          <div class="table-responsive">
            <table class="table table-sm align-middle tabela-alocacoes mb-2">
              <thead>
                <tr>
                  <th v-if="!somenteLeitura" class="coluna-selecao">
                    <input
                      type="checkbox"
                      class="form-check-input"
                      :checked="todosDaPaginaSelecionados"
                      :disabled="!pagina.length"
                      title="Selecionar todos da página"
                      @change="alternarTodosDaPagina($event.target.checked)"
                    />
                  </th>
                  <th>Cargo/Função</th>
                  <th class="coluna-acoes">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="alocacao in pagina" :key="alocacao.id" :class="classesLinha(alocacao)">
                  <td v-if="!somenteLeitura" class="coluna-selecao">
                    <input
                      v-model="idsSelecionados"
                      type="checkbox"
                      class="form-check-input"
                      :value="alocacao.id"
                    />
                  </td>
                  <td><i class="bi bi-person me-1"></i>{{ alocacao.rotulo }}</td>
                  <td class="coluna-acoes">
                    <div v-if="!somenteLeitura" class="btn-group acoes" role="group">
                      <button
                        v-if="podeExibir('editar', alocacao.id)"
                        type="button"
                        class="btn btn-action btn-action--edit"
                        title="Editar"
                        @click="$emit('editar', alocacao.id)"
                      >
                        <i class="bi bi-pencil-fill"></i>
                      </button>
                      <button
                        v-if="podeExibir('excluir', alocacao.id)"
                        type="button"
                        class="btn btn-action btn-action--delete"
                        title="Excluir"
                        @click="$emit('excluir', alocacao.id)"
                      >
                        <i class="bi bi-trash-fill"></i>
                      </button>
                      <button
                        v-if="podeExibir('restaurar', alocacao.id)"
                        type="button"
                        class="btn btn-action btn-action--restaurar"
                        title="Restaurar"
                        @click="$emit('restaurar', alocacao.id)"
                      >
                        <i class="bi bi-arrow-counterclockwise"></i>
                      </button>
                      <button
                        v-if="podeExibir('liberar', alocacao.id)"
                        type="button"
                        class="btn btn-action btn-action--liberar"
                        title="Liberar"
                        @click="$emit('liberar', alocacao.id)"
                      >
                        <i class="bi bi-unlock"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="!pagina.length">
                  <td :colspan="somenteLeitura ? 2 : 3" class="text-center text-muted py-3">
                    Nenhum cargo/função encontrado.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <nav v-if="totalPaginas > 1" class="d-flex justify-content-between align-items-center">
            <small class="text-muted">{{ filtradas.length }} registro(s)</small>
            <ul class="pagination pagination-sm mb-0">
              <li class="page-item" :class="{ disabled: paginaAtual === 1 }">
                <button type="button" class="page-link" @click="paginaAtual--">‹</button>
              </li>
              <li
                v-for="numero in totalPaginas"
                :key="numero"
                class="page-item"
                :class="{ active: numero === paginaAtual }"
              >
                <button type="button" class="page-link" @click="paginaAtual = numero">
                  {{ numero }}
                </button>
              </li>
              <li class="page-item" :class="{ disabled: paginaAtual === totalPaginas }">
                <button type="button" class="page-link" @click="paginaAtual++">›</button>
              </li>
            </ul>
          </nav>
        </div>

        <div v-if="!somenteLeitura" class="modal-footer d-block">
          <div class="row align-items-center g-2">
            <div class="col-12 col-md-3">Transferir alocação para:</div>
            <div class="col-12 col-md-6">
              <select
                v-model="unidadeDestinoId"
                class="form-select"
                :disabled="!idsSelecionados.length"
              >
                <option :value="null">Selecione a Unidade de destino</option>
                <option v-for="u in unidadesDestino" :key="u.id" :value="u.id">{{ u.nome }}</option>
              </select>
            </div>
            <div class="col-12 col-md-3">
              <button
                type="button"
                class="btn btn-primary w-100"
                :disabled="!unidadeDestinoId || !idsSelecionados.length"
                @click="transferir"
              >
                Transferir
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { TAMANHO_PAGINA_ALOCACOES } from '../constantes'
import { extrairAlocacoes, mesmoId } from '../arvore'

const somenteAlfanumericos = (texto) => String(texto).replace(/[^a-zA-Z0-9]/g, '')

export default {
  name: 'ModalAlocacoes',
  props: {
    unidade: { type: Object, required: true },
    unidadesDestino: { type: Array, default: () => [] },
    idAlocacaoDestacada: { type: [String, Number], default: null },
    somenteLeitura: { type: Boolean, default: false },
    podeExibir: { type: Function, required: true },
  },
  emits: ['fechar', 'editar', 'excluir', 'restaurar', 'liberar', 'transferir'],
  data() {
    return {
      filtro: '',
      paginaAtual: 1,
      idsSelecionados: [],
      unidadeDestinoId: null,
    }
  },
  computed: {
    alocacoes() {
      return extrairAlocacoes(this.unidade)
    },
    filtradas() {
      if (!this.filtro) return this.alocacoes
      const termo = somenteAlfanumericos(this.filtro.toLowerCase())
      return this.alocacoes.filter(
        (a) =>
          somenteAlfanumericos(a.rotulo.toLowerCase()).includes(termo) ||
          String(a.id).includes(termo),
      )
    },
    totalPaginas() {
      return Math.max(1, Math.ceil(this.filtradas.length / TAMANHO_PAGINA_ALOCACOES))
    },
    pagina() {
      const inicio = (this.paginaAtual - 1) * TAMANHO_PAGINA_ALOCACOES
      return this.filtradas.slice(inicio, inicio + TAMANHO_PAGINA_ALOCACOES)
    },
    todosDaPaginaSelecionados() {
      return this.pagina.length > 0 && this.pagina.every((a) => this.idsSelecionados.includes(a.id))
    },
  },
  watch: {
    filtro() {
      this.paginaAtual = 1
    },
    idsSelecionados(ids) {
      if (!ids.length) this.unidadeDestinoId = null
    },
  },
  created() {
    // Abre na página da alocação localizada pela busca.
    const indice = this.alocacoes.findIndex((a) => mesmoId(a.id, this.idAlocacaoDestacada))
    if (indice >= 0) this.paginaAtual = Math.floor(indice / TAMANHO_PAGINA_ALOCACOES) + 1
  },
  methods: {
    classesLinha(alocacao) {
      return {
        [`row-status-${alocacao.status.replace('/', '-').toLowerCase()}`]: true,
        'row-alocacao-destacada':
          this.idAlocacaoDestacada != null && mesmoId(alocacao.id, this.idAlocacaoDestacada),
      }
    },
    alternarTodosDaPagina(marcar) {
      const idsPagina = this.pagina.map((a) => a.id)
      const restantes = this.idsSelecionados.filter((id) => !idsPagina.includes(id))
      this.idsSelecionados = marcar ? [...restantes, ...idsPagina] : restantes
    },
    transferir() {
      this.$emit('transferir', {
        ids: [...this.idsSelecionados],
        unidadeDestinoId: this.unidadeDestinoId,
      })
    },
  },
}
</script>

<style scoped lang="scss">
.search-input {
  padding-left: 40px;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="%23888" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>');
  background-repeat: no-repeat;
  background-position: 12px center;
  background-size: 18px;
}

.tabela-alocacoes {
  font-size: 0.85rem;

  tr > td:first-child {
    border-left: 3px solid transparent;
  }

  .coluna-selecao {
    width: 36px;
  }

  .coluna-acoes {
    width: 140px;
    text-align: right;
  }
}

tr.row-status-atual > td {
  background-color: rgb(239, 246, 255);
}

tr.row-status-atual > td:first-child {
  border-left-color: rgb(59, 130, 246);
}

tr.row-status-alteracao > td {
  background-color: rgb(254, 252, 232);
}

tr.row-status-alteracao > td:first-child {
  border-left-color: rgb(234, 179, 8);
}

tr.row-status-acrescimo > td {
  background-color: #f0fff1;
}

tr.row-status-acrescimo > td:first-child {
  border-left-color: #28a745;
}

tr.row-status-extincao > td {
  background-color: rgb(254, 242, 242);
}

tr.row-status-extincao > td:first-child {
  border-left-color: rgb(239, 68, 68);
}

tr.row-alocacao-destacada > td {
  background-color: #fff7db;
  box-shadow:
    inset 0 2px 0 #f59e0b,
    inset 0 -2px 0 #f59e0b;
}

.btn-action {
  padding: 2px 8px;
  font-size: 0.85rem;
  color: #495057;

  &--edit:hover {
    color: #0d6efd;
  }

  &--delete:hover,
  &--liberar:hover {
    color: #dc3545;
  }

  &--restaurar:hover {
    color: #198754;
  }
}
</style>
