# Matriz de compatibilidade de navegadores — pré-release

**Status:** configuração rápida automatizada criada; matriz de release e dispositivos reais **pendentes**. Não há resultados de versões reais neste documento.

## Execução automatizada de PR

Playwright define projetos separados chromium e webkit-mobile (iPhone 13 emulado). CI instala os dois browsers. O projeto mobile emulado não comprova Safari/iOS ou Chrome/Android em aparelho real. A suíte não declara cobertura Firefox/Edge.

## Matriz obrigatória antes do release

Preencher versão major, versão completa, sistema operacional/dispositivo real, data, resultado e evidência para cada uma das três majors estáveis mais recentes no momento da execução. Não presumir que navegador Chromium representa Edge. Repetir em aparelhos reais para cada faixa mobile.

| Plataforma | Major estável mais recente | Major anterior | Terceira major | Evidência real |
| --- | --- | --- | --- | --- |
| Chrome desktop | Pendente | Pendente | Pendente | Pendente |
| Edge desktop | Pendente | Pendente | Pendente | Pendente |
| Firefox desktop | Pendente | Pendente | Pendente | Pendente |
| Safari desktop | Pendente | Pendente | Pendente | Pendente |
| Safari/iOS (aparelho real) | Pendente | Pendente | Pendente | Pendente |
| Chrome/Android (aparelho real) | Pendente | Pendente | Pendente | Pendente |

## Registro por execução

- Data e executor: **PENDENTE**
- Navegador/dispositivo e versão major/full: **PENDENTE**
- Sistema operacional: **PENDENTE**
- Viewports testados: **PENDENTE**
- Busca, seleção, clima, previsão, unidade e overflow: **PENDENTE**
- Evidência/defeitos: **PENDENTE**
- Resultado: **NÃO EXECUTADO**

Um resultado exclusivamente emulado deve ser marcado como incompleto. Executar testes automatizados com pnpm test:e2e; a cobertura de versões e dispositivos físicos depende de ambiente/equipamentos externos.
