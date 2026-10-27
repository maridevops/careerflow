# Busca de oportunidades — primeira entrega

O painel existente mantém HTML/CSS/JavaScript e localStorage. A aba Buscar oportunidades consulta uma Netlify Function de leitura, sem credenciais nem envio de dados do perfil.

## Fontes e uso

Adicione o identificador público da empresa, encontrado na URL da sua página de carreiras. Fontes suportadas: Greenhouse, Lever global/Europa e Ashby. Não há catálogo mundial automático de empresas. Cada consulta cobre as fontes configuradas (até 20). O identificador é exibido como nome da empresa; confira a identidade no anúncio original.

- https://docs.greenhouse.io/job-board.html
- https://github.com/lever/postings-api
- https://developers.ashbyhq.com/docs/public-job-posting-api

Busca manual ou a cada 15/60 minutos com a aba aberta e visível. Filtros por área, texto/localização e modalidade remota explicitamente informada pela fonte. Sem inferência de autorização de trabalho. Até 150 resultados exibidos por filtro. Salvar no radar impede duplicatas por URL e mantém o fluxo de revisão existente.

Jobs ausentes em uma consulta bem-sucedida são sinalizados como não listados; falhas não arquivam resultados. Esta indicação não equivale a verificação individual da disponibilidade. Dados persistem somente no navegador; o cache público contém exclusivamente anúncios públicos. Não há sincronização entre dispositivos nem coleta em segundo plano com a aba fechada.

## Testes

Execute node --test. Seis novos testes cobrem normalização, deduplicação, datas, anúncios não listados, URLs inseguras, respostas inválidas, validação de destinos e método somente leitura. O Netlify executa os testes existentes e novos antes da publicação. Testes não enviam candidaturas reais.

## Próximas fases

Ainda faltam: catálogo de fontes e agendamento persistente, autenticação e banco de dados, importação/extração de múltiplos currículos, avaliação com IA, conectores de envio com autorização e confirmação verificável, OAuth para Gmail/Calendar. LinkedIn, Indeed e Workday não estão conectados. Os conectores do ChatGPT não concedem automaticamente acesso a este site.
