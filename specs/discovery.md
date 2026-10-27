# Análise de Discovery — Weather App

## Contexto

A empresa precisa de uma aplicação de previsão do tempo para que usuários consultem informações meteorológicas de cidades. O briefing identifica quatro capacidades centrais: buscar cidades, consultar o clima atual, visualizar a previsão para cinco dias e alternar a unidade de temperatura entre Celsius e Fahrenheit. A aplicação também deve poder ser usada em dispositivos móveis.

O público-alvo, as plataformas suportadas e os critérios de qualidade ainda não foram definidos. Esta análise registra o entendimento inicial, as decisões já tomadas e os pontos que precisam ser confirmados antes da especificação detalhada.

## Decisões

| Decisão | Justificativa | Perguntas em aberto que resolve |
|---|---|---|
| Usar Open-Meteo como fonte de dados, sem API key. | Evita exigir uma chave de API para a integração inicial. | Define o provedor e resolve se a integração depende de uma API key. Cobertura, limites de uso, atribuição e disponibilidade ainda precisam ser avaliados. |
| Interpretar “5 dias” como hoje mais os quatro dias seguintes. | Estabelece um período de previsão claro e alinhado à decisão do produto. | Resolve se o período inclui o dia atual ou representa cinco dias futuros. O nível de detalhe por dia continua em aberto. |
| Usar Celsius como unidade padrão. | Define uma apresentação inicial consistente para o público da interface em pt-BR. | Resolve qual unidade deve aparecer por padrão. O usuário ainda poderá alternar para Fahrenheit; as unidades de outras métricas continuam em aberto. |
| Não oferecer autenticação nem persistência de dados no servidor. | Mantém a primeira versão sem contas de usuário e reduz dados e infraestrutura necessários. | Resolve se haverá login e armazenamento de dados do usuário no servidor. Persistência local de preferências no dispositivo ainda não foi decidida. |
| Oferecer a interface em português do Brasil (pt-BR). | Define o idioma inicial da experiência. | Resolve qual idioma a interface deve usar. Formatos específicos de data, hora e números ainda precisam ser confirmados. |

## Personas Hipotéticas

As personas abaixo são hipóteses baseadas somente no briefing; devem ser validadas com usuários antes de orientar decisões definitivas de produto.

### 1. Consulta rápida antes de sair

- **Objetivo principal:** entender as condições atuais e próximas para decidir o que vestir ou levar.
- **Contexto de uso:** principalmente mobile, em uma consulta breve antes de sair ou durante o deslocamento.
- **Métrica de sucesso para a persona:** consegue encontrar o clima da cidade desejada e tomar sua decisão em uma única consulta, sem confundir a condição atual com a previsão.

### 2. Planejamento de atividades

- **Objetivo principal:** escolher um dia adequado para atividades nos próximos cinco dias.
- **Contexto de uso:** principalmente desktop para comparar os dias com calma; pode voltar ao mobile para conferir a previsão fora de casa.
- **Métrica de sucesso para a persona:** consegue identificar e comparar as condições dos cinco dias e selecionar um dia para a atividade sem precisar recorrer a outra fonte para interpretar a apresentação.

### 3. Consulta em cidade desconhecida

- **Objetivo principal:** localizar a cidade correta e entender a previsão usando a unidade de temperatura de sua preferência.
- **Contexto de uso:** principalmente mobile durante uma viagem; pode pesquisar e planejar no desktop antes de viajar.
- **Métrica de sucesso para a persona:** seleciona a localidade correta entre resultados semelhantes e interpreta a temperatura na unidade desejada sem ambiguidade.

## Requisitos Funcionais

- **RF-01 — Buscar cidade:** o usuário deve poder pesquisar uma cidade pelo nome e selecionar o local desejado para consultar o clima.
- **RF-02 — Consultar clima atual:** após selecionar uma cidade, a aplicação deve exibir as condições meteorológicas atuais para esse local.
- **RF-03 — Consultar previsão:** a aplicação deve exibir a previsão do tempo para hoje e os quatro dias seguintes.
- **RF-04 — Alternar unidade:** o usuário deve poder alternar a exibição da temperatura entre Celsius (padrão) e Fahrenheit.
- **RF-05 — Usar em dispositivos móveis:** as funcionalidades de busca e consulta devem estar disponíveis em dispositivos móveis.

## Requisitos Não-Funcionais

- **RNF-01 — Responsividade:** a interface deve se adaptar a telas móveis e permitir o uso das funcionalidades principais nelas.
- **RNF-02 — Usabilidade:** busca, seleção de cidade, consulta e troca de unidade devem ser compreensíveis e operáveis em telas pequenas.
- **RNF-03 — Desempenho:** os tempos aceitáveis para buscar cidades e carregar dados meteorológicos precisam ser definidos com as partes interessadas.
- **RNF-04 — Disponibilidade e resiliência:** o comportamento esperado diante de falhas de rede ou indisponibilidade da fonte de dados precisa ser definido.
- **RNF-05 — Acessibilidade:** os requisitos de acessibilidade, incluindo navegação por teclado e suporte a tecnologias assistivas, precisam ser confirmados.

## Riscos

As probabilidades abaixo são avaliações iniciais, a confirmar após validar público, cobertura do provedor e metas operacionais.

| Risco | Tipo | Probabilidade | Impacto | Mitigação |
|---|---|---|---|---|
| Indisponibilidade, latência, limites de uso ou cobertura insuficiente do provedor meteorológico | Técnico | Média | Alto: busca ou previsão pode falhar para usuários ou regiões inteiras | Validar cobertura, SLA, limites, atribuição e custos do Open-Meteo antes da integração; definir timeout, tratamento de erro, monitoramento e estratégia de contingência compatível com os termos de uso. |
| Dados desatualizados ou com qualidade insuficiente para representar o clima atual | Técnico / Produto | Média | Alto: usuários podem tomar decisões com informação incorreta ou antiga | Definir frescor máximo aceitável; exibir horário da atualização; validar a qualidade e cobertura dos dados nas regiões suportadas; identificar claramente dados em cache ou indisponíveis. |
| Cidades homônimas ou resultados de busca ambíguos | Produto / Técnico | Média | Médio: o usuário pode consultar a localidade errada e perder confiança no app | Exibir identificadores como região e país; definir regras de correspondência; testar nomes duplicados, acentos e variantes. |
| Agrupamento incorreto dos cinco dias por fuso horário ou limite de data | Técnico | Média | Médio: datas exibidas podem não corresponder ao dia local esperado | Aplicar consistentemente a janela definida (hoje mais quatro dias) e confirmar o fuso horário usado para determinar “hoje”; cobrir limites de dia e fuso nos testes. |
| Experiência ruim em dispositivos móveis ou redes lentas | Técnico / Produto | Média | Alto: busca e consulta podem ficar lentas, difíceis de usar ou indisponíveis no principal contexto de acesso | Definir dispositivos, larguras de tela e condições de rede suportados; testar em telas pequenas; otimizar carregamento e apresentar estados de espera, erro e recuperação. |
| Unidades inconsistentes ou conversões incorretas | Técnico / Produto | Média | Médio: valores podem ser mal interpretados, comprometendo a confiança nas informações | Definir unidade padrão e escopo da alternância; converter valores sem arredondamento cumulativo; testar Celsius/Fahrenheit e explicitar unidades junto aos valores. |
| Expectativas de produto não cobertas, como alertas severos, favoritos ou qualidade do ar | Produto | Alta | Médio: usuários podem considerar o produto incompleto ou o escopo pode crescer durante a implementação | Confirmar público e objetivos; decidir explicitamente o que entra e o que fica fora da primeira versão; registrar decisões e critérios de aceite na spec. |
| Coleta de localização ou histórico sem expectativa clara de consentimento e retenção | Produto / Técnico | Média | Alto: perda de confiança e possível descumprimento de obrigações de privacidade | Minimizar dados coletados; solicitar permissão quando necessário; oferecer busca manual; definir finalidade, retenção e consentimento antes de implementar localização ou histórico. |
| Incompatibilidade com navegadores, tecnologias assistivas ou requisitos de acessibilidade | Técnico / Produto | Média | Alto: parte dos usuários pode não conseguir buscar ou consultar a previsão | Definir matriz de suporte e critérios de acessibilidade; testar teclado, leitor de tela, contraste, foco e tamanhos de tela nos navegadores-alvo. |

## Perguntas em Aberto

- **Público e contexto:** Quem são os usuários-alvo e em que situações consultarão o app? **Impacto:** sem isso, prioridades de conteúdo, linguagem e experiência podem não atender ao público real.
- **Escopo do produto:** O app se limita a clima atual e previsão, ou também deve oferecer alertas severos, qualidade do ar, locais favoritos ou histórico? **Impacto:** funcionalidades implícitas podem ser omitidas ou adicionadas sem validação, alterando esforço e expectativas.
- **Formato de entrega:** “Usar em dispositivos móveis” significa um site responsivo, um app instalável (PWA) ou aplicativos nativos? **Impacto:** muda arquitetura, distribuição, permissões e esforço de desenvolvimento.
- **Escopo geográfico e da busca:** Em quais países/regiões o serviço deve funcionar, e a busca aceitará apenas nomes de cidades ou também país, estado, região e código postal? **Impacto:** afeta cobertura de dados, localização, normalização e qualidade dos resultados.
- **Correspondência de cidades:** Como a busca deve tratar nomes iguais, variantes, acentos e nomes em outros idiomas; quais dados devem identificar cada resultado? **Impacto:** sem desambiguação, o usuário pode consultar a cidade errada.
- **Geolocalização:** A aplicação deve oferecer localização automática, pedir permissão e permitir busca manual como alternativa? **Impacto:** influencia privacidade, permissões e fluxo inicial; sem fallback, usuários que negarem acesso podem ficar bloqueados.
- **Fonte e direitos dos dados:** Quais limites de cobertura, atualização, uso, atribuição, custo e disponibilidade do Open-Meteo se aplicam? **Impacto:** a solução pode exceder limites ou não entregar dados confiáveis para as regiões-alvo.
- **Definição de clima atual:** Quais variáveis devem ser exibidas (por exemplo, temperatura, sensação térmica, condição, umidade e vento) e o que “atual” significa em relação ao horário de observação? **Impacto:** sem contrato de conteúdo e horário, implementação, interface e expectativa de precisão ficam indefinidas.
- **Detalhe da previsão:** Cada dia terá um resumo ou valores por período, e quais métricas (mínima/máxima, precipitação, vento etc.) são necessárias? **Impacto:** afeta escolha do provedor, modelo de dados, layout e volume de informação.
- **Atualização e validade:** Com que frequência os dados devem ser atualizados e qual idade máxima ainda pode ser apresentada como válida? Deve-se mostrar horário da última atualização? **Impacto:** sem isso, usuários podem interpretar dados antigos como atuais.
- **Fuso horário e datas:** Datas e horários devem seguir o fuso local da cidade, o fuso do usuário ou ambos? **Impacto:** agrupamento diário incorreto pode deslocar a previsão para o dia errado.
- **Unidades:** A alternância entre Celsius e Fahrenheit afeta somente a temperatura? Quais unidades serão usadas para vento, precipitação e distância? Celsius já foi definido como padrão. **Impacto:** unidades inconsistentes podem confundir comparações e induzir interpretações erradas.
- **Persistência local de preferências:** Cidade selecionada e unidade devem ser lembradas no dispositivo entre visitas ou sessões? Persistência no servidor está fora do escopo. **Impacto:** sem decisão, a experiência pode perder contexto a cada retorno ou armazenar dados localmente sem necessidade.
- **Erros e resultados vazios:** Qual comportamento é esperado para busca sem resultados, entrada inválida, timeout, limite excedido e erro do provedor? **Impacto:** sem fluxos definidos, falhas podem parecer travamentos e impedir recuperação pelo usuário.
- **Uso sem conexão e cache:** O app deve mostrar dados em cache durante uma falha de rede? Por quanto tempo e com qual indicação de desatualização? **Impacto:** sem política explícita, o app pode ficar inutilizável offline ou apresentar informação velha como confiável.
- **Convenções regionais:** A interface será em pt-BR; quais formatos de data/hora, números e nomes meteorológicos devem ser usados? **Impacto:** valores podem aparecer em formato inesperado ou difícil de interpretar.
- **Compatibilidade:** Quais navegadores, versões, sistemas operacionais, larguras de tela e orientações devem ser suportados? **Impacto:** “dispositivo móvel” não define uma matriz testável e funcionalidades podem falhar em aparelhos-alvo.
- **Acessibilidade:** Qual padrão e nível de conformidade são exigidos, e quais necessidades de teclado, leitor de tela, contraste e movimento devem ser atendidas? **Impacto:** sem critérios, barreiras de uso podem passar despercebidas e a conformidade não pode ser verificada.
- **Desempenho:** Quais tempos máximos são aceitáveis para busca e carregamento, em quais condições de rede e com qual percentil de medição? **Impacto:** “rápido” não pode ser testado nem usado para avaliar a experiência.
- **Disponibilidade e degradação:** Qual disponibilidade é esperada e o que o app deve fazer quando a aplicação ou o provedor estiver indisponível? **Impacto:** não há critério para confiabilidade, tratamento de dependências externas ou recuperação.
- **Privacidade e segurança:** Sem autenticação nem persistência no servidor, o app solicitará localização ou armazenará dados no dispositivo, como cidade recente ou unidade? Com que finalidade e consentimento? **Impacto:** ainda pode haver coleta ou armazenamento local inesperado, perda de confiança ou descumprimento de obrigações de proteção de dados.
- **Escala e limites de uso:** Qual volume de usuários e consultas deve ser suportado, e como serão controlados os limites e custos do provedor? **Impacto:** a aplicação pode exceder cotas, ficar indisponível ou gerar custos inesperados.
- **Uso para decisões de segurança:** O produto deve exibir alertas meteorológicos ou orientar ações em situações severas? **Impacto:** se houver esse uso, dados, atualização, avisos e comunicação de limitações exigem rigor maior; se não houver, isso deve ficar fora do escopo para evitar falsa expectativa.

## Suposições

- A consulta será iniciada pela busca e seleção explícita de uma cidade; geolocalização automática não está incluída no briefing.
- Celsius será a unidade inicial, e o usuário poderá alternar para Fahrenheit sem alterar os dados meteorológicos de origem.
- A previsão incluirá hoje e os quatro dias seguintes.
- A aplicação obterá dados meteorológicos do Open-Meteo, sem API key.
- A aplicação não terá autenticação nem persistência de dados no servidor; armazenamento local no dispositivo ainda precisa ser decidido.
- A interface será apresentada em pt-BR; formatos regionais específicos ainda precisam ser confirmados.
- O suporte a dispositivos móveis implica uma interface responsiva, sem pressupor que será necessário publicar um aplicativo nativo.
