# Especificação de Produto — Weather App

**Status:** Baseline definida para desenvolvimento e demonstração não comercial. Não autoriza uso operacional ou comercial; consulte **Out of Scope**.

## Overview

O Weather App permitirá que usuários pesquisem globalmente os locais disponíveis no serviço de geocodificação, consultem condições meteorológicas atuais e vejam a previsão para hoje e os quatro dias seguintes. O MVP será uma aplicação web responsiva para desktop e dispositivos móveis, em português do Brasil (pt-BR). Celsius será a unidade padrão, com opção para alternar a temperatura para Fahrenheit.

A fonte é a API gratuita do Open-Meteo, sem API key, sob licença de uso não comercial e dentro das cotas publicadas. As condições atuais são estimativas de modelos meteorológicos, não observações de estações; a interface apresenta o horário de referência informado pela API. A primeira versão não terá autenticação nem persistência no servidor ou no dispositivo. “Consulta rápida antes de sair” é a persona primária deste MVP; as demais personas são secundárias.

## Functional Requirements

- **FR-01 — Buscar cidade:** permitir que o usuário pesquise pelo nome de uma cidade dentro da cobertura da fonte, após remover espaços no início e no fim, com entrada de 1 a 100 pontos de código Unicode. Exibir resultados com cidade, país e região administrativa quando disponível, e permitir a seleção do local. Código postal não é aceito.
- **FR-02 — Consultar clima atual:** exibir para a cidade selecionada sua temperatura, em Celsius por padrão, a condição meteorológica em pt-BR e o horário de referência dos dados no fuso local quando fornecido pela fonte. Os valores são estimativas de modelo, não observações locais.
- **FR-03 — Consultar previsão de cinco dias:** exibir, no fuso horário da cidade selecionada, hoje local e os quatro dias locais seguintes, em ordem cronológica, com data, temperaturas mínima/máxima e condição diária em pt-BR.
- **FR-04 — Alternar unidade de temperatura:** exibir todas as temperaturas em Celsius por padrão e permitir alternar entre Celsius e Fahrenheit sem alterar os dados de origem.
- **FR-05 — Usar as funções principais na web responsiva:** permitir busca, seleção de cidade e consulta do clima atual e da previsão em navegadores de desktop e dispositivos móveis, sem exigir instalação.

## User Stories

- **US-01 (FR-01):** Como **Consulta rápida antes de sair**, quero buscar minha cidade para encontrar o local cujas condições preciso consultar.
- **US-02 (FR-02):** Como **Consulta rápida antes de sair**, quero ver as condições meteorológicas atuais da cidade selecionada para decidir o que vestir ou levar.
- **US-03 (FR-03):** Como **Planejamento de atividades**, quero comparar a previsão de hoje e dos quatro dias seguintes para escolher quando realizar uma atividade.
- **US-04 (FR-04):** Como **Consulta em cidade desconhecida**, quero alternar entre Celsius e Fahrenheit para interpretar a temperatura na unidade que prefiro.
- **US-05 (FR-05):** Como **Consulta em cidade desconhecida**, quero pesquisar uma cidade e consultar o clima pelo navegador em desktop ou celular para planejar a viagem ou ajustar meus planos em deslocamento.

As personas e contextos acima são hipóteses de discovery, não segmentos validados por pesquisa.

## Acceptance Criteria

- **AC-FR-01 — FR-01 / US-01 e US-05 — Busca:**
  - **Given** a busca aberta e um campo vazio ou contendo apenas espaços, **When** o usuário envia o formulário, **Then** o app exibe “Digite o nome de uma cidade.”, mantém o foco no campo e não chama a API de geocodificação.
  - **Given** um campo com mais de 100 pontos de código Unicode, **When** o usuário tenta enviar a busca, **Then** o app exibe “Use até 100 caracteres.” e não chama a API de geocodificação.
  - **Given** um campo com exatamente 100 pontos de código Unicode, **When** o usuário envia a busca, **Then** o app aceita a entrada e envia os 100 pontos de código após remover espaços externos.
  - **Given** um campo com espaços antes e depois do nome `São Paulo`, **When** o usuário envia a busca, **Then** o app envia `São Paulo` sem os espaços externos e preserva os caracteres Unicode.
  - **Given** uma resposta controlada da API com uma cidade correspondente à consulta `São Paulo`, **When** o usuário envia essa consulta, **Then** o app preserva os caracteres Unicode na solicitação e exibe o nome da cidade, país, região administrativa quando disponível e uma opção selecionável.
  - **Given** uma resposta controlada com cidade, país e região administrativa, **When** os resultados são exibidos, **Then** os três valores aparecem como texto e não são interpretados como marcação ou script.
  - **Given** uma resposta controlada de geocodificação com lista vazia, **When** o usuário envia uma consulta válida, **Then** o app exibe “Nenhuma cidade encontrada.”, mantém o campo editável e não solicita dados meteorológicos.
  - **Given** uma busca anterior ainda pendente e uma consulta mais recente enviada, **When** a consulta mais recente termina antes da anterior, **Then** os resultados da consulta mais recente permanecem visíveis e a resposta tardia não os substitui.
  - **Given** uma consulta válida enviada e a API de geocodificação ainda pendente, **When** o app aguarda a resposta, **Then** apresenta “Buscando cidades…” em um elemento `role="status"` e impede envios duplicados.
  - **Given** dois resultados com o mesmo nome de cidade e países ou regiões diferentes, **When** os resultados são exibidos, **Then** os campos de país e região disponíveis permitem distingui-los antes da seleção.
  - **Given** resultados de geocodificação exibidos, **When** o usuário seleciona um resultado, **Then** o app usa as coordenadas desse resultado para solicitar os dados meteorológicos e identifica a consulta com o local selecionado.
  - **Given** uma requisição de busca que não recebeu resposta após 10 segundos, **When** o limite de tempo é atingido, **Then** o app encerra o estado de carregamento, exibe “A busca demorou mais que o esperado. Tente novamente.” e oferece uma ação de nova tentativa.
  - **Given** a API de geocodificação retorna erro HTTP (incluindo `429`) ou falha de rede, **When** a busca termina, **Then** o app exibe “Não foi possível buscar cidades. Tente novamente.” em um elemento `role="alert"` e não mostra a falha como uma lista vazia.
- **AC-FR-02 — FR-02 / US-02 — Clima atual:**
  - **Given** uma cidade selecionada e uma resposta controlada válida para suas coordenadas, **When** o carregamento termina, **Then** o app exibe o nome do local selecionado, a temperatura em Celsius e a descrição da condição em pt-BR correspondente ao código meteorológico retornado.
  - **Given** uma requisição de clima atual pendente para a cidade selecionada, **When** o app aguarda a resposta, **Then** apresenta “Carregando clima…” em um elemento `role="status"`.
  - **Given** uma resposta atual com `current.time` igual a `2026-10-26T11:00` no fuso `America/Sao_Paulo`, **When** o clima é exibido, **Then** o app mostra “Estimativa do modelo para 11:00” e não a rotula como observação ou atualização.
  - **Given** uma resposta atual sem `current.time`, **When** o clima é exibido, **Then** o horário aparece como “Horário de referência indisponível” e não é substituído pelo horário atual do dispositivo.
  - **Given** uma resposta atual com código meteorológico `0`, **When** o clima é exibido em pt-BR, **Then** a condição aparece como “Céu limpo”.
  - **Given** um código meteorológico sem mapeamento, **When** o clima atual é exibido, **Then** o app mostra “Condição indisponível” em vez de omitir a condição ou exibir um código bruto.
  - **Given** uma requisição de clima atual para uma cidade A ainda pendente, **When** o usuário seleciona a cidade B e a resposta de B chega antes da resposta de A, **Then** o app exibe B e ignora a resposta tardia de A.
  - **Given** uma resposta parcial de clima atual com temperatura ou condição ausente, **When** o carregamento termina, **Then** o app exibe os campos válidos e mostra “Indisponível” no campo ausente; não infere nem copia valores.
  - **Given** uma resposta sem temperatura e sem descrição da condição, **When** o carregamento termina, **Then** o app exibe o estado de indisponibilidade e não apresenta o cartão como uma consulta válida.
  - **Given** a API meteorológica retorna erro HTTP (incluindo `429`), falha de rede ou não responde após 10 segundos, **When** a consulta termina, **Then** o app exibe “Não foi possível carregar o clima. Tente novamente.” em um elemento `role="alert"`, oferece nova tentativa e não apresenta dados antigos como atuais.
- **AC-FR-03 — FR-03 / US-03 — Previsão:**
  - **Given** o relógio de teste fixado em `2026-10-27T02:00:00Z`, uma cidade cujo fuso de teste é `UTC-03:00` e uma resposta diária controlada, **When** a previsão é carregada, **Then** o app usa a data local da cidade (`2026-10-26`) e exibe `26/10/2026`, `27/10/2026`, `28/10/2026`, `29/10/2026` e `30/10/2026`, em ordem cronológica.
  - **Given** uma requisição de previsão pendente para a cidade selecionada, **When** o app aguarda a resposta, **Then** apresenta “Carregando previsão…” em um elemento `role="status"`.
  - **Given** cinco previsões diárias válidas para a cidade selecionada, **When** a previsão é exibida, **Then** cada dia mostra sua data local em `dd/MM/yyyy`, temperaturas mínima e máxima em Celsius e a descrição da condição em pt-BR.
  - **Given** uma resposta diária sem dados para uma ou mais das cinco datas, **When** a previsão é exibida, **Then** cada data ausente aparece como “Sem dados” e nenhum valor de outro dia é reutilizado.
  - **Given** um dia com código meteorológico `0`, **When** a previsão é exibida em pt-BR, **Then** a condição aparece como “Céu limpo”.
  - **Given** um dia com uma métrica de previsão ausente ou um código meteorológico sem mapeamento, **When** a previsão é exibida, **Then** a métrica aparece como “Indisponível” e a condição como “Condição indisponível”, sem exibir código bruto ou valor inferido.
  - **Given** uma previsão pendente para a cidade A, **When** o usuário seleciona a cidade B, recebe a previsão de B e depois chega a resposta tardia de A, **Then** a previsão de B permanece visível e os dados de A são ignorados.
  - **Given** a API de previsão retorna erro HTTP (incluindo `429`), falha de rede ou não responde após 10 segundos, **When** a consulta termina, **Then** o app exibe “Não foi possível carregar a previsão. Tente novamente.” em um elemento `role="alert"`, oferece nova tentativa e não apresenta dados antigos como atuais.
- **AC-FR-04 — FR-04 / US-04 — Unidade:**
  - **Given** uma consulta carregada com temperaturas em Celsius, **When** o usuário abre a consulta sem alterar a unidade, **Then** todas as temperaturas atuais e diárias são exibidas em Celsius.
  - **Given** uma temperatura de `20 °C` exibida, **When** o usuário seleciona Fahrenheit, **Then** ela passa a ser exibida como `68 °F` e a cidade, o período e os dados meteorológicos de origem permanecem iguais.
  - **Given** temperaturas exibidas em Fahrenheit, **When** o usuário seleciona Celsius, **Then** as temperaturas voltam aos valores Celsius originais, sem conversão cumulativa.
  - **Given** temperaturas de origem de `20 °C`, `20,24 °C`, `20,25 °C` e `-0,05 °C`, **When** são exibidas em Celsius, **Then** o app mostra `20 °C`, `20,2 °C`, `20,3 °C` e `-0,1 °C`, respectivamente. Empates são arredondados para longe de zero; a conversão usa `°F = (°C × 9/5) + 32`, o valor original e arredonda somente ao final.
- **AC-FR-05 — FR-05 / US-05 — Web responsiva:**
  - **Given** a aplicação aberta em um viewport de `320 × 568` CSS pixels e respostas controladas válidas, **When** o usuário pesquisa e seleciona uma cidade, **Then** consegue consultar clima atual, previsão e alternar a unidade.
  - **Given** a aplicação aberta em um viewport de `1280 × 800` CSS pixels e respostas controladas válidas, **When** o usuário pesquisa e seleciona uma cidade, **Then** consegue consultar clima atual, previsão e alternar a unidade.
  - **Given** a aplicação renderizada nas larguras de `320`, `375`, `768`, `1024`, `1280` e `1920` CSS pixels, **When** o conteúdo principal é exibido, **Then** `document.documentElement.scrollWidth` não excede `document.documentElement.clientWidth` em nenhuma largura testada.
  - **Given** qualquer um dos viewports de referência, **When** o usuário opera busca, seleção e unidade, **Then** nenhuma ação depende de hover e todos os controles são alcançáveis por teclado.
- **AC-NFR-07 — Atribuição da fonte:**
  - **Given** o app exibe dados meteorológicos, **When** a página é renderizada, **Then** há atribuição visível “Dados meteorológicos: Open-Meteo (CC BY 4.0)” com links para `https://open-meteo.com/` e `https://creativecommons.org/licenses/by/4.0/`, além da indicação “Descrições e unidades foram traduzidas/convertidas.”

## Non-Functional Requirements

- **NFR-01 — Idioma e localidade:** toda a interface e mensagens devem estar em pt-BR; datas usam `dd/MM/yyyy`, horas `HH:mm` (24 horas), separador decimal vírgula e temperaturas arredondadas para uma casa decimal pela regra half-up, sem zero decimal desnecessário.
- **NFR-02 — Responsividade e compatibilidade:** os fluxos principais devem funcionar entre 320 e 1920 CSS pixels de largura. Suporte no desktop: três versões major estáveis mais recentes de Chrome, Edge, Firefox e Safari no lançamento. Em mobile: Safari nas três versões major mais recentes do iOS e Chrome nas três versões major mais recentes do Android. Viewports de referência: `320 × 568`, `375 × 667` e `1280 × 800` CSS pixels.
- **NFR-03 — Acessibilidade:** atender WCAG 2.2 nível AA nos fluxos principais. A verificação inclui zero violações críticas ou sérias no axe-core e execução manual, por teclado, dos fluxos de busca, seleção, consulta e alternância de unidade.
- **NFR-04 — Desempenho:** em teste com rede de 10 Mbps, latência cliente de até 100 ms e APIs controladas respondendo em até 1 s, o percentil 95 entre enviar busca/consulta e renderizar o resultado deve ser de até 3 s, medido em pelo menos 100 execuções por fluxo.
- **NFR-05 — Disponibilidade e resiliência:** pelo menos 99,5% das verificações feitas a cada minuto em cada mês-calendário devem obter HTTP 2xx da aplicação e carregar o shell da interface; disponibilidade do provedor externo é medida separadamente. Cada chamada externa expira após 10 s, sem retry automático; a interface oferece nova tentativa manual. Não há cache de dados meteorológicos no MVP.
- **NFR-06 — Privacidade e escopo de dados:** não deve haver autenticação, geolocalização nem persistência de dados do usuário no servidor ou no dispositivo nesta versão.
- **NFR-07 — Fonte, licença e atribuição:** o endpoint gratuito do Open-Meteo sem API key só pode ser usado para fins não comerciais. Respeitar as cotas publicadas de 10.000 chamadas/dia, 5.000/hora, 600/minuto e 300.000/mês por IP/aplicação; não há garantia de disponibilidade do endpoint gratuito. Exibir atribuição visível e link para Open-Meteo e CC BY 4.0, indicando que descrições e unidades foram traduzidas/convertidas. Consultar [termos](https://open-meteo.com/en/terms) e [planos e limites](https://open-meteo.com/en/pricing) antes de qualquer mudança de uso.
- **NFR-08 — Semântica e frescor da fonte:** condições atuais são valores de modelos com dados em resolução de 15 minutos; a cadência de ingestão depende do modelo. Exibir `current.time` como horário de referência local, nunca como horário de observação ou de atualização do modelo. Não prometer frescor ou disponibilidade além do informado pela fonte; não armazenar cache meteorológico.
- **NFR-09 — Mapeamento de condições:** mapear códigos meteorológicos retornados para descrições em pt-BR tanto no clima atual quanto na previsão; código sem mapeamento deve aparecer como “Condição indisponível”.
- **NFR-10 — Tratamento de entrada:** valores vindos de busca ou de respostas externas devem ser exibidos como texto, sem executar ou interpretar marcação ou scripts.

## Traceability Matrix

| User Story | Requisitos funcionais | Critérios de aceite | NFRs relevantes |
|---|---|---|---|
| **US-01 — Buscar cidade para consultar condições** | FR-01 | AC-FR-01: validação e normalização da entrada, resultados, seleção, ausência de resultados, duplicatas, carregamento, timeout e erro da API. | NFR-01 (pt-BR); NFR-02 (compatibilidade responsiva); NFR-03 (acessibilidade); NFR-04 (desempenho); NFR-05 (resiliência); NFR-07 (fonte e cotas); NFR-10 (entrada segura). |
| **US-02 — Consultar clima atual** | FR-02 | AC-FR-02: dados atuais e referência temporal, mapeamento da condição, resposta parcial, seleção concorrente e falha da API; AC-NFR-07: crédito da fonte e licença. | NFR-01 (formato local); NFR-03 (acessibilidade); NFR-04 (desempenho); NFR-05 (resiliência); NFR-07 (fonte e cotas); NFR-08 (semântica/frescor); NFR-09 (mapeamento). |
| **US-03 — Comparar a previsão de cinco dias** | FR-03 | AC-FR-03: cinco datas locais, conteúdo diário, dados ausentes, códigos sem mapeamento e resposta fora de ordem; AC-NFR-07: crédito da fonte e licença. | NFR-01 (datas e unidades); NFR-02 (compatibilidade responsiva); NFR-03 (acessibilidade); NFR-04 (desempenho); NFR-05 (resiliência); NFR-07 (fonte e cotas); NFR-08 (frescor); NFR-09 (mapeamento). |
| **US-04 — Alternar Celsius/Fahrenheit** | FR-04 | AC-FR-04: unidade padrão, conversão nos dois sentidos e regra de arredondamento; AC-NFR-07: crédito da fonte permanece visível com os dados. | NFR-01 (formato e arredondamento); NFR-02 (controle nos viewports suportados); NFR-03 (uso acessível); NFR-06 (sem persistência de preferência); NFR-07 (atribuição). |
| **US-05 — Pesquisar e consultar em desktop ou celular** | FR-01, FR-05 | AC-FR-01: busca e seleção; AC-FR-05: fluxos e ausência de overflow na grade de viewports; AC-NFR-07: crédito da fonte e licença. | NFR-01 (pt-BR); NFR-02 (responsividade/compatibilidade); NFR-03 (acessibilidade); NFR-04 (desempenho); NFR-05 (resiliência); NFR-07 (fonte e cotas); NFR-10 (entrada segura). |

## Edge Cases

- **Busca inválida ou sem resultados:** input vazio, só espaços, mais de 100 pontos de código, Unicode/acentos e lista vazia seguem os resultados definidos em FR-01; erro da API não pode ser tratado como lista vazia.
- **Falha ou timeout externo:** erro HTTP, `429`, falha de rede ou timeout após 10 s deve encerrar loading e permitir retry manual, sem retry automático ou exibição de dados antigos como atuais.
- **Resposta parcial ou código desconhecido:** exibir somente valores recebidos, usar os estados “Indisponível”, “Sem dados” e “Condição indisponível” conforme FR-02/FR-03; nunca inferir valores ou exibir código bruto.
- **Respostas fora de ordem:** uma resposta pertencente a uma seleção anterior não pode substituir dados da cidade ativa.
- **Virada de data ou horário sazonal:** o período é calculado no fuso da cidade selecionada e deve conter exatamente cinco datas locais consecutivas.
- **Conversões repetidas:** recalcular a partir dos valores de origem e aplicar uma única regra de conversão e arredondamento.
- **Larguras suportadas:** verificar os viewports definidos em NFR-02; fora dessa faixa, o produto não garante suporte.

## Assumptions

- A aplicação atende buscas por nome de cidade dentro da cobertura do Open-Meteo; não promete cobertura de toda cidade do mundo. Código postal não é aceito.
- A consulta parte de busca explícita; localização automática e armazenamento local ou remoto de preferências não fazem parte desta versão.
- A previsão é agrupada pelo fuso local retornado para a cidade selecionada.
- O formato de entrega é web responsiva no navegador; não haverá PWA instalável nem aplicativo nativo.
- O conteúdo mínimo de clima atual é temperatura e condição; o resumo diário inclui data, temperaturas mínima/máxima e condição. Vento, precipitação e outros indicadores não fazem parte do MVP.
- “Consulta rápida antes de sair” é a persona prioritária deste MVP; as outras personas são secundárias. A priorização é uma decisão de escopo, não uma afirmação de pesquisa validada.
- As metas NFR-02 a NFR-05 são os critérios de lançamento adotados para este MVP.
- O uso do endpoint gratuito Open-Meteo é não comercial e limitado às cotas e condições descritas em NFR-07; operação comercial ou empresarial não está autorizada por esta especificação.
- O horário de `current.time` representa a referência temporal dos valores do modelo, não uma observação de estação nem o horário de ingestão do modelo.

## Risks

| Risco | Impacto potencial | Mitigação proposta |
|---|---|---|
| O endpoint gratuito é usado para fins comerciais ou excede as cotas publicadas. | Suspensão/limitação do serviço ou uso incompatível com os termos. | Restringir o MVP a demonstração não comercial; respeitar as cotas; exigir nova decisão e plano comercial com chave antes de qualquer uso comercial/operacional. |
| Cidades homônimas levam a seleção incorreta. | O usuário recebe previsão para o local errado e perde confiança. | Exibir nome da cidade, país e região administrativa quando disponível; cobrir duplicatas nos testes. |
| Fuso horário da cidade é aplicado incorretamente. | A previsão pode aparecer em datas erradas. | Agrupar pelo fuso local da cidade selecionada e testar a virada de dia com relógio e fuso controlados. |
| Falha externa ou dados parciais são interpretados como previsão válida. | Usuários podem tomar decisões com informação inexistente ou desatualizada. | Não armazenar cache nesta versão; aplicar timeout de 10 s, permitir retry manual e exibir estados de erro/indisponibilidade para dados ausentes. |
| As metas NFR adotadas não representam a expectativa das partes interessadas. | Retrabalho em testes, infraestrutura ou critérios de lançamento. | Tratar os valores desta spec como baseline do MVP; mudanças exigem aprovação e atualização dos critérios de aceite. |
| Funcionalidades opcionais são adicionadas ao MVP sem avaliação de impacto. | Retrabalho de produto, arquitetura e testes. | Manter alertas, qualidade do ar, favoritos, histórico e geolocalização fora do MVP; exigir aprovação de mudança de escopo para incluí-los. |

## Out of Scope

- Autenticação, contas de usuário e persistência de dados do usuário no servidor.
- Geolocalização automática; a consulta parte de uma busca explícita de cidade.
- Alertas meteorológicos, qualidade do ar, locais favoritos e histórico de consultas não fazem parte do MVP.
- Aplicativos nativos e PWA instalável; a entrega do MVP é uma aplicação web responsiva acessada pelo navegador.
- Persistência local de preferências; a unidade não será lembrada entre sessões nesta versão.
- Métricas meteorológicas além de temperatura e descrição da condição atual, e data/mínima/máxima/condição diária, incluindo vento e precipitação.
- Uso como serviço de alerta ou fonte para decisões de emergência; o app é informativo e não substitui orientações oficiais.
- Uso comercial ou operacional do endpoint gratuito Open-Meteo sem API key. Os termos vigentes restringem o endpoint gratuito a uso não comercial; qualquer uso comercial exige contratação e nova decisão sobre a API key.

## Open Questions

Não há pendências bloqueantes para desenvolver e demonstrar o MVP **não comercial**, dentro das cotas do endpoint gratuito, com as metas NFR e o escopo definidos nesta spec. Uso comercial ou operacional exige revisão de escopo, licença/plano e autenticação da API antes de ser habilitado.
