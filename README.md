# Prova Laço

Aplicação desktop desenvolvida com **Tauri**, **React**, **TypeScript** e **Tailwind CSS**.

## Tecnologias utilizadas

* [Tauri](https://tauri.app/)
* [React](https://react.dev/)
* [TypeScript](https://www.typescriptlang.org/)
* [Vite](https://vite.dev/)
* [Tailwind CSS](https://tailwindcss.com/)
* [Rust](https://www.rust-lang.org/)

## Pré-requisitos

Antes de iniciar o projeto, é necessário ter instalado:

* Node.js
* npm
* Rust
* Microsoft Visual C++ Build Tools
* WebView2 Runtime

Para verificar as instalações, execute:

```bash
node --version
npm --version
rustc --version
cargo --version
```

## Instalação

Clone o repositório:

```bash
git clone URL_DO_REPOSITORIO
```

Entre na pasta do projeto:

```bash
cd prova_laco
```

Instale as dependências:

```bash
npm install
```

## Executando o projeto

Para executar apenas a interface web:

```bash
npm run dev
```

Para executar a aplicação desktop com Tauri:

```bash
npm run tauri dev
```

## Gerando o instalador

Para compilar a aplicação e gerar o instalador:

```bash
npm run tauri build
```

Os arquivos gerados estarão, normalmente, em:

```text
src-tauri/target/release/bundle/
```

## Estrutura do projeto

```text
prova_laco/
├── src/
│   ├── assets/
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── src-tauri/
│   ├── capabilities/
│   ├── icons/
│   ├── src/
│   ├── Cargo.toml
│   └── tauri.conf.json
├── package.json
├── vite.config.ts
└── README.md
```

## Scripts disponíveis

```bash
npm run dev
```

Executa o projeto React no navegador.

```bash
npm run build
```

Gera a versão de produção da interface.

```bash
npm run tauri dev
```

Executa a aplicação desktop em modo de desenvolvimento.

```bash
npm run tauri build
```

Compila a aplicação e gera os arquivos de distribuição.
