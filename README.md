# Template — Organograma da Simulação (Vue 3 + Vue Flow)

Réplica independente do Organograma da Simulação, sem API e sem dependências de arquitetura
de nenhum sistema. Os dados são fictícios (`src/dados`) e o salvamento é feito na sessão do
navegador (`sessionStorage`), em dois formatos de exemplo.

## Comandos

```sh
pnpm install
pnpm dev      # http://localhost:8080
pnpm test     # Vitest
pnpm build
```

## Funcionalidades

- Layout automático em árvore; ao carregar, só as raízes e os filhos diretos ficam visíveis.
- Expandir/recolher subordinadas (botão com a quantidade abaixo da caixa).
- Cores e selo por status: Atual, Acréscimo, Alteração, Extinção.
- Caixa com nome, sigla, quantidade de cargos por símbolo e "Ver detalhes".
- Arrastar caixas, com linhas-guia e encaixe (snap) nas bordas das outras caixas.
- Soltar uma unidade sobre outra para torná-la subordinada (bloqueia ciclos e unidades extintas).
- Ligações "flutuantes" que se ajustam ao arrastar (`conexaoFlutuante.js`).
- Redimensionar caixas (NodeResizer) quando selecionadas, sem deixar a caixa menor que o
  próprio conteúdo: a altura mínima é recalculada conforme a largura durante o arraste.
- Unidades expandidas/recolhidas são gravadas com a disposição e restauradas ao carregar.
- Unidade nova ou movida é posicionada junto do pai, empurrando os ramos vizinhos sem
  desfazer a organização manual.
- Cor de fundo, zoom e posição do organograma, contador de nós, controles de zoom.
- Ações por caixa: adicionar unidade ou cargo/função, editar, excluir (só acréscimos),
  extinguir e restaurar a partir da estrutura atual.
- Modal "Editar alocações": busca, paginação, editar/excluir/restaurar/liberar e
  transferência de cargos para outra unidade (a sigla é recomposta).
- Busca de unidade ou cargo: expande os ancestrais, centraliza e destaca; para cargo, abre
  as alocações na página dele.
- Modo somente leitura e indicador de alterações não salvas.
- Exportação em PDF ou JPG com pré-visualização: papel A4/A3/A2, orientação automática,
  retrato ou paisagem, e quatro modos de ajuste (automático, piso de legibilidade de 70%,
  1 folha e manter legível paginando). O PDF repete cabeçalho, legenda de status e rodapé em
  todas as folhas, e a captura independe do zoom e do tamanho da janela.

## Estrutura

```
src/
├── App.vue                     # página de demonstração (busca, exemplos de salvar)
├── dados/                      # dados fictícios (substituir pelos serviços da API)
├── feedback/                   # notificações e confirmação (sem biblioteca externa)
├── organograma/
│   ├── Organograma.vue         # componente principal (Options API)
│   ├── arvore.js               # operações na estrutura aninhada
│   ├── layoutArvore.js         # layout automático e visibilidade
│   ├── conexaoFlutuante.js     # caminho das ligações
│   ├── exportacao/             # modal, paginação e geração de PDF/JPG
│   ├── linhasAuxiliares/       # linhas-guia durante o arraste
│   └── modais/                 # cadastro/edição e alocações
└── persistencia/
    ├── exemploDisposicao.js    # Exemplo 1
    └── exemploVueFlow.js       # Exemplo 2
```

## Exemplos de salvar

### Exemplo 1 — Disposição (formato atual)

`montarPayloadSalvar(estruturaSimulacao, disposicao)` gera o mesmo payload enviado hoje:

```json
{
  "nos": [{ "id": 31, "tipo": "unit", "tipoAcao": 0, "nome": "...", "sigla": "CMD", "filhos": [] }],
  "jsonPosicaoOrganograma": "{\"posicoes\":{...},\"dimensoes\":{...},\"corFundo\":\"#ffffff\",\"viewport\":{\"x\":0,\"y\":0,\"zoom\":0.8},\"recolhidos\":[\"26\"]}"
}
```

- `posicoes[chave] = { x, y, arrastada? }` e `dimensoes[chave] = { width, height }`.
- `recolhidos` lista as chaves das unidades recolhidas; `null` (sem gravação) aplica o
  recolhimento inicial por nível.
- `chave` é o id do item; para itens acrescidos (sem id definitivo) é baseada na sigla, por
  exemplo `26>sigla:BEM-CUL` (id do pai + sigla).
- Itens acrescidos são enviados com `id: null`. `simularRespostaBackend` faz o papel da API
  ao recarregar: atribui ids novos, reconstrói status e rótulos e devolve a disposição.

### Exemplo 2 — Estrutura nativa do Vue Flow

Segue o [Save & Restore](https://vueflow.dev/examples/save.html) da documentação: grava o
retorno de `toObject()` (`nodes`, `edges`, `position`, `zoom`, `viewport`) e restaura com
`fromObject()`. A árvore de negócio e a cor de fundo são gravadas ao lado, porque não fazem
parte do objeto do Vue Flow. Nós recolhidos não estão em `toObject()`; ao expandi-los, eles
são posicionados junto do pai.

## Usando em outro projeto

1. Copie `src/organograma` e `src/feedback` (ou troque `feedback.js` pela biblioteca do projeto).
2. Troque `src/dados/catalogoExemplo.js` pelas chamadas aos serviços de catálogo.
3. Carregue a tela com `organograma.carregar({ estruturaAtual, estruturaSimulacao, disposicao })`
   e salve com um dos exemplos de `src/persistencia`, trocando `sessionStorage` pela API.
