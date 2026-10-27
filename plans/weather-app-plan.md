# Plano Técnico — Weather App

**Base:** `specs/weather-app-spec.md`  
**Escopo:** MVP web responsivo para demonstração e treinamento não comercial. A API gratuita do Open-Meteo não pode ser usada para operação comercial.

## Arquitetura

Aplicação cliente React, sem backend próprio. A UI chama os endpoints públicos do Open-Meteo por `fetch`; serviços isolam transporte e normalização; hooks coordenam estados assíncronos; componentes recebem dados tipados e apresentam loading, erro, vazio e sucesso.

```text
React UI
  -> hooks (busca, cidade selecionada, clima, unidade)
    -> services/weatherService (fetch, timeout, normalização)
      -> Open-Meteo Geocoding API
      -> Open-Meteo Forecast API (current e daily em chamadas separadas)
```

Não usar autenticação, armazenamento local/remoto, cache meteorológico, polling ou retry automático. Aplicar timeout de 10 s e permitir retry manual. Cada seleção de cidade identifica suas requisições para descartar respostas tardias de seleções anteriores.

## Tecnologias

- **React 19 + TypeScript strict + Vite:** stack existente e suficiente para a SPA cliente.
- **Tailwind CSS:** estilos responsivos conforme configuração existente.
- **React state/hooks nativos:** manter os poucos estados da tela locais; sem Redux, query client ou camada de backend.
- **`fetch` + `AbortController`:** chamadas HTTP, timeout e cancelamento/obsolescência de solicitações.
- **Vitest + Testing Library + user-event:** testes unitários e de componentes já previstos no repositório.
- **Playwright:** testes E2E e viewports desktop/mobile.
- **Biome + pnpm:** lint/formatação e comandos de projeto existentes.
- **axe-core:** usar `@axe-core/playwright` como dependência somente de teste para verificar NFR-03; ainda não consta em `package.json`.

## Estrutura do projeto

Manter a estrutura e responsabilidades do repositório; não criar camadas adicionais sem necessidade.

```text
src/
  App.tsx                         # composição da página e estado de unidade
  components/
    SearchBar.tsx                 # entrada, submissão e resultados de geocoding
    CurrentWeather.tsx            # clima atual e referência temporal do modelo
    ForecastList.tsx              # cinco datas locais
    ForecastCard.tsx              # resumo diário
    UnitToggle.tsx                # Celsius/Fahrenheit
    states/                       # loading, erro, vazio e indisponibilidade
  hooks/
    useWeather.ts                 # busca, seleção, carregamento e descarte de resposta obsoleta
  services/
    weatherService.ts             # geocoding, forecast, timeout e normalização
  lib/
    temperature.ts                # conversão e arredondamento
    weatherCodes.ts               # códigos meteorológicos -> descrições pt-BR
    format.ts                     # data/hora/números pt-BR
  types/
    weather.ts                    # contratos internos e erros
  styles/
    index.css                     # Tailwind e estilos globais

tests/
  unit/                           # services, hooks, formatos, conversões e componentes
  e2e/                            # fluxos integrados com APIs simuladas
```

## Modelo de dados

Os tipos internos usam unidades Celsius como fonte canônica. Valores ausentes são `null`; a UI decide a apresentação indicada na spec. Tipos de resposta do provedor devem permanecer privados ao service, separados do modelo de domínio.

```ts
export type Unit = 'celsius' | 'fahrenheit';

export interface City {
  id: number; // Identificador retornado pelo geocoding.
  name: string; // Nome localizado do município.
  country: string; // Nome do país.
  countryCode: string; // Código ISO 3166-1 alpha-2.
  adminRegion: string | null; // Região administrativa, quando disponível.
  latitude: number; // Latitude usada nas consultas meteorológicas.
  longitude: number; // Longitude usada nas consultas meteorológicas.
  timezone: string; // Fuso IANA usado para agrupar os dias locais.
}

export interface CurrentWeather {
  temperatureC: number | null; // temperature_2m solicitada em Celsius.
  weatherCode: number | null; // Código WMO weather_code retornado pela API.
  conditionPtBr: string | null; // Descrição pt-BR derivada do código WMO.
  referenceTime: string | null; // current.time no fuso local; não é observação de estação.
}

export interface ForecastDay {
  date: string; // Data local YYYY-MM-DD retornada para o fuso da cidade.
  temperatureMinC: number | null; // temperature_2m_min solicitada em Celsius.
  temperatureMaxC: number | null; // temperature_2m_max solicitada em Celsius.
  weatherCode: number | null; // Código WMO weather_code para o dia.
  conditionPtBr: string | null; // Descrição diária pt-BR derivada do código WMO.
}

export interface WeatherViewState {
  city: City; // Local selecionado pelo usuário.
  current: LoadState<CurrentWeather>; // Estado independente da estimativa atual.
  forecast: LoadState<[ForecastDay, ForecastDay, ForecastDay, ForecastDay, ForecastDay]>; // Hoje local e quatro dias seguintes.
}

export type SearchState =
  | { status: 'idle' | 'loading' }
  | { status: 'results'; items: City[] }
  | { status: 'empty' }
  | { status: 'error'; error: WeatherError };

export type WeatherErrorCode =
  | 'timeout'
  | 'network'
  | 'rate_limit'
  | 'http'
  | 'invalid_response';

export interface WeatherError {
  code: WeatherErrorCode;
  retryable: boolean;
}

export type LoadState<T> =
  | { status: 'idle' | 'loading' }
  | { status: 'success'; data: T }
  | { status: 'partial'; data: T }
  | { status: 'unavailable' }
  | { status: 'error'; error: WeatherError };
```

**Contrato de estado da consulta:** `WeatherViewState` compõe os estados independentes de clima atual e previsão; não é um modelo que presume que ambas as chamadas tiveram sucesso. As chamadas são paralelas e a falha de uma não apaga o sucesso da outra. Use `partial` quando houver dados utilizáveis junto de campos ou dias ausentes; use `unavailable` para clima atual sem temperatura e sem condição utilizáveis, sem apresentar o cartão como uma consulta válida. Cada campo de dado permanece nullable; um dia sem métricas continua representado pela data esperada para a UI exibir “Sem dados”/“Indisponível”. A unidade selecionada não é persistida e volta a Celsius ao recarregar a página.

**Conversão:** calcular Fahrenheit sempre a partir do valor Celsius original (`F = C × 9/5 + 32`); arredondar a uma casa decimal, empates para longe de zero, e omitir `.0`. Nunca converter valores já arredondados.

## Fluxo de dados

1. O usuário envia a busca. A UI remove espaços externos e valida 1–100 pontos de código Unicode; input vazio ou acima do limite não chama a API.
2. O hook marca busca como `loading` e chama geocoding uma vez por submissão, nunca a cada tecla.
3. O service converte cada resultado em `City`, preservando ID, nome, país, região, coordenadas e fuso. Lista vazia vira estado `empty`; falha HTTP/rede/timeout vira `error`.
4. Ao selecionar uma cidade, a UI inicia em paralelo uma solicitação de clima atual e outra de previsão diária. O hook associa ambas à seleção vigente e ignora respostas de seleções anteriores.
5. O service normaliza a resposta atual para `CurrentWeather` e a resposta diária para cinco `ForecastDay`, mapeando códigos meteorológicos para pt-BR. Cada chamada atualiza seu próprio estado; `WeatherViewState` compõe os estados sem exigir que ambas as chamadas terminem com sucesso.
6. A UI apresenta temperaturas em Celsius por padrão, os cinco dias e o horário de referência do modelo. `UnitToggle` deriva Fahrenheit dos valores Celsius sem nova chamada à API.
7. Loading, ausência de resultados, falhas, dados parciais e retry são apresentados conforme `specs/weather-app-spec.md`; não há cache nem atualização automática.

## APIs externas

### Geocodificação

- **URL:** `GET https://geocoding-api.open-meteo.com/v1/search?name=S%C3%A3o%20Paulo&language=pt&format=json`
- **Parâmetros usados:** `name` recebe a busca validada e sem espaços externos; `language=pt` solicita nomes em português; `format=json` define o formato da resposta. Não enviar `countryCode`: a busca é global dentro da cobertura da fonte. Código postal não é aceito.
- **Resposta resumida:**

```json
{
  "results": [
    {
      "id": 3448439,
      "name": "São Paulo",
      "latitude": -23.5475,
      "longitude": -46.63611,
      "country_code": "BR",
      "country": "Brasil",
      "admin1": "São Paulo",
      "timezone": "America/Sao_Paulo"
    }
  ]
}
```

- **Mapeamento para `City`:** `id` → `id`; `name` → `name`; `country` → `country`; `country_code` → `countryCode`; `admin1` → `adminRegion` (ou `null`); `latitude`/`longitude` → coordenadas; `timezone` → `timezone`. Exigir `id`, `name`, `country`, `country_code`, coordenadas numéricas válidas e `timezone` para um registro utilizável; `admin1` é opcional. Campos adicionais do provedor não entram no modelo de domínio. `results: []` representa lista vazia; `results` ausente ou com tipo inesperado é `invalid_response`, nunca estado vazio. Ignorar registros inválidos se houver outros válidos; se a lista não vazia não contiver nenhum registro utilizável, retornar `invalid_response`, não “nenhuma cidade encontrada”.
- **Uso:** uma chamada por submissão válida; não fazer autocomplete remoto por tecla.

### Previsão

- **Endpoint:** `GET https://api.open-meteo.com/v1/forecast`. Fazer duas chamadas por cidade selecionada para manter independentes os estados de erro de FR-02 e FR-03.
- **Parâmetros comuns:** `latitude` e `longitude` vêm do `City`; `temperature_unit=celsius` mantém Celsius como dado canônico; `timezone=<City.timezone>` alinha horários e limites diários ao local.

#### Clima atual

- **URL de exemplo:** `https://api.open-meteo.com/v1/forecast?latitude=-23.5475&longitude=-46.63611&current=temperature_2m%2Cweather_code&temperature_unit=celsius&timezone=America%2FSao_Paulo`
- **Parâmetros específicos:** `current=temperature_2m,weather_code` solicita temperatura e código meteorológico atuais.
- **Resposta resumida:**

```json
{
  "timezone": "America/Sao_Paulo",
  "utc_offset_seconds": -10800,
  "current_units": {
    "temperature_2m": "°C",
    "weather_code": "wmo code"
  },
  "current": {
    "time": "2026-10-26T11:00",
    "temperature_2m": 18.4,
    "weather_code": 3
  }
}
```

- **Mapeamento para `CurrentWeather`:** exigir que `current` seja um objeto; ausência ou tipo inesperado do objeto é `invalid_response`. `current.temperature_2m` → `temperatureC`; `current.weather_code` → `weatherCode`; descrição pt-BR obtida de `weatherCodes` → `conditionPtBr`; `current.time` → `referenceTime`. Campo de métrica ausente, nulo ou inválido vira `null` e pode resultar em `partial`; ausência de `current.time` é permitida e resulta em “Horário de referência indisponível”, sem inferir horário do dispositivo. `current.time` é referência dos valores do modelo, não observação de estação nem horário de ingestão.

#### Previsão diária

- **URL de exemplo:** `https://api.open-meteo.com/v1/forecast?latitude=-23.5475&longitude=-46.63611&daily=temperature_2m_min%2Ctemperature_2m_max%2Cweather_code&temperature_unit=celsius&timezone=America%2FSao_Paulo&forecast_days=5`
- **Parâmetros específicos:** `daily=temperature_2m_min,temperature_2m_max,weather_code` solicita mínima, máxima e código diário; `forecast_days=5` solicita hoje local mais quatro dias.
- **Resposta resumida:**

```json
{
  "timezone": "America/Sao_Paulo",
  "utc_offset_seconds": -10800,
  "daily_units": {
    "time": "iso8601",
    "temperature_2m_min": "°C",
    "temperature_2m_max": "°C",
    "weather_code": "wmo code"
  },
  "daily": {
    "time": ["2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30"],
    "temperature_2m_min": [15.1, 16.0, 17.2, 16.8, 15.9],
    "temperature_2m_max": [21.2, 22.4, 23.0, 20.8, 22.1],
    "weather_code": [3, 2, 0, 61, 3]
  }
}
```

- **Mapeamento para `ForecastDay`:** exigir `daily.time` como lista válida de cinco datas locais ISO em ordem cronológica e consecutiva; campo ausente, tipo inesperado, data inválida ou período que não corresponda a hoje local mais os quatro dias seguintes é `invalid_response`. Alinhar os arrays por índice `i`; `daily.time[i]` → `date`; `temperature_2m_min[i]`/`temperature_2m_max[i]` → `temperatureMinC`/`temperatureMaxC`; `weather_code[i]` → `weatherCode`; descrição via `weatherCodes` → `conditionPtBr`. Arrays de métricas ausentes, curtos ou com valores não numéricos/null produzem `null` nos índices sem valor e resultado `partial`; não deslocar valores entre dias. Um código meteorológico desconhecido permanece como código recebido, com descrição “Condição indisponível”.

- **Custo de chamadas:** uma consulta completa usa até três HTTP requests: um de geocoding e dois de meteorologia. Submeter busca somente sob ação explícita e não atualizar automaticamente para respeitar as cotas do endpoint gratuito.
- **Sem chave/atribuição:** uso somente não comercial, dentro das cotas e com atribuição CC BY 4.0 descritas em NFR-07. Erro `429` é distinto de resultado vazio; o endpoint gratuito não tem SLA.

## Gerenciamento de estado

- **Busca:** estado local do campo em `SearchBar`; `useWeather` mantém `SearchState`, cidade selecionada e token/controle da requisição ativa.
- **Dados meteorológicos:** manter `LoadState<CurrentWeather>` e `LoadState<[ForecastDay, ForecastDay, ForecastDay, ForecastDay, ForecastDay]>` independentes; current e daily são buscados em paralelo e podem terminar com resultados diferentes. A tela os compõe em `WeatherViewState`.
- **Unidade:** estado React em memória, inicializado em Celsius; não gravar em storage.
- **Concorrência:** cancelar chamadas obsoletas com `AbortController` quando possível e validar identidade da seleção antes de aplicar qualquer resposta, inclusive para geocoding.
- **Derivações:** valores Fahrenheit e rótulos formatados são derivados no render/formatters; não duplicar valores convertidos no estado.

## Tratamento de erros

- **Busca vazia:** “Digite o nome de uma cidade.”; sem chamada HTTP.
- **Mais de 100 pontos de código:** “Use até 100 caracteres.”; sem chamada HTTP.
- **Lista de geocoding vazia:** “Nenhuma cidade encontrada.”; manter campo editável e não consultar forecast.
- **Resposta inválida:** formato ou campos estruturais inválidos geram `invalid_response` e estado de erro; não são convertidos em lista vazia nem preenchidos com valores inventados.
- **HTTP/rede:** falha de rede gera `network`; resposta HTTP não bem-sucedida gera `http`, com `429` identificado como `rate_limit`. Usar `role="alert"` e as mensagens da spec: busca (“Não foi possível buscar cidades. Tente novamente.”), clima (“Não foi possível carregar o clima. Tente novamente.”) e previsão (“Não foi possível carregar a previsão. Tente novamente.”). Falha de current não impede exibição da previsão válida e vice-versa.
- **Timeout:** abortar cada chamada individual após 10 s, limpar seu estado de loading e oferecer retry manual. Na busca, exibir “A busca demorou mais que o esperado. Tente novamente.”; para clima e previsão, usar as mensagens específicas de falha acima. Timeout não dispara retry automático.
- **Retry:** cada ação repete somente a operação que falhou, com os mesmos parâmetros e sem refazer chamadas já concluídas com sucesso. Para busca, reutilizar a consulta normalizada; para clima ou previsão, reutilizar a cidade selecionada. Não realizar retry automático.
- **Dados parciais:** mostrar campos disponíveis; campos sem valor como “Indisponível”; dia sem previsão como “Sem dados”; não inferir nem copiar valores.
- **Clima sem campos utilizáveis:** quando temperatura e condição não estiverem disponíveis, usar estado `unavailable` e não renderizar o cartão como uma consulta válida.
- **Código desconhecido:** “Condição indisponível”; não exibir código bruto.
- **Respostas antigas:** descartar respostas de consultas que não correspondam à seleção atual.
- **Acessibilidade:** loading em `role="status"`; erros em `role="alert"`; mensagens e controles em pt-BR.
- **Sem dados obsoletos:** não manter cache meteorológico nem rotular timestamp de modelo como observação/atualização.

## Estratégia de testes

- **Unitários (Vitest):** validação/trim da busca; mapeamento de geocoding, current e forecast; timezone e cinco datas; conversões e casos de arredondamento (`20`, `20,24`, `20,25`, `-0,05`); mapeamento de códigos; normalização de respostas parciais e erros.
- **Services/hooks:** simular respostas válidas, vazias, incompletas, estruturalmente inválidas, `429`, erro HTTP, rede e timeout para cada chamada; verificar que `results: []` é vazio, mas `results` ausente/malformado é erro; arrays meteorológicos incompletos resultam em `partial`, enquanto ausência/malformação de `daily.time` é erro. Verificar sucesso independente (current falha/daily sucesso e vice-versa), retry restrito à operação falha, input inválido sem chamada e respostas antigas que não substituem a seleção vigente.
- **Componentes (Testing Library):** submissão, seleção de resultado, mensagens exatas, estados de loading/erro/vazio/sucesso/parcial/indisponível, `role="status"`/`role="alert"`, alternância de unidade sem novas chamadas e atribuição visível com links. Incluir valores externos semelhantes a HTML/script em cidade, país e região; verificar que aparecem literalmente como texto e não são interpretados nem executados.
- **E2E (Playwright):** usar `page.route` para respostas determinísticas, sem acessar Open-Meteo real. Cobrir fluxo de busca → seleção → clima/previsão → alternância e cenários sem resultados/falhas, retry e conteúdo externo exibido como texto.
- **Viewports:** verificar `320 × 568`, `375 × 667` e `1280 × 800`, além da ausência de overflow nas larguras da spec (`320`, `375`, `768`, `1024`, `1280`, `1920`).
- **Compatibilidade de navegadores:** manter uma execução rápida de PR em Chromium e mobile WebKit emulado; antes do release, executar a matriz completa nos três majors estáveis mais recentes de Chrome, Edge, Firefox e Safari desktop, Safari/iOS e Chrome/Android. O emulador mobile não substitui a verificação em Safari/iOS e Chrome/Android reais; registrar versões, sistema operacional e resultado. Separar essa matriz mais custosa da suíte rápida de cada PR.
- **Acessibilidade:** axe-core sem violações críticas/sérias e verificação manual por teclado para os fluxos principais, conforme NFR-03.
- **Desempenho:** medir p95 em pelo menos 100 execuções por fluxo com rede simulada de 10 Mbps, latência cliente até 100 ms e APIs mockadas respondendo em até 1 s; resultado alvo ≤3 s.
- **Disponibilidade:** a meta de 99,5% mensal é um SLI operacional, não um teste unitário/E2E. Antes da publicação, definir hospedagem, sonda externa a cada minuto, destino de métricas e responsável por revisar o resultado; medir shell HTTP 2xx e reportar a disponibilidade do Open-Meteo separadamente. Essa decisão operacional bloqueia a verificação da meta em produção, não a implementação local do cliente.
- **Rastreabilidade:** usar a matriz de `specs/weather-app-spec.md` para ligar US, FR, AC e NFR a testes e futuras tarefas.

## Riscos e trade-offs

- **Endpoint gratuito não comercial:** impede deploy operacional/comercial. Manter a demonstração dentro do escopo e cotas; uma mudança de uso exige reavaliar licença e API key.
- **Sem SLA/cotas:** o provedor pode retornar `429` ou indisponibilidade. Uma seleção gera até três requests; o app não faz autocomplete nem atualização automática, comunica erro por painel e permite retry manual.
- **Modelo, não observação:** condição atual é estimativa. Exibir horário de referência e não afirmar que é medição de estação ou atualização do modelo.
- **Sem cache/persistência:** simplifica privacidade e evita dados stale, mas cada consulta depende de rede e a unidade retorna a Celsius após recarregar.
- **Cobertura e resolução:** a busca é global dentro do geocoder; a disponibilidade/resolução meteorológica varia por região/modelo. Dados ausentes devem seguir os estados definidos, sem inventar valores.
- **Dependência de data/fuso:** delegar limites de dias ao timezone local informado pelo geocoder/forecast reduz erros de virada de dia; fixtures precisam fixar relógio e fuso.
- **Compatibilidade ampla:** três versões major recentes em quatro browsers e mobile elevam custo de CI; separar a matriz de release da execução rápida de cada PR sem tratar emulação mobile como cobertura real de plataforma.
- **Disponibilidade operacional:** a meta de NFR-05 não pode ser comprovada apenas pelo código ou testes locais. A escolha de hospedagem, sonda e responsável pela medição permanece pendente antes do release.
