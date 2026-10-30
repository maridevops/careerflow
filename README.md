# CareerFlow

Painel para organizar vagas e revisar candidaturas em Cloud, DevOps e SRE.

Site: https://enchanting-dodol-a1c6a0.netlify.app/

## O que funciona

- Cadastro e acompanhamento manual de oportunidades.
- Perfil, link do currículo e mensagens editáveis.
- Matching por regras, com explicação e confirmação individual de revisão.
- Consulta de páginas públicas de Greenhouse, Lever (global/Europa) e Ashby, configuradas por empresa.
- Filtros, paginação, cancelamento, importação sem duplicar URLs e atualização enquanto a aba estiver aberta e visível.
- CSV e backup JSON, incluindo recuperação de backups anteriores.

O site **não envia candidaturas**, não importa currículos PDF, não autentica no LinkedIn e não acessa Gmail/Calendar. O matching é heurístico, sem modelo de IA. Uma aprovação registra revisão, não envio. Dados pessoais ficam no navegador, sem sincronização entre dispositivos.

## Executar e testar

Requer Node.js 22. Sem dependências de produção.

```sh
node --test
```

O frontend está em `dist/`. A busca usa `/.netlify/functions/jobs` e precisa do ambiente Netlify; abrir o HTML isolado permite organizar dados, mas não consultar a função.

O arquivo `netlify.toml` publica `dist`, instala as funções de `netlify/functions` e executa os testes antes do deploy. A prévia da PR deve passar antes do merge. Verifique o deploy de produção separadamente; uma prévia verde não comprova publicação da branch principal.

## Dados e segurança

Faça backups regularmente. Se a gravação falhar, a alteração é desfeita e o site informa o erro. Dados antigos inválidos não são sobrescritos: baixe a cópia de recuperação em Perfil e currículo. Restauração valida o arquivo antes de substituir os dados.

A função consulta apenas hosts fixos de fontes públicas. Não recebe perfil, currículo ou credenciais. Respostas têm limites de tempo/tamanho e cache público. Respostas parciais e falhas não são usadas para concluir que vagas fecharam. Uma vaga ausente da fonte é sinalizada, não removida do seu radar pessoal.

Detalhes: [busca pública](docs/public-job-discovery.md) e [revisão de confiabilidade](docs/reliability-review.md).
