# Disponibilidade e prontidão operacional

**Status:** definição documental concluída; implantação e monitoramento **pendentes de decisões/acessos externos**. Este arquivo não afirma disponibilidade em produção.

## Dados operacionais que ainda precisam ser fornecidos

| Dado exigido | Valor atual | Ação necessária |
| --- | --- | --- |
| Provedor de hospedagem efetivamente aprovado | **PENDENTE** | Confirmar provedor e conta/projeto com acesso autorizado. O repositório contém workflow de GitHub Pages, mas isso não comprova que Pages esteja habilitado nem que o app esteja publicado. |
| URL pública exata monitorada | **PENDENTE** | Confirmar a URL final do shell publicado e seu caminho base. Não usar URL presumida. |
| Serviço/sonda externa e intervalo | **PENDENTE** | Selecionar conta/serviço de monitoramento e configurar HTTP GET a cada minuto. |
| Destino das métricas e relatório | **PENDENTE** | Informar painel/armazenamento de série temporal e retenção aprovada. |
| Responsável nominal pela revisão mensal | **PENDENTE** | Informar pessoa real e garantir acesso de leitura; nenhum nome foi inventado. |
| Acesso de leitura ao relatório e configuração | **PENDENTE** | Conceder ao responsável indicado depois de escolher o serviço. |

## Definições de SLI

1. **Shell da aplicação:** sucesso somente quando a sonda obtém resposta HTTP 2xx para a URL pública do shell. Frequência requerida: uma verificação por minuto. Disponibilidade mensal = 100 × verificações HTTP 2xx / verificações totais; comparar com a meta de 99,5%. Falhas da própria sonda precisam ser distinguidas de respostas HTTP não-2xx e documentadas pelo provedor de monitoramento.
2. **Open-Meteo:** registrar falhas/429/timeout observados separadamente do SLI do shell. A disponibilidade do provedor externo não compõe o numerador HTTP 2xx da aplicação e não há SLA garantido pelo endpoint gratuito.
3. Armazenar resultado, timestamp, status e duração no destino aprovado; relatório mensal deve registrar numerador, denominador, percentual, meta, lacunas de sonda e série Open-Meteo separada.

## Geração de relatório local

Depois de exportar as verificações da ferramenta aprovada em CSV UTF-8 com cabeçalho `timestamp,target,http_status` (target `shell` ou `open-meteo`; status vazio representa timeout sem resposta), gere o resumo mensal com `node scripts/availability-report.mjs checks.csv YYYY-MM`. O script filtra o mês informado, conta apenas HTTP 2xx como sucesso, calcula percentuais e compara o shell a 99,5%; Open-Meteo permanece em série separada. Ele não executa a sonda e não substitui sua configuração externa ou a revisão humana.

## Escopo e privacidade

- Uso permitido aqui: demonstração/treinamento não comercial, dentro dos termos e cotas publicados do endpoint gratuito Open-Meteo. Qualquer uso comercial/operacional requer nova decisão de produto/licença e serviço apropriado.
- O app não armazena respostas meteorológicas em cache e não faz polling nem retry automático.
- A sonda de shell não deve chamar a API meteorológica para classificar o HTTP do shell; checks de Open-Meteo, quando definidos, devem ser outra série.

## Configuração da sonda — especificação pendente de provisionamento

Depois de preencher URL, serviço, destino e responsável, criar uma checagem HTTP GET de intervalo 60 s, timeout documentado, sem autenticação/segredos no repositório, e verificar somente status 2xx do shell. Habilitar histórico mensal e acesso de leitura para o responsável. A conta/configuração externa não pode ser criada neste worktree sem provedor, URL, credenciais e aprovação; nenhuma configuração fictícia foi adicionada.

## Checklist de release

- [ ] Preencher todos os campos pendentes acima com fatos confirmados.
- [ ] Aprovar hospedagem não comercial e confirmar URL publicada.
- [ ] Provisionar a sonda por minuto e testar status 2xx/não-2xx.
- [ ] Confirmar armazenamento do relatório e acesso de leitura do responsável.
- [ ] Após um mês completo, registrar ambos os SLIs e avaliar a meta de 99,5% do shell.
