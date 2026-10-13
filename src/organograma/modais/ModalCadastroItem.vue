<template>
  <div
    v-if="visivel"
    class="modal fade show d-block"
    tabindex="-1"
    style="background: rgba(0, 0, 0, 0.5)"
  >
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h4 class="modal-title">
            {{ itemSelecionado ? 'Editar item' : 'O que você deseja adicionar?' }}
          </h4>
          <button type="button" class="modal-close-btn" @click="$emit('fechar')">&times;</button>
        </div>

        <div class="modal-body">
          <div v-if="!itemSelecionado" class="mode-selector mb-3">
            <label class="radio-card" :class="{ active: modo === 'unidade' }">
              <input v-model="modo" type="radio" name="modo" value="unidade" />
              <div class="radio-card-content">
                <span class="radio-card-title">Adicionar Unidade</span>
                <span class="radio-card-subtitle">Incluir uma unidade na simulação</span>
              </div>
            </label>
            <label v-if="unidadePai" class="radio-card" :class="{ active: modo === 'cargo' }">
              <input v-model="modo" type="radio" name="modo" value="cargo" />
              <div class="radio-card-content">
                <span class="radio-card-title">Adicionar Cargo/Função</span>
                <span class="radio-card-subtitle"
                  >Adicionar um Cargo/Função na unidade selecionada</span
                >
              </div>
            </label>
          </div>

          <div v-if="!itemSelecionado" class="form-group">
            <label>{{ modo === 'cargo' ? 'Unidade' : 'Unidade Funcional' }}</label>
            <input
              type="text"
              class="form-control"
              :value="unidadePai ? unidadePai.rotulo : '(Raiz da simulação)'"
              disabled
            />
          </div>

          <label class="checkbox-manual mb-3">
            <input v-model="preencherManualmente" type="checkbox" />
            <span>Preencher manualmente</span>
          </label>

          <form class="form-fields" @submit.prevent="enviar">
            <template v-if="modo === 'unidade'">
              <div class="form-group">
                <label for="tipoUnidade">Tipo da Unidade<span>*</span></label>
                <input
                  v-if="preencherManualmente"
                  id="tipoUnidade"
                  v-model="formulario.tipoUnidade"
                  type="text"
                  class="form-control"
                  :class="{ 'is-invalid': erros.tipoUnidade }"
                  placeholder="Digite o tipo da unidade"
                  maxlength="100"
                />
                <select
                  v-else
                  id="tipoUnidade"
                  v-model="tipoUnidadeIdSelecionado"
                  class="form-select"
                  :class="{ 'is-invalid': erros.tipoUnidade }"
                >
                  <option :value="null">Selecione o tipo da unidade</option>
                  <option v-for="tipo in tiposUnidade" :key="tipo.id" :value="tipo.id">
                    {{ tipo.descricao }}
                  </option>
                </select>
                <div v-if="erros.tipoUnidade" class="invalid-feedback">{{ erros.tipoUnidade }}</div>
              </div>

              <div class="form-group">
                <label for="nomeUnidade">Nome da Unidade<span>*</span></label>
                <input
                  v-if="preencherManualmente"
                  id="nomeUnidade"
                  v-model="formulario.nomeUnidade"
                  type="text"
                  class="form-control"
                  :class="{ 'is-invalid': erros.nomeUnidade }"
                  placeholder="Digite o nome da unidade"
                  maxlength="150"
                />
                <select
                  v-else
                  id="nomeUnidade"
                  v-model="formulario.nomeUnidade"
                  class="form-select"
                  :class="{ 'is-invalid': erros.nomeUnidade }"
                  :disabled="!tipoUnidadeIdSelecionado"
                >
                  <option value="">Selecione a unidade</option>
                  <option v-for="u in unidadesDoTipo" :key="u.id" :value="u.nomeCompleto">
                    {{ u.nomeCompleto }} - {{ u.sigla }}
                  </option>
                </select>
                <div v-if="erros.nomeUnidade" class="invalid-feedback">{{ erros.nomeUnidade }}</div>
              </div>
            </template>

            <!-- Cargo. No modo seleção, a cascata segue a parametrização:
                 Tipo de Símbolo → Símbolo → Cargo → Nível (preenchido e bloqueado). -->
            <template v-if="modo === 'cargo'">
              <div class="form-group">
                <label for="tipoSimbolo">Tipo de Símbolo<span>*</span></label>
                <select
                  v-if="preencherManualmente"
                  id="tipoSimbolo"
                  v-model="formulario.tipoSimboloDescricao"
                  class="form-select"
                  :class="{ 'is-invalid': erros.tipoSimboloDescricao }"
                >
                  <option value="">Selecione o tipo de símbolo</option>
                  <option v-for="t in tiposSimbolo" :key="t.id" :value="t.descricao">
                    {{ t.descricao }} ({{ t.tipo }})
                  </option>
                </select>
                <select
                  v-else
                  id="tipoSimbolo"
                  v-model="tipoSimboloIdSelecionado"
                  class="form-select"
                  :class="{ 'is-invalid': erros.tipoSimboloDescricao }"
                >
                  <option :value="null">Selecione o tipo de símbolo</option>
                  <option v-for="t in tiposSimbolo" :key="t.id" :value="t.id">
                    {{ t.descricao }} ({{ t.tipo }})
                  </option>
                </select>
                <div v-if="erros.tipoSimboloDescricao" class="invalid-feedback">
                  {{ erros.tipoSimboloDescricao }}
                </div>
              </div>

              <div class="form-group">
                <label for="simbolo">Símbolo<span>*</span></label>
                <input
                  v-if="preencherManualmente"
                  id="simbolo"
                  v-model="formulario.simbolo"
                  type="text"
                  class="form-control"
                  :class="{ 'is-invalid': erros.simbolo }"
                  placeholder="Digite o símbolo"
                  maxlength="50"
                />
                <select
                  v-else
                  id="simbolo"
                  v-model="simboloIdSelecionado"
                  class="form-select"
                  :class="{ 'is-invalid': erros.simbolo }"
                  :disabled="!tipoSimboloIdSelecionado"
                >
                  <option :value="null">
                    {{
                      tipoSimboloIdSelecionado
                        ? 'Selecione o símbolo'
                        : 'Selecione o tipo de símbolo primeiro'
                    }}
                  </option>
                  <option v-for="s in simbolosDoTipo" :key="s.id" :value="s.id">
                    {{ s.nome }}
                  </option>
                </select>
                <div v-if="erros.simbolo" class="invalid-feedback">{{ erros.simbolo }}</div>
              </div>

              <div class="form-group">
                <label for="nomeCargo">Nome do Cargo/Função<span>*</span></label>
                <input
                  v-if="preencherManualmente"
                  id="nomeCargo"
                  v-model="formulario.nomeCargo"
                  type="text"
                  class="form-control"
                  :class="{ 'is-invalid': erros.nomeCargo }"
                  placeholder="Digite o nome do cargo/função"
                  maxlength="150"
                />
                <select
                  v-else
                  id="nomeCargo"
                  v-model="cargoIdSelecionado"
                  class="form-select"
                  :class="{ 'is-invalid': erros.nomeCargo }"
                  :disabled="!simboloIdSelecionado"
                >
                  <option :value="null">
                    {{
                      simboloIdSelecionado
                        ? 'Selecione o cargo/função'
                        : 'Selecione o símbolo primeiro'
                    }}
                  </option>
                  <option v-for="c in cargosDoSimbolo" :key="c.id" :value="c.id">
                    {{ c.nome }}
                  </option>
                </select>
                <div v-if="erros.nomeCargo" class="invalid-feedback">{{ erros.nomeCargo }}</div>
              </div>

              <div class="form-group">
                <label for="nivelAtuacao">Nível de Atuação<span>*</span></label>
                <input
                  id="nivelAtuacao"
                  v-model="formulario.nivelAtuacao"
                  type="text"
                  class="form-control"
                  :class="{ 'is-invalid': erros.nivelAtuacao }"
                  :disabled="!preencherManualmente"
                  :placeholder="
                    preencherManualmente
                      ? 'Digite o nível de atuação'
                      : 'Definido automaticamente pela parametrização do cargo/função'
                  "
                  maxlength="150"
                />
                <div v-if="erros.nivelAtuacao" class="invalid-feedback">
                  {{ erros.nivelAtuacao }}
                </div>
              </div>
            </template>

            <div class="form-group">
              <label for="sigla">Sigla<span>*</span></label>
              <input
                id="sigla"
                :value="formulario.sigla"
                type="text"
                class="form-control"
                :class="{ 'is-invalid': erros.sigla }"
                placeholder="Digite a sigla"
                maxlength="20"
                @input="aoDigitarSigla"
              />
              <div v-if="erros.sigla" class="invalid-feedback">{{ erros.sigla }}</div>
            </div>
          </form>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="$emit('voltar')">Voltar</button>
          <button type="button" class="btn btn-primary" @click="enviar">
            {{ itemSelecionado ? 'Salvar' : 'Adicionar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  listarCargosParametrizados,
  listarSimbolosPorTipo,
  listarTiposSimbolo,
  listarTiposUnidade,
  listarUnidadesPorTipo,
} from '@/dados/catalogoExemplo'

const ROTULOS_CAMPOS = {
  tipoUnidade: 'Tipo da Unidade',
  nomeUnidade: 'Nome da Unidade',
  tipoSimboloDescricao: 'Tipo de Símbolo',
  simbolo: 'Símbolo',
  nomeCargo: 'Nome do Cargo',
  nivelAtuacao: 'Nível de Atuação',
  sigla: 'Sigla',
}

const CAMPOS_OBRIGATORIOS = {
  unidade: ['tipoUnidade', 'nomeUnidade', 'sigla'],
  cargo: ['tipoSimboloDescricao', 'simbolo', 'nomeCargo', 'nivelAtuacao', 'sigla'],
}

function formularioVazio() {
  return {
    nomeUnidade: '',
    tipoUnidade: '',
    nomeCargo: '',
    simbolo: '',
    nivelAtuacao: '',
    sigla: '',
    tipoSimboloDescricao: '',
    tipoSimboloSigla: '',
  }
}

export default {
  name: 'ModalCadastroItem',
  props: {
    visivel: { type: Boolean, default: false },
    itemSelecionado: { type: Object, default: null },
    unidadePai: { type: Object, default: null },
  },
  emits: ['fechar', 'voltar', 'enviar'],
  data() {
    return {
      modo: 'unidade',
      preencherManualmente: true,
      tentouEnviar: false,
      // Enquanto os campos de uma edição são restaurados, os watchers da
      // cascata não devem limpar os campos dependentes.
      restaurandoEdicao: false,
      tipoUnidadeIdSelecionado: null,
      tipoSimboloIdSelecionado: null,
      simboloIdSelecionado: null,
      cargoIdSelecionado: null,
      formulario: formularioVazio(),
      tiposUnidade: listarTiposUnidade(),
      tiposSimbolo: listarTiposSimbolo(),
    }
  },
  computed: {
    unidadesDoTipo() {
      return this.tipoUnidadeIdSelecionado
        ? listarUnidadesPorTipo(this.tipoUnidadeIdSelecionado)
        : []
    },
    simbolosDoTipo() {
      return this.tipoSimboloIdSelecionado
        ? listarSimbolosPorTipo(this.tipoSimboloIdSelecionado)
        : []
    },
    cargosDoSimbolo() {
      return this.simboloIdSelecionado ? listarCargosParametrizados(this.simboloIdSelecionado) : []
    },
    // Erros só aparecem depois da primeira tentativa de envio e somem assim
    // que o campo é preenchido.
    erros() {
      if (!this.tentouEnviar) return {}
      return CAMPOS_OBRIGATORIOS[this.modo].reduce((erros, campo) => {
        if (!String(this.formulario[campo] || '').trim()) {
          erros[campo] = `O campo ${ROTULOS_CAMPOS[campo]} é obrigatório.`
        }
        return erros
      }, {})
    },
  },
  watch: {
    visivel(aberto) {
      if (!aberto) this.limparFormulario()
    },
    itemSelecionado: {
      immediate: true,
      handler(item) {
        if (item) this.restaurarEdicao(item)
        else this.limparFormulario()
      },
    },
    'formulario.nomeUnidade'(nome) {
      if (this.restaurandoEdicao || this.preencherManualmente || this.modo !== 'unidade') return
      this.formulario.sigla = this.unidadesDoTipo.find((u) => u.nomeCompleto === nome)?.sigla || ''
    },
    tipoUnidadeIdSelecionado(id) {
      if (this.restaurandoEdicao || this.preencherManualmente) return
      this.formulario.nomeUnidade = ''
      this.formulario.tipoUnidade = this.tiposUnidade.find((t) => t.id === id)?.descricao || ''
    },
    'formulario.tipoSimboloDescricao'(descricao) {
      if (this.restaurandoEdicao || !this.preencherManualmente || this.modo !== 'cargo') return
      this.formulario.tipoSimboloSigla =
        this.tiposSimbolo.find((t) => t.descricao === descricao)?.tipo || ''
    },
    tipoSimboloIdSelecionado(id) {
      if (this.restaurandoEdicao || this.preencherManualmente || this.modo !== 'cargo') return
      const tipo = this.tiposSimbolo.find((t) => t.id === id)
      this.formulario.tipoSimboloDescricao = tipo?.descricao || ''
      this.formulario.tipoSimboloSigla = tipo?.tipo || ''
      this.simboloIdSelecionado = null
      this.cargoIdSelecionado = null
      this.formulario.simbolo = ''
      this.formulario.nomeCargo = ''
      this.formulario.nivelAtuacao = ''
    },
    simboloIdSelecionado(id) {
      if (this.restaurandoEdicao || this.preencherManualmente || this.modo !== 'cargo') return
      this.formulario.simbolo = this.simbolosDoTipo.find((s) => s.id === id)?.nome || ''
      this.cargoIdSelecionado = null
      this.formulario.nomeCargo = ''
      this.formulario.nivelAtuacao = ''
    },
    cargoIdSelecionado(id) {
      if (this.restaurandoEdicao || this.preencherManualmente || this.modo !== 'cargo') return
      const cargo = this.cargosDoSimbolo.find((c) => c.id === id)
      this.formulario.nomeCargo = cargo?.nome || ''
      this.formulario.nivelAtuacao = cargo?.nivelAtuacao || ''
    },
  },
  methods: {
    restaurarEdicao(item) {
      this.restaurandoEdicao = true
      this.tentouEnviar = false
      this.modo = item.tipo === 'role' ? 'cargo' : 'unidade'
      this.preencherManualmente = item.preenchidoManualmente ?? true
      this.formulario = {
        nomeUnidade: item.nomeUnidade || item.nome || item.rotulo || '',
        tipoUnidade: item.tipoUnidade || '',
        nomeCargo: item.nomeCargo || '',
        simbolo: item.simbolo || '',
        nivelAtuacao: item.nivelAtuacao || '',
        sigla: item.sigla || '',
        tipoSimboloDescricao: item.tipoSimboloDescricao || '',
        tipoSimboloSigla: item.tipoSimboloSigla || '',
      }
      this.resolverIdsSelecao(item)
      this.$nextTick(() => {
        this.restaurandoEdicao = false
      })
    },

    // Em edição, resolve os ids da cascata a partir dos nomes gravados para
    // que os selects já apareçam preenchidos.
    resolverIdsSelecao(item) {
      const f = this.formulario
      if (this.modo === 'unidade') {
        this.tipoUnidadeIdSelecionado =
          item.tipoUnidadeId ||
          this.tiposUnidade.find((t) => t.descricao === f.tipoUnidade)?.id ||
          null
        return
      }
      const tipo = this.tiposSimbolo.find((t) => t.descricao === f.tipoSimboloDescricao)
      this.tipoSimboloIdSelecionado = tipo?.id || null
      if (tipo && !f.tipoSimboloSigla) f.tipoSimboloSigla = tipo.tipo
      const simbolo = tipo ? listarSimbolosPorTipo(tipo.id).find((s) => s.nome === f.simbolo) : null
      this.simboloIdSelecionado = simbolo?.id || null
      const cargo = simbolo
        ? listarCargosParametrizados(simbolo.id).find((c) => c.nome === f.nomeCargo)
        : null
      this.cargoIdSelecionado = cargo?.id || null
    },

    aoDigitarSigla(evento) {
      const sigla = evento.target.value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^A-Z0-9*\-[\].]/gi, '')
        .toUpperCase()
      this.formulario.sigla = sigla
      evento.target.value = sigla
    },

    enviar() {
      this.tentouEnviar = true
      if (Object.keys(this.erros).length) return
      this.$emit('enviar', {
        modo: this.modo,
        preenchidoManualmente: this.preencherManualmente,
        tipoUnidadeId: this.tipoUnidadeIdSelecionado,
        ...this.formulario,
      })
      this.limparFormulario()
    },

    limparFormulario() {
      this.modo = 'unidade'
      this.preencherManualmente = true
      this.tentouEnviar = false
      this.tipoUnidadeIdSelecionado = null
      this.tipoSimboloIdSelecionado = null
      this.simboloIdSelecionado = null
      this.cargoIdSelecionado = null
      this.formulario = formularioVazio()
    },
  },
}
</script>
