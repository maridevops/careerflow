# Revisão de confiabilidade

## Problemas corrigidos

- Backups anteriores à busca agora recebem estado de discovery vazio. Estruturas inválidas, tipos incorretos, IDs repetidos e URLs com credenciais são rejeitados antes da substituição.
- Falhas de gravação desfazem alterações em memória e não exibem confirmação de sucesso. Dados de inicialização inválidos ficam protegidos contra sobrescrita e podem ser exportados para recuperação.
- A aba Match e revisão atualiza quando uma vaga é salva. Restauração invalida a busca em curso e recria o agendamento.
- Resultados de busca são salvos por fonte, canceláveis e paginados em grupos de 50. Duplicatas por URL não aparecem repetidas na lista; a origem de cada registro é preservada.
- Erros de fonte não atualizam o horário de último sucesso. Resultados parciais não encerram vagas ausentes. Remover uma fonte oculta seu cache da visualização padrão, sem apagar vagas do radar.
- A função distingue HTTP 404/429, formato inválido, timeout, falha de conexão e excesso de tamanho. A leitura possui limite de bytes e timeout também durante a leitura do corpo.
- Respostas Greenhouse acima do limite têm fallback para metadados, com aviso de descrição ausente. Esta é uma proteção para uma possível causa da falha observada; não comprova a causa da falha anterior da Cloudflare.
- HTML codificado é convertido em texto; linhas nulas são ignoradas; modalidades desconhecidas não são presumidas presenciais. Descrições truncadas ficam identificadas e exigem revisão.
- A palavra global isolada não confirma elegibilidade no Brasil. Pesos inválidos não geram NaN.
- Navegação em telas estreitas permite quebra de linha e botões desabilitados têm estado visual.

## Validação

Execute `node --test`. A suíte combina os testes existentes, testes de regressão de dados/matching, integração HTTP com respostas controladas e testes de estado da interface em DOM mínimo. Nenhuma candidatura real é enviada.

O DOM mínimo verifica regras e transições de estado; não substitui testes visuais em navegador real. O ambiente local de execução estava indisponível durante a revisão e o navegador automatizado não estava disponível. Os testes executados no build do Netlify são o controle de publicação.

## Limites do produto

Este é um painel de organização e busca em fontes configuradas. Ainda não é o sistema completo de candidaturas automáticas: não há autenticação, banco persistente, catálogo global automático, workers de envio, parsing de currículos ou OAuth. Os conectores do ChatGPT não concedem essas integrações ao site.
