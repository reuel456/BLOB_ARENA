# 🎮 BLOB ARENA

**Blob Arena** é um jogo multiplayer de navegador inspirado em jogos de arena de células. Entre em uma arena, colete comida, aumente sua massa e dispute espaço com outros jogadores em tempo real.

## 📋 Requisitos

Antes de instalar, você precisa ter:

- [Node.js](https://nodejs.org/) instalado.
- Um navegador atualizado (Chrome, Edge ou Firefox).
- Os arquivos do projeto Blob Arena.

## 📁 Estrutura do projeto

Confira se suas pastas estão organizadas assim:

```text
blob-arena/
│
├── index.js
├── package.json
├── README.md
│
└── public/
    ├── index.html
    ├── style.css
    └── game.js
```

## ⚙️ Como instalar

### 1. Abra a pasta do jogo

Abra a pasta `blob-arena` no Visual Studio Code.

### 2. Abra o terminal

No VS Code, clique em:

**Terminal → Novo Terminal**

Confira se o terminal está dentro da pasta principal do projeto.

### 3. Instale as dependências

Execute:

```bash
npm install express socket.io
```

Esse comando instala:

- **Express:** disponibiliza o jogo no navegador.
- **Socket.IO:** permite a comunicação entre os jogadores em tempo real.

### 4. Inicie o servidor

Execute:

```bash
node index.js
```

Se tudo estiver correto, aparecerá:

```text
BLOB ARENA INICIADO!
http://localhost:3000
```

### 5. Abra o jogo

Acesse pelo navegador:

**http://localhost:3000**

Pronto! O Blob Arena estará funcionando no seu computador.

---

## 🕹️ Como jogar

### Objetivo

Seu objetivo é aumentar sua massa, coletando as bolinhas coloridas espalhadas pela arena.

- Movimente-se usando o mouse.
- Coma as bolinhas de comida.
- Cresça e aumente sua pontuação.
- Use as habilidades disponíveis.
- Tente ficar entre os maiores jogadores do ranking.

### 🎮 Controles

| Tecla / comando | Função |
|---|---|
| Mouse | Movimentar |
| SPACE | Dividir a bolinha |
| W (segurar) | Ejetar massa |
| Q | Divisão dupla |
| E | Tentar dividir em até 16 células |
| F | Ativar poder de velocidade |
| 1 a 6 | Mensagens rápidas |
| M | Mostrar ou esconder minimapa |
| ESC | Pausar ou continuar |
| Roda do mouse | Aproximar ou afastar a câmera |

### 💡 Dicas

- Colete bastante comida para crescer.
- Use o minimapa para acompanhar os jogadores.
- Evite jogadores maiores que você.
- Use a divisão com cuidado.
- A ejeção de massa reduz seu tamanho.
- O poder de velocidade ajuda a se movimentar mais rapidamente.

---

## 🌐 Como jogar com outras pessoas

### No mesmo computador

1. Inicie o servidor com `node index.js`.
2. Abra `http://localhost:3000` em duas abas do navegador.
3. Digite nomes diferentes.
4. Clique em JOGAR nas duas abas.

### Em computadores diferentes

Para jogar pela internet, o servidor precisa ser publicado em uma hospedagem compatível com Node.js e Socket.IO.

Apenas abrir `localhost:3000` não permite que pessoas de outros computadores entrem.

---

## 🛠️ Tecnologias utilizadas

| Tecnologia | Utilização |
|---|---|
| HTML5 | Estrutura do jogo |
| CSS3 | Interface visual |
| JavaScript | Mecânicas e controles |
| Canvas | Renderização da arena |
| Node.js | Servidor |
| Express | Servir os arquivos |
| Socket.IO | Multiplayer em tempo real |

## ❓ Solução de problemas

### Erro: Cannot GET /

Confira se o arquivo `index.html` está dentro da pasta `public`.

### Erro: Cannot find module 'express'

Execute:

```bash
npm install express socket.io
```

### O jogo não conecta

Confira se o servidor está ligado e se o terminal mostra:

```text
BLOB ARENA INICIADO!
```

### A bolinha não aparece

Confira se você clicou em JOGAR e se o servidor está recebendo a conexão Socket.IO.

---

## 🚀 Divirta-se!

Obrigado por jogar **Blob Arena**!

**Projeto:** Blob Arena Multiplayer  
**Versão:** 1.0  
**Plataforma:** Navegador  
**Modo atual:** Multiplayer via Socket.IO (servidor local)
