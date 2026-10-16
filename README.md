# 🌍 Geo-Explorer

O **Geo-Explorer** é uma CLI interativa e servidor MCP para explorar trilhas de aprendizagem, acompanhar desafios e emitir certificados com verificação SHA-256.

## 🚀 Como executar

### Pré-requisitos
- Node.js v18+
- npm v9+

```bash
git clone https://github.com/belarminon/geo-explorer.git
cd geo-explorer
npm install

# Menu interativo
npm start

# Comandos diretos
npm start -- trail dotnet
npm start -- challenge dotnet iniciante
npm start -- complete dotnet iniciante
npm start -- progress dotnet
npm start -- certificate "Seu Nome" dotnet html
npm start -- certificate "Seu Nome" dotnet pdf
```

O menu oferece exploração de trilhas, consulta de desafios, registro de conclusões, acompanhamento do progresso e emissão de certificados. A interface usa cores ANSI e prompts no terminal, sem dependências adicionais para interação.

## 📈 Progresso e certificados

Conclusões são armazenadas localmente em `.geo-explorer/progress.json` e não são enviadas para serviços externos. Registre cada nível como concluído com `complete <tecnologia> <nível>`; o comando `progress <tecnologia>` mostra o que falta. O certificado só é emitido depois que todos os níveis daquela trilha forem registrados.

O certificado contém um identificador e código de verificação gerados por emissão, além de um hash SHA-256 calculado sobre os dados do aluno, trilha e data. A exportação padrão gera `certificates/<ID>.html`, com layout pronto para impressão. No navegador, use **Imprimir > Salvar como PDF**. Para gerar um PDF diretamente, informe `pdf`; um caminho de saída opcional pode ser passado como último argumento.

```bash
npm start -- certificate "Seu Nome" dotnet html
npm start -- certificate "Seu Nome" dotnet pdf
npm start -- certificate "Seu Nome" dotnet pdf ./meu-certificado.pdf
```

## 🧪 Testes e servidor MCP

```bash
npm test
npm run build
npm run mcp
```
