# Evolução do CareerFlow

## Implementado nesta entrega

- Interface existente mantida: HTML, CSS e JavaScript no Netlify.
- Aba Match e revisão, com score normalizado de 0 a 100.
- Filtros editáveis de nível, palavras proibidas, área, cidade e modalidade.
- Skills identificadas por catálogo e sinônimos; competências ausentes são exibidas, nunca adicionadas ao perfil.
- Localização manual nas vagas; dados ausentes aparecem como pendência.
- Mensagens editáveis e aprovação explícita por item.
- Alterações relevantes no perfil ou na vaga invalidam a aprovação anterior.
- Exportação em lote somente das candidaturas selecionadas e aprovadas com revisão atual.

## Limites atuais

Não há upload/parser de PDF/DOCX, banco, login, criptografia de dados locais, coleta de ATS, fila ou envio de candidaturas. A aprovação não equivale a envio. O perfil vem do resumo preenchido manualmente; a detecção de termos não comprova experiência. Salário não é filtrado nesta entrega. A localização declarada deve ser conferida na descrição da vaga.

As exportações e o armazenamento local incluem dados pessoais. O domínio Netlify é público. Não colocar credenciais de plataformas no perfil. O backup da tela Perfil inclui os novos dados; não compartilhar seu arquivo de backup.

## Próximas fases dependentes de infraestrutura

1. Backend autenticado exclusivo do proprietário, parser PDF/DOCX com revisão, Blob privado e banco criptografado.
2. Adaptadores Greenhouse, Lever e Ashby com fixtures e documentação das fontes.
3. Fila Service Bus, limites atômicos, idempotência e preenchimento assistido; CAPTCHA/2FA sempre requerem ação manual.
4. Contatos de fontes oficiais, infraestrutura, observabilidade e alertas.

Não coletar LinkedIn, Indeed ou Glassdoor automaticamente. Automação de envio pode violar os termos de algumas plataformas; verificar cada fonte antes de ativar. Nenhum serviço Azure foi provisionado.

## Testes

Com Node.js instalado: `node --test tests/rules.test.cjs`.

O conjunto de dez verificações foi executado no runtime JavaScript da sessão. O terminal local está bloqueado por erro de acesso do sandbox; a execução pelo Node local não foi realizada. A sintaxe da extensão também foi verificada pelo runtime JavaScript. A verificação de navegador foi tentada, mas o runtime de navegador encerrou por falha na configuração do sandbox Windows. A prévia deve ser validada antes do merge. Dois cenários adicionais (aprovação válida e invalidação por localização) passaram no runtime da sessão.
