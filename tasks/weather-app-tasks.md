# Backlog de Tarefas — Weather App

Backlog derivado de [plans/weather-app-plan.md](../plans/weather-app-plan.md) e
rastreável a [specs/weather-app-spec.md](../specs/weather-app-spec.md). A ordem
segue: tipos → funções puras → services → hook → componentes → integração →
testes → hardening. Dependências indicam pré-requisitos diretos; “—” significa
que a tarefa pode começar sem outra tarefa deste backlog.


**Prioridade:** P0 = essencial para a primeira experiência utilizável e os
requisitos centrais; P1 = qualidade importante após o fluxo principal; P2 =
validação ampliada ou operação de release, adiável durante a demonstração
local. P2 não dispensa requisito aplicável antes do release correspondente.
**Tamanho relativo:** P = unidade pequena e isolada; M = esforço moderado, com
vários casos ou integrações; G = esforço amplo, matriz ou trabalho operacional.
São estimativas relativas, não prazos.

### Sequência sugerida em fatias verticais

1. **Fatia 1 — Buscar cidade e ver clima atual (primeiro marco visível):**
   implementar `T-01`–`T-14` e `T-18`; verificar com `T-22`, `T-23` e
   `T-25`–`T-31`. Ao concluir `T-18`, a pessoa consegue pesquisar uma cidade,
   selecioná-la e ver o clima atual no app.
2. **Fatia 2 — Completar previsão e unidade:** implementar `T-15`–`T-17` e
   `T-19`–`T-21`; verificar com `T-32`–`T-39`. Entrega a previsão de cinco
   dias, alternância Celsius/Fahrenheit, atribuição, fluxo E2E completo e
   validação responsiva em desktop e mobile.
3. **Fatia 3 — Resiliência e prontidão de release:** concluir `T-40`–`T-46`,
   cobrindo auditoria axe, teclado, desempenho, compatibilidade ampla e
   disponibilidade operacional.


## Entrega 1 — Tipos

### T-01 — Definir os contratos do domínio meteorológico

- **Descrição:** Criar os tipos internos de cidade, dados meteorológicos,
  unidades, estados de busca/carregamento e erros.
- **Critérios de aceite:**
  - `City` contém `id`, `name`, `country`, `countryCode`, `adminRegion`,
    `latitude`, `longitude` e `timezone`; `adminRegion` admite `null`.
  - Métricas meteorológicas ausentes admitem `null`; `LoadState<T>` distingue
    `idle`, `loading`, `success`, `partial`, `unavailable` e `error`; busca
    distingue `idle`, `loading`, `results`, `empty` e `error`.
  - `WeatherViewState` mantém `current` e `forecast` independentes; `Unit`
    contém somente `celsius` e `fahrenheit`.
- **Dependências:** —
- **Arquivos prováveis:** `src/types/weather.ts`
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M
- **Rastreabilidade:** FR-01–FR-04; AC-FR-01 (cidade e busca), AC-FR-02,
  AC-FR-03, AC-FR-04.

## Entrega 2 — Funções puras

### T-02 — Mapear códigos meteorológicos para pt-BR

- **Descrição:** Implementar o mapeamento de códigos WMO para descrições
  meteorológicas em português.
- **Critérios de aceite:**
  - O código WMO `0` retorna exatamente “Céu limpo”.
  - Qualquer código numérico não presente no mapa retorna exatamente
    “Condição indisponível”; o valor numérico não faz parte da descrição.
  - A função aceita códigos do clima atual e da previsão sem depender do tipo
    de chamada.
- **Dependências:** —
- **Arquivos prováveis:** `src/lib/weatherCodes.ts`
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M
- **Rastreabilidade:** AC-FR-02 (códigos `0` e desconhecidos), AC-FR-03
  (códigos `0` e desconhecidos); NFR-09.

### T-03 — Implementar formatadores pt-BR

- **Descrição:** Criar formatadores puros para datas, horas e números usados na
  interface.
- **Critérios de aceite:**
  - A entrada de data `2026-10-26` resulta em `26/10/2026`; a hora local
    `2026-10-26T11:00` resulta em `11:00`.
  - Valores formatados usam vírgula decimal e não exibem casas decimais quando
    a parte fracionária é zero.
  - A formatação de hora sem referência retorna um estado sem horário; não usa
    `Date.now()` nem o relógio do sistema.
- **Dependências:** —
- **Arquivos prováveis:** `src/lib/format.ts`
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M
- **Rastreabilidade:** AC-FR-02 (hora local/ausente); AC-FR-03 (data local);
  NFR-01, NFR-08.

### T-04 — Implementar conversão de temperatura

- **Descrição:** Implementar conversão Celsius/Fahrenheit e arredondamento sem
  alterar os valores canônicos em Celsius.
- **Critérios de aceite:**
  - Fahrenheit é calculado pela fórmula `F = C × 9/5 + 32` a partir do valor
    Celsius original.
  - O arredondamento usa uma casa decimal, empates para longe de zero, e omite
    `.0`.
  - Os valores Celsius `20`, `20,24`, `20,25` e `-0,05` são exibidos como
    `20`, `20,2`, `20,3` e `-0,1`.
- **Dependências:** T-01
- **Arquivos prováveis:** `src/lib/temperature.ts`
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M
- **Rastreabilidade:** FR-04; AC-FR-04; NFR-01.

## Entrega 3 — Services e normalização da API

### T-05 — Implementar transporte HTTP com timeout

- **Descrição:** Criar a camada comum de `fetch` com timeout, cancelamento e
  classificação de erros HTTP e de rede.
- **Critérios de aceite:**
  - Com relógio falso, cada chamada pendente é abortada ao atingir 10.000 ms e
    sinal externo abortado também cancela o `fetch`.
  - Resposta `429` produz erro `rate_limit`; outro status não-2xx produz
    `http`; falha de transporte produz `network`; timeout produz `timeout`.
  - Cada cenário executa exatamente um `fetch`, sem retry automático ou
    resposta de sucesso em caso de erro.
- **Dependências:** T-01
- **Arquivos prováveis:** `src/services/weatherService.ts`,
  `src/types/weather.ts`
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M
- **Rastreabilidade:** AC-FR-01 (timeout/HTTP/429/rede), AC-FR-02
  (timeout/HTTP/429/rede), AC-FR-03 (timeout/HTTP/429/rede); NFR-05.

### T-06 — Implementar serviço de geocodificação

- **Descrição:** Consultar o endpoint de geocodificação e normalizar resultados
  válidos para o tipo `City`.
- **Critérios de aceite:**
  - A URL contém `name` com a consulta codificada, `language=pt` e
    `format=json`; cada invocação do serviço executa exatamente um `fetch`.
  - `results: []` retorna lista vazia; `results` ausente/não-array e lista
    não vazia sem registros utilizáveis retornam `invalid_response`.
  - Cada registro normalizado exige ID numérico, nome/país/código do país/fuso
    não vazios e coordenadas dentro de latitude `[-90, 90]` e longitude
    `[-180, 180]`; `admin1` ausente vira `adminRegion: null`.
  - Valores válidos são preservados sem inferência; registros inválidos são
    descartados se houver ao menos um válido.
- **Dependências:** T-01, T-05
- **Arquivos prováveis:** `src/services/weatherService.ts`
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M
- **Rastreabilidade:** FR-01; AC-FR-01; NFR-10.

### T-07 — Normalizar resposta de clima atual

- **Descrição:** Implementar a consulta de clima atual e seu mapeamento para o
  modelo de domínio.
- **Critérios de aceite:**
  - A URL contém latitude/longitude da cidade selecionada,
    `temperature_unit=celsius`, `timezone=<City.timezone>` e
    `current=temperature_2m,weather_code`.
  - `current` ausente ou não-objeto retorna `invalid_response`; cada métrica
    ausente, `null` ou não numérica é normalizada para `null`.
  - `current.time` é preservado sem conversão de fuso; se ausente, o resultado
    contém `referenceTime: null`.
- **Dependências:** T-01, T-02, T-05
- **Arquivos prováveis:** `src/services/weatherService.ts`
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M
- **Rastreabilidade:** FR-02; AC-FR-02; NFR-08, NFR-09.

### T-08 — Normalizar resposta de previsão diária

- **Descrição:** Implementar a consulta diária e mapear os dados para cinco
  `ForecastDay` locais.
- **Critérios de aceite:**
  - A URL contém latitude/longitude selecionadas, `temperature_unit=celsius`,
    `timezone=<City.timezone>`, as três métricas diárias e `forecast_days=5`.
  - Com relógio congelado, aceita somente cinco datas ISO válidas em ordem,
    começando na data de hoje no fuso selecionado e avançando um dia por item.
  - `daily`/`daily.time` ausente ou malformado, datas inválidas, duplicadas,
    fora de ordem ou período incorreto retornam `invalid_response`.
  - Métrica ausente, curta, `null` ou não numérica gera `null` somente no
    índice correspondente; campos incompletos classificam o resultado como
    `partial`.
- **Dependências:** T-01, T-02, T-05
- **Arquivos prováveis:** `src/services/weatherService.ts`
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M
- **Rastreabilidade:** FR-03; AC-FR-03; NFR-09.

## Entrega 4 — Hook e orquestração do estado

### T-09 — Implementar estado e validação da busca

- **Descrição:** Implementar no hook validação, submissão, resultados e erro
  da busca de cidades.
- **Critérios de aceite:**
  - Após trim, comprimento medido por pontos de código Unicode (`[...value]`)
    de 0 ou mais de 100 retorna validação inválida; comprimentos 1 e 100 são
    aceitos.
  - Entradas inválidas não chamam geocoding; estados de busca são
    `idle/loading/results/empty/error` conforme a operação.
  - Durante `loading`, nova submissão não inicia chamada adicional; retry usa
    exatamente a última consulta normalizada.
- **Dependências:** T-01, T-06
- **Arquivos prováveis:** `src/hooks/useWeather.ts`
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M
- **Rastreabilidade:** FR-01; AC-FR-01.

### T-10 — Carregar clima atual após selecionar cidade

- **Descrição:** Integrar seleção de cidade ao estado independente do clima
  atual no hook.
- **Critérios de aceite:**
  - Selecionar cidade chama o service de clima atual uma vez com ID,
    latitude, longitude e fuso correspondentes e define o estado como
    `loading`.
  - Ao selecionar cidade B depois de A, valores de sucesso de A deixam de ser
    apresentados como dados atuais.
  - Respostas completas, parciais, sem temperatura e condição e com erro
    resultam respectivamente em `success`, `partial`, `unavailable` e `error`.
- **Dependências:** T-01, T-07, T-09
- **Arquivos prováveis:** `src/hooks/useWeather.ts`
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M
- **Rastreabilidade:** FR-01, FR-02; AC-FR-02.

### T-11 — Carregar previsão após selecionar cidade

- **Descrição:** Integrar ao hook o estado independente da previsão diária.
- **Critérios de aceite:**
  - Selecionar cidade chama o service de previsão uma vez com latitude,
    longitude e fuso correspondentes e define o estado como `loading`.
  - Atualizações da previsão alteram somente `forecast`; o estado `current`
    permanece inalterado até sua própria resposta ou erro.
  - Resposta completa, incompleta e erro resultam respectivamente em
    `success`, `partial` e `error`.
- **Dependências:** T-08, T-10
- **Arquivos prováveis:** `src/hooks/useWeather.ts`
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M
- **Rastreabilidade:** FR-01, FR-03; AC-FR-03.

### T-12 — Descartar respostas antigas e isolar retries

- **Descrição:** Proteger o hook contra respostas tardias e permitir retry
  manual restrito à operação que falhou.
- **Critérios de aceite:**
  - Respostas controladas de busca/consulta A resolvidas depois da operação B
    não alteram resultados, cidade selecionada, current ou forecast de B.
  - Ao selecionar cidade, current e forecast são iniciados antes de qualquer
    uma das duas promises ser resolvida.
  - Retry chama somente o service correspondente uma vez, preserva o sucesso
    da outra operação e não ocorre automaticamente.
  - Uma nova seleção não reaproveita resposta meteorológica da seleção
    anterior.
- **Dependências:** T-09, T-10, T-11
- **Arquivos prováveis:** `src/hooks/useWeather.ts`
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M
- **Rastreabilidade:** AC-FR-01, AC-FR-02, AC-FR-03; NFR-05, NFR-08.

## Entrega 5 — Componentes

### T-13 — Implementar campo e resultados de busca

- **Descrição:** Criar o componente de busca com submissão e resultados
  selecionáveis por teclado.
- **Critérios de aceite:**
  - Submissão por botão e Enter aciona uma submissão; erro de validação mantém
    foco no campo e exibe a mensagem especificada para entrada vazia ou acima
    do limite.
  - Cada resultado mostra nome e país, inclui região quando não nula, e é
    selecionável por Enter/Space após foco por teclado.
  - Fixture contendo `<script>` aparece como texto literal e não cria elemento
    `script` no DOM.
- **Dependências:** T-09
- **Arquivos prováveis:** `src/components/SearchBar.tsx`
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** M
- **Rastreabilidade:** FR-01; AC-FR-01; NFR-03, NFR-10.

### T-14 — Implementar painel de clima atual

- **Descrição:** Criar o componente visual do clima atual e seus estados.
- **Critérios de aceite:**
  - Com dados válidos apresenta nome da cidade, temperatura, unidade e
    descrição pt-BR correspondentes ao objeto recebido.
  - `2026-10-26T11:00` em `America/Sao_Paulo` é exibido como “Estimativa do
    modelo para 11:00”; `referenceTime: null` exibe “Horário de referência
    indisponível”.
  - Campo de temperatura ou condição nulo exibe “Indisponível” no campo
    correspondente; ambos ausentes resultam em `unavailable` sem cartão de
    consulta válida.
- **Dependências:** T-02, T-03, T-04, T-10
- **Arquivos prováveis:** `src/components/CurrentWeather.tsx`
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** M
- **Rastreabilidade:** FR-02; AC-FR-02; NFR-01, NFR-08, NFR-09.

### T-15 — Implementar cartão de previsão diária

- **Descrição:** Criar um componente para exibir uma data e suas métricas
  meteorológicas.
- **Critérios de aceite:**
  - Para uma fixture do dia, mostra data formatada, mínima, máxima e descrição
    da mesma entrada, sem usar dados de outra data.
  - Métrica nula mostra “Indisponível”; código WMO desconhecido mostra
    “Condição indisponível” e não aparece numericamente.
  - Dia sem métricas utilizáveis mostra “Sem dados”.
- **Dependências:** T-02, T-03, T-04
- **Arquivos prováveis:** `src/components/ForecastCard.tsx`
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** P
- **Rastreabilidade:** FR-03; AC-FR-03; NFR-01, NFR-09.

### T-16 — Implementar lista de cinco dias

- **Descrição:** Criar a lista que compõe os cinco cartões em ordem local
  cronológica e apresenta estados de consulta.
- **Critérios de aceite:**
  - Com cinco itens de entrada, renderiza exatamente cinco cartões em ordem e
    cada cartão apresenta dados do mesmo índice.
  - `loading` apresenta “Carregando previsão…” em `role=status`; `error`
    apresenta a mensagem especificada em `role=alert` e retry chama somente a
    ação de previsão.
  - Loading ou erro da previsão não altera nem remove o painel de clima atual.
- **Dependências:** T-11, T-15
- **Arquivos prováveis:** `src/components/ForecastList.tsx`
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** M
- **Rastreabilidade:** FR-03; AC-FR-03; NFR-03.

### T-17 — Implementar alternância de unidade

- **Descrição:** Criar o controle acessível para escolher Celsius ou Fahrenheit.
- **Critérios de aceite:**
  - O controle oferece somente Celsius e Fahrenheit e identifica por nome/estado
    qual opção está selecionada.
  - As duas opções podem ser selecionadas por teclado; estado inicial é Celsius
    e a seleção não é escrita em `localStorage` ou `sessionStorage`.
- **Dependências:** T-01
- **Arquivos prováveis:** `src/components/UnitToggle.tsx`
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** P
- **Rastreabilidade:** FR-04, FR-05; AC-FR-04, AC-FR-05; NFR-03, NFR-06.

## Entrega 6 — Integração da aplicação

### T-18 — Compor a primeira tela de busca e clima atual

- **Descrição:** Integrar busca, seleção de cidade e painel de clima atual na
  aplicação para formar a primeira entrega visível.
- **Critérios de aceite:**
  - A tela renderiza `SearchBar` e `CurrentWeather` e conecta submissão,
    seleção e retry às ações do hook.
  - Ao selecionar cidade, mostra o nome selecionado e o estado/dado do clima
    atual correspondente; sem cidade selecionada, não exibe clima antigo.
  - A primeira renderização utilizável permite buscar uma cidade e, após
    seleção, exibir o clima atual sem exigir a conclusão da previsão diária.
- **Dependências:** T-09, T-10, T-12, T-13, T-14
- **Arquivos prováveis:** `src/App.tsx`
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** M
- **Rastreabilidade:** FR-01, FR-02; AC-FR-01, AC-FR-02.

### T-19 — Integrar previsão diária e alternância de unidade

- **Descrição:** Completar a tela composta com previsão de cinco dias e escolha
  de unidade, mantendo a busca e o clima atual integrados.
- **Critérios de aceite:**
  - A tela renderiza `ForecastList` e `UnitToggle` junto aos elementos já
    integrados em T-18.
  - Estado de unidade inicial é `celsius`; selecionar `fahrenheit` atualiza a
    temperatura atual e todas as mínimas/máximas sem chamar services.
  - Após Celsius → Fahrenheit → Celsius, cidade, datas e condições permanecem
    idênticas e os valores Celsius originais reaparecem.
- **Dependências:** T-04, T-11, T-15, T-16, T-17, T-18
- **Arquivos prováveis:** `src/App.tsx`
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** M
- **Rastreabilidade:** FR-03, FR-04; AC-FR-03, AC-FR-04.

### T-20 — Aplicar layout responsivo

- **Descrição:** Implementar estilos globais e layout para as larguras de
  viewport cobertas pela spec.
- **Critérios de aceite:**
  - Em larguras de 320, 375, 768, 1024, 1280 e 1920 CSS px,
    `document.documentElement.scrollWidth <= clientWidth`.
  - Nos viewports `320 × 568`, `375 × 667` e `1280 × 800`, bounding boxes de
    busca, seleção, clima atual, lista diária e alternância ficam dentro do
    viewport.
  - Em cada viewport de referência é possível submeter busca e acionar a
    alternância sem elemento cobrindo o controle.
- **Dependências:** T-19
- **Arquivos prováveis:** `src/styles/index.css`
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** M
- **Rastreabilidade:** FR-05; AC-FR-05; NFR-02.

### T-21 — Exibir atribuição da fonte meteorológica

- **Descrição:** Apresentar atribuição visível para Open-Meteo e licença CC BY
  4.0 na aplicação.
- **Critérios de aceite:**
  - O DOM contém “Dados meteorológicos: Open-Meteo (CC BY 4.0)” e links com
    `href` exatamente `https://open-meteo.com/` e
    `https://creativecommons.org/licenses/by/4.0/`.
  - O DOM contém “Descrições e unidades foram traduzidas/convertidas.”
  - O texto de atribuição não usa “observação”, “estação” ou “atualização”
    para rotular os valores atuais.
- **Dependências:** T-19
- **Arquivos prováveis:** `src/App.tsx`
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** P
- **Rastreabilidade:** AC-NFR-07; NFR-07, NFR-08.

## Entrega 7 — Testes

### T-22 — Testar o mapeamento de códigos meteorológicos

- **Descrição:** Adicionar testes unitários para códigos conhecidos e
  desconhecidos.
- **Critérios de aceite:**
  - O teste do código `0` espera exatamente “Céu limpo”.
  - Código numérico não mapeado retorna exatamente “Condição indisponível” e
    sua descrição não contém o código.
  - Cada chave exportada pelo mapa tem um caso com o valor esperado.
- **Dependências:** T-02
- **Arquivos prováveis:** `tests/unit/lib/weatherCodes.test.ts`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** P
- **Rastreabilidade:** AC-FR-02, AC-FR-03; NFR-09.

### T-23 — Testar os formatadores pt-BR

- **Descrição:** Cobrir formatadores de data, hora e número com testes
  unitários.
- **Critérios de aceite:**
  - Fixtures `2026-10-26` e `2026-10-26T11:00` produzem `26/10/2026` e `11:00`.
  - Testes verificam vírgula decimal, omissão de `.0` e saída sem horário para
    referência ausente.
  - Avançar o relógio do sistema não altera o resultado sem horário.
- **Dependências:** T-03
- **Arquivos prováveis:** `tests/unit/lib/format.test.ts`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** P
- **Rastreabilidade:** AC-FR-02, AC-FR-03; NFR-01, NFR-08.

### T-24 — Testar conversão e arredondamento de temperatura

- **Descrição:** Criar testes unitários Vitest para conversão, arredondamento e
  preservação do valor de origem.
- **Critérios de aceite:**
  - Testes verificam os exemplos de AC-FR-04 e a conversão de `20 °C` para
    `68 °F`.
  - Alternar unidades repetidamente sempre parte do valor Celsius original.
- **Dependências:** T-04
- **Arquivos prováveis:** `tests/unit/lib/temperature.test.ts`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** P
- **Rastreabilidade:** FR-04; AC-FR-04; NFR-01.

### T-25 — Testar o serviço de geocodificação

- **Descrição:** Testar com `fetch` mockado a requisição, normalização e
  respostas de erro do geocoding.
- **Critérios de aceite:**
  - Há asserts para resposta válida, `results: []`, `results` ausente,
    resultado com registro inválido e válido e lista sem registros utilizáveis.
  - A URL verificada contém `name`, `language=pt` e `format=json`; confirma
    exatamente um `fetch` por invocação.
  - Vitest substitui `globalThis.fetch` por mock e fornece respostas HTTP
    controladas, sem requisições de rede reais.
  - Erro HTTP, `429`, rede, timeout e cancelamento produzem os códigos de erro
    definidos no contrato.
- **Dependências:** T-05, T-06
- **Arquivos prováveis:** `tests/unit/services/geocoding.test.ts`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M
- **Rastreabilidade:** FR-01; AC-FR-01; NFR-05.

### T-26 — Testar normalização de clima atual

- **Descrição:** Testar com `fetch` mockado o mapeamento de clima atual e suas
  respostas incompletas/inválidas.
- **Critérios de aceite:**
  - Testes comparam URL e objeto normalizado de resposta completa, incluindo
    fuso, temperatura, código e `current.time`.
  - Fixtures cobrem `current.time` ausente, cada métrica ausente/nula/não
    numérica, `current` ausente e `current` não-objeto.
  - Vitest substitui `globalThis.fetch` por mock e confirma que nenhuma
    requisição de rede real é executada.
  - HTTP, `429`, rede, timeout e cancelamento são assertados pelo código de
    erro definido no contrato.
- **Dependências:** T-05, T-07
- **Arquivos prováveis:** `tests/unit/services/currentWeather.test.ts`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M
- **Rastreabilidade:** FR-02; AC-FR-02; NFR-05, NFR-08.

### T-27 — Testar normalização de previsão diária

- **Descrição:** Testar com `fetch` mockado resposta diária completa, parcial e
  estruturalmente inválida.
- **Critérios de aceite:**
  - Relógio congelado em `2026-10-27T02:00:00Z` e fuso `UTC-03:00` esperam as
    datas locais `2026-10-26` a `2026-10-30`; data ausente, duplicada, fora de
    ordem ou período incorreto espera `invalid_response`.
  - Arrays ausentes, curtos ou com valor inválido produzem `null` no índice
    exato e `partial`, sem deslocamento de dados.
  - Vitest substitui `globalThis.fetch` por mock e confirma que nenhuma
    requisição de rede real é executada.
  - HTTP, `429`, rede, timeout e cancelamento são assertados pelo código de
    erro definido no contrato.
- **Dependências:** T-05, T-08
- **Arquivos prováveis:** `tests/unit/services/forecast.test.ts`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M
- **Rastreabilidade:** FR-03; AC-FR-03; NFR-05.

### T-28 — Testar validação e estado da busca no hook

- **Descrição:** Testar validação, submissão e estados de busca no hook.
- **Critérios de aceite:**
  - Casos enviam vazio, espaços, 101 pontos, 100 pontos, espaços externos e
    texto Unicode; só entradas válidas chamam o service uma vez.
  - Testes assertam `loading`, `empty`, `results` e `error`.
  - Retry usa consulta já normalizada e gera exatamente uma chamada adicional.
- **Dependências:** T-09, T-25
- **Arquivos prováveis:** `tests/unit/hooks/useWeather.test.ts`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M
- **Rastreabilidade:** FR-01; AC-FR-01.

### T-29 — Testar consultas meteorológicas no hook

- **Descrição:** Testar estados independentes, concorrência e retry das
  consultas atuais e diárias.
- **Critérios de aceite:**
  - Testes verificam current com falha/daily com sucesso e current com sucesso/
    daily com falha, preservando o resultado válido.
  - Promises resolvidas fora de ordem confirmam que respostas de A não
    substituem dados de B em current nem forecast.
  - Retry chama uma vez somente a operação falha; teste confirma zero chamadas
    novas para a operação bem-sucedida e cobre timeout e estado parcial.
- **Dependências:** T-10, T-11, T-12, T-26, T-27, T-28
- **Arquivos prováveis:** `tests/unit/hooks/useWeather.test.ts`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M
- **Rastreabilidade:** AC-FR-01, AC-FR-02, AC-FR-03; NFR-05.

### T-30 — Testar o componente de busca

- **Descrição:** Testar submissão, resultados, seleção, mensagens e semântica
  do componente de busca.
- **Critérios de aceite:**
  - Testes assertam submissão por Enter, foco mantido, mensagens exatas para
    vazio/mais de 100 pontos, seleção por teclado e estado vazio com
    “Nenhuma cidade encontrada.”
  - Loading mostra “Buscando cidades…” em `role=status`; erro HTTP/rede mostra
    a mensagem especificada em `role=alert`; retry provoca exatamente uma nova
    submissão.
  - Fixture `<script>...</script>` é texto literal e não cria nó `script`.
- **Dependências:** T-13, T-28
- **Arquivos prováveis:** `tests/unit/components/SearchBar.test.tsx`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** P
- **Rastreabilidade:** FR-01; AC-FR-01; NFR-03, NFR-10.

### T-31 — Testar o painel de clima atual

- **Descrição:** Testar estados e conteúdo do painel de clima atual.
- **Critérios de aceite:**
  - Fixtures `idle` (nenhuma cidade selecionada), `loading`, `success`,
    `partial`, `unavailable` e `error` verificam o conteúdo renderizado em cada
    estado; `idle` não apresenta cartão de consulta.
  - Fixtures de hora presente/nula verificam as mensagens exatas; código WMO
    desconhecido mostra “Condição indisponível”.
  - “Carregando clima…” usa `role=status`; erro usa `role=alert`; retry invoca
    callback uma vez.
- **Dependências:** T-14
- **Arquivos prováveis:** `tests/unit/components/CurrentWeather.test.tsx`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** P
- **Rastreabilidade:** FR-02; AC-FR-02; NFR-03, NFR-08, NFR-09.

### T-32 — Testar cartão de previsão

- **Descrição:** Testar apresentação de dados completos, parciais e ausentes
  em um dia.
- **Critérios de aceite:**
  - Fixture determinística verifica a data em `dd/MM/yyyy`, mínima, máxima e
    descrição do dia fornecido.
  - Métrica nula, dia sem dados e código desconhecido produzem respectivamente
    “Indisponível”, “Sem dados” e “Condição indisponível”.
  - Nenhum texto renderizado contém o código WMO desconhecido.
- **Dependências:** T-15
- **Arquivos prováveis:** `tests/unit/components/ForecastCard.test.tsx`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** P
- **Rastreabilidade:** FR-03; AC-FR-03; NFR-01, NFR-09.

### T-33 — Testar lista e estados da previsão

- **Descrição:** Testar composição dos cinco dias e os estados do componente de
  lista.
- **Critérios de aceite:**
  - Fixture com cinco datas renderiza exatamente cinco elementos em ordem
    cronológica e cada elemento contém os valores do mesmo dia; entrada sem
    cidade selecionada não renderiza cartões de previsão.
  - Testes verificam estados loading/vazio/erro; erro mostra a mensagem
    especificada em `role=alert` e retry chama somente a operação de previsão
    uma vez.
  - Com clima atual em sucesso e previsão em erro, o conteúdo do painel atual
    continua no DOM.
- **Dependências:** T-16, T-32
- **Arquivos prováveis:** `tests/unit/components/ForecastList.test.tsx`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** P
- **Rastreabilidade:** FR-03; AC-FR-03.

### T-34 — Testar alternância de unidade

- **Descrição:** Verificar seleção, estado e acessibilidade do controle de
  unidade.
- **Critérios de aceite:**
  - Testes selecionam cada unidade por teclado e verificam a mudança do estado
    selecionado entre Celsius e Fahrenheit.
  - A unidade inicial é Celsius e não existe preferência de unidade em
    local/session storage.
- **Dependências:** T-17
- **Arquivos prováveis:** `tests/unit/components/UnitToggle.test.tsx`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** P
- **Rastreabilidade:** FR-04; AC-FR-04; NFR-03, NFR-06.

### T-35 — Testar integração da tela

- **Descrição:** Testar o fluxo integrado entre seleção da cidade, painéis e
  alternância de unidade.
- **Critérios de aceite:**
  - Selecionar fixture de cidade e resolver current/daily verifica nome e dados
    específicos dessa fixture nos dois painéis.
  - Espiões confirmam zero novas chamadas meteorológicas durante cada
    alternância Celsius/Fahrenheit.
  - Recarregar a tela seleciona Celsius e não lê nem grava unidade em storage.
- **Dependências:** T-18, T-30, T-31, T-32, T-33, T-34
- **Arquivos prováveis:** `tests/unit/components/App.test.tsx`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M
- **Rastreabilidade:** FR-01–FR-04; AC-FR-01–AC-FR-04.

### T-36 — Testar atribuição e conteúdo externo

- **Descrição:** Verificar atribuição e renderização segura de conteúdo externo
  na tela integrada.
- **Critérios de aceite:**
  - Testes verificam texto de atribuição e igualdade exata dos dois `href`s
    exigidos pela spec.
  - Cidade contendo `<script>window.__test=1</script>` é texto literal, não
    cria nó `script` e não altera `window.__test`.
- **Dependências:** T-21, T-30, T-35
- **Arquivos prováveis:** `tests/unit/components/App.test.tsx`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** P
- **Rastreabilidade:** AC-NFR-07; NFR-07, NFR-10.

### T-37 — Testar fluxo E2E principal

- **Descrição:** Implementar fluxo Playwright determinístico de busca até
  consulta e alternância de unidade.
- **Critérios de aceite:**
  - Todas as três URLs Open-Meteo são interceptadas por `page.route`; o teste
    não requer requisições reais à API.
  - O fluxo pesquisa e seleciona uma cidade fixture, verifica nome/país,
    clima atual, cinco datas/previsões e resultados ao alternar Fahrenheit e
    voltar a Celsius.
  - O mesmo fluxo passa no viewport mobile `320 × 568` e no desktop
    `1280 × 800`; em ambos os viewports os controles e os resultados principais
    permanecem visíveis e operáveis.
- **Dependências:** T-19, T-20, T-21, T-35
- **Arquivos prováveis:** `tests/e2e/weather-flow.spec.ts`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M
- **Rastreabilidade:** FR-01–FR-05; AC-FR-01–AC-FR-05.

### T-38 — Testar erros e retry em E2E

- **Descrição:** Cobrir lista vazia, falhas de serviço, retry e conteúdo
  externo em testes ponta a ponta.
- **Critérios de aceite:**
  - Cenário vazio verifica “Nenhuma cidade encontrada.” e zero chamadas de
    clima; cenários de erro cobrem geocoding, current e forecast.
  - Em cada cenário, retry gera chamada somente para endpoint com falha e
    mantém resultado bem-sucedido de outro endpoint.
  - Texto `<script>` fornecido pelo mock permanece literal e não é executado.
- **Dependências:** T-37
- **Arquivos prováveis:** `tests/e2e/weather-errors.spec.ts`
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M
- **Rastreabilidade:** AC-FR-01–AC-FR-03; NFR-05, NFR-10.

### T-39 — Validar viewports e ausência de overflow em E2E

- **Descrição:** Automatizar verificação responsiva do fluxo principal nos
  viewports e larguras definidos.
- **Critérios de aceite:**
  - O teste percorre busca, seleção, consulta e alternância em
    `320 × 568`, `375 × 667` e `1280 × 800`.
  - Em larguras 320, 375, 768, 1024, 1280 e 1920, assert
    `scrollWidth <= clientWidth`.
  - A configuração de execução rápida inclui projetos Chromium e WebKit mobile
    emulado, ambos com resultado reportado separadamente.
- **Dependências:** T-20, T-37
- **Arquivos prováveis:** `tests/e2e/responsive.spec.ts`
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M
- **Rastreabilidade:** AC-FR-05; NFR-02.

## Entrega 8 — Hardening e prontidão para release

### T-40 — Adicionar dependência de axe para Playwright

- **Descrição:** Incluir `@axe-core/playwright` como dependência de teste, caso
  ainda não esteja no projeto.
- **Critérios de aceite:**
  - `@axe-core/playwright` consta em `devDependencies`, não em
    `dependencies`.
  - `pnpm install --frozen-lockfile` termina com código zero após atualizar o
    lockfile.
- **Dependências:** —
- **Arquivos prováveis:** `package.json`, `pnpm-lock.yaml`
- **Tipo:** Infra
- **Prioridade:** P1
- **Tamanho:** P
- **Rastreabilidade:** NFR-03.

### T-41 — Automatizar auditoria axe

- **Descrição:** Adicionar auditoria axe aos fluxos acessíveis da aplicação.
- **Critérios de aceite:**
  - O teste executa axe na tela inicial e nos estados de busca vazia, erro,
    clima carregado e previsão carregada.
  - Em cada execução, violações com impacto `critical` ou `serious` têm
    comprimento zero.
- **Dependências:** T-37, T-40
- **Arquivos prováveis:** `tests/e2e/accessibility.spec.ts`
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M
- **Rastreabilidade:** NFR-03.

### T-42 — Verificar fluxos manualmente por teclado

- **Descrição:** Validar e registrar navegação por teclado em busca, seleção,
  consulta e alternância de unidade.
- **Critérios de aceite:**
  - Checklist preenchido registra busca, seleção, retry e toggle executados
    somente com Tab, Shift+Tab, Enter ou Space; se o controle usar grupo de
    opções, setas mudam a opção e Tab move o foco para fora do grupo.
  - Cada controle interativo recebe foco visível; nenhuma ação depende de
    hover ou mouse.
  - O registro inclui navegador, versão, viewport, resultado por etapa e
    defeitos encontrados; falhas ficam identificadas como não aprovadas.
- **Dependências:** T-37, T-41
- **Arquivos prováveis:** `tests/e2e/keyboard-accessibility.md`
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M
- **Rastreabilidade:** NFR-03; AC-FR-05.

### T-43 — Medir desempenho dos fluxos principais

- **Descrição:** Executar medição de p95 com APIs simuladas e condições de rede
  controladas.
- **Critérios de aceite:**
  - Busca e consulta são medidas em pelo menos 100 execuções cada, com rede
    configurada em 10 Mbps, latência cliente de 100 ms e mocks respondendo em
    no máximo 1 s.
  - Relatório registra amostras e p95 entre submissão e renderização; cada p95
    é menor ou igual a 3.000 ms.
- **Dependências:** T-37
- **Arquivos prováveis:** `tests/e2e/performance.spec.ts`
- **Tipo:** Test
- **Prioridade:** P2
- **Tamanho:** G
- **Rastreabilidade:** NFR-04.

### T-44 — Validar compatibilidade de navegadores para release

- **Descrição:** Executar e registrar a matriz de compatibilidade de browsers e
  dispositivos definida no plano.
- **Critérios de aceite:**
  - Configuração de PR declara e executa projetos Chromium e WebKit mobile
    emulado.
  - Registro pré-release informa navegador/dispositivo, versão major, sistema
    operacional e resultado para os três majors estáveis mais recentes de
    Chrome, Edge, Firefox e Safari desktop, Safari/iOS e Chrome/Android reais.
  - Cada matriz mobile inclui evidência de execução em dispositivo real; um
    resultado só em emulador é marcado como incompleto.
- **Dependências:** T-37, T-39
- **Arquivos prováveis:** configuração Playwright/CI do projeto
- **Tipo:** Test
- **Prioridade:** P2
- **Tamanho:** G
- **Rastreabilidade:** NFR-02.

### T-45 — Definir hospedagem e responsabilidade pelo SLI

- **Descrição:** Resolver decisões operacionais pendentes para medir a
  disponibilidade mensal da aplicação.
- **Critérios de aceite:**
  - Documento contém valores não vazios para provedor de hospedagem, URL
    monitorada, serviço/frequência da sonda, destino das métricas e responsável
    nominal pela revisão.
  - Define separadamente o indicador HTTP 2xx do shell e o indicador de
    disponibilidade do Open-Meteo.
  - Registra implantação não comercial e ausência de armazenamento/cache de
    respostas meteorológicas.
- **Dependências:** T-19, T-21
- **Arquivos prováveis:** `docs/operations/availability.md`
- **Tipo:** Infra
- **Prioridade:** P2
- **Tamanho:** M
- **Rastreabilidade:** NFR-05, NFR-07.

### T-46 — Configurar sonda e relatório de disponibilidade

- **Descrição:** Configurar monitoramento externo contínuo conforme decisões
  operacionais aprovadas.
- **Critérios de aceite:**
  - A sonda executa a cada minuto e classifica como sucesso somente resposta
    HTTP 2xx do shell.
  - Relatório mensal calcula `100 × verificações 2xx / verificações totais`,
    compara com 99,5% e reporta Open-Meteo em série separada.
  - Conta/grupo do responsável identificado em T-45 tem acesso de leitura ao
    relatório e à configuração da sonda.
- **Dependências:** T-45
- **Arquivos prováveis:** configuração do serviço de monitoramento,
  `docs/operations/availability.md`
- **Tipo:** Infra
- **Prioridade:** P2
- **Tamanho:** M
- **Rastreabilidade:** NFR-05.
