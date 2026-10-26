# CareerFlow

Painel pessoal para organizar oportunidades e preparar candidaturas em DevOps, Cloud e SRE.

## Funcionalidades

- Cadastro de vagas e prevenção de links duplicados.
- Priorização por palavras-chave e modalidade.
- Geração de mensagens a partir de modelos editáveis.
- Controle manual de status, filtros e busca.
- Exportação CSV e backup/restauração JSON.

## Executar

Abra `dist/index.html` em um navegador moderno. Para desenvolvimento, com Python instalado:

```sh
python -m http.server 4173 --directory dist
```

Acesse http://localhost:4173. Não há dependências de build. As fontes opcionais são carregadas do Google Fonts.

## Validar JavaScript

Com Node.js instalado:

```sh
node --check dist/app.js
```

## Dados e integrações

Os dados são salvos no localStorage do navegador e não são sincronizados entre dispositivos. Faça backups pela tela Perfil e currículo. O código contém os dados iniciais do perfil pessoal; este repositório foi criado como privado.

O site prepara mensagens, mas não envia candidaturas, não conecta contas do LinkedIn e não executa tarefas quando está fechado. O status Enviada é informado manualmente após a candidatura na plataforma.

## Estrutura

- `dist/index.html`: interface.
- `dist/style.css`: estilos responsivos.
- `dist/app.js`: lógica e persistência local.

Este repositório armazena o código. A hospedagem do site não foi ativada por este envio.
