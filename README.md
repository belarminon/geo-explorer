# Geo-Explorer

O **Geo-Explorer** é um projeto fictício de exploração de trilhas de aprendizagem. Ele oferece trilhas por tecnologia, desafios por nível, acompanhamento de conclusão e emissão de certificados demonstrativos. Pode ser usado pela CLI interativa, por comandos no terminal ou por clientes compatíveis com MCP.

## Requisitos

- Node.js 18 ou superior
- npm 9 ou superior

## Como executar

```bash
git clone https://github.com/belarminon/geo-explorer.git
cd geo-explorer
npm install
npm start
```

Sem argumentos, `npm start` abre um menu interativo. Para usar os comandos diretamente:

```bash
npm start -- help
npm start -- trail dotnet
npm start -- challenge dotnet iniciante
npm start -- complete dotnet iniciante
npm start -- progress dotnet
npm start -- certificate "Seu Nome" dotnet html
```

As trilhas fictícias disponíveis são `dotnet` e `python`; ambas têm os níveis `iniciante`, `intermediario` e `avancado`. Os identificadores de tecnologia e nível não exigem distinção entre maiúsculas e minúsculas.

## Comandos

| Comando | O que faz |
| --- | --- |
| `trail <tecnologia>` | Exibe o plano de estudos, os níveis e os módulos da trilha. |
| `challenge <tecnologia> <nível>` | Apresenta o desafio de código daquele nível. |
| `complete <tecnologia> <nível>` | Registra localmente a conclusão de um nível. |
| `progress <tecnologia>` | Mostra os níveis concluídos e pendentes. |
| `certificate <nome> <tecnologia> [html|pdf] [arquivo]` | Emite um certificado fictício se todos os níveis estiverem concluídos. HTML é o formato padrão. |

Exemplos de exportação:

```bash
npm start -- certificate "Seu Nome" dotnet html
npm start -- certificate "Seu Nome" dotnet pdf
npm start -- certificate "Seu Nome" dotnet pdf ./meu-certificado.pdf
```

O progresso é gravado em `.geo-explorer/progress.json` e permanece apenas na máquina local. O certificado inclui identificador, código de verificação e hash SHA-256 para demonstrar verificação de integridade; ele **não é uma credencial oficial**. O HTML pode ser impresso ou salvo como PDF pelo navegador. A opção `pdf` cria um arquivo PDF diretamente.

## Servidor MCP

O servidor MCP usa transporte stdio e expõe o recurso `geo-explorer://trails` e as ferramentas `list_trails`, `get_trail`, `generate_challenge`, `complete_challenge`, `get_progress` e `generate_certificate`. As ferramentas reutilizam a base, os desafios e o progresso local da CLI.

Inicie-o com:

```bash
npm run mcp
```

No VS Code, a configuração incluída em `.vscode/mcp.json` permite iniciar o servidor para o workspace. O progresso e os certificados não são enviados a serviços externos.

## Testes e build

```bash
npm test
npm run build
```

Os testes automatizados cobrem consulta de trilhas, geração de desafios, persistência e validação de progresso, emissão/verificação/exportação de certificados e integração MCP.

## Melhorias realizadas

- Menu interativo e comandos CLI para consulta, desafios e certificados.
- Registro local de conclusão e bloqueio de certificado até completar a trilha.
- Certificados HTML/PDF demonstrativos com hash SHA-256 e verificação de conteúdo.
- Servidor MCP com ferramentas e recurso para integrar trilhas, desafios e progresso com outros clientes.
- Testes automatizados para os fluxos centrais.

## Aprendizados

O desafio permitiu praticar a organização de dados fictícios separados da lógica dos comandos, validação de entradas e persistência local, testes automatizados de fluxos completos, geração de arquivos e exposição de funcionalidades por MCP. Também reforçou a importância de revisar a documentação e deixar claro que os certificados são apenas demonstrativos.
