# Biblioteca pessoal

Aplicação web para pesquisar obras no Google Books e organizar uma biblioteca
pessoal. Os livros são persistidos em SQLite por uma API criada com Node.js e
Express.

![Prévia da Biblioteca](assets/preview.png)

## Funcionalidades

- Pesquisa por título, autor ou busca geral no Google Books.
- Paginação dos resultados.
- Cadastro, edição e exclusão de livros.
- Listas de livros lidos, favoritos e leituras planejadas.
- Atualização persistente dos status dos livros.
- Favoritos de autores.
- Notificações com opção de desfazer algumas ações.
- Layout responsivo para computador, tablet e celular.

## Tecnologias

- HTML5, CSS3 e JavaScript
- Node.js
- Express
- SQLite, por meio de `node:sqlite`
- Google Books API
- Web Storage API, somente para os autores favoritos

## Pré-requisitos

- Node.js 24 ou mais recente
- npm
- SQLite CLI para criar o banco pela primeira vez

## Configuração da Google Books API

O arquivo `config.js` não é incluído no repositório para evitar o envio
acidental da chave.

1. Faça uma cópia de `config.example.js` e renomeie para `config.js`.
2. Abra `config.js` e substitua o texto de exemplo pela sua chave.
3. Restrinja a chave aos endereços do site e ao serviço necessário.

```js
window.GOOGLE_BOOKS_API_KEY = "SUA_CHAVE_AQUI";
```

Uma chave usada no navegador pode ser visualizada pelo visitante. As
restrições configuradas no provedor são a proteção principal.

## Criação do banco de dados

Na raiz do projeto, abra o SQLite:

```powershell
sqlite3 biblioteca.db
```

Dentro do SQLite, execute o arquivo de criação e depois saia:

```sql
.read database.sql
.quit
```

O arquivo `biblioteca.db` é local e está ignorado pelo Git. O arquivo
`database.sql` contém a estrutura e os dados iniciais usados para recriá-lo.

## Como executar

Instale as dependências:

```powershell
npm install
```

Inicie o servidor:

```powershell
npm start
```

Depois, abra no navegador:

```text
http://localhost:3000
```

## Rotas da API

| Método | Rota | Finalidade |
| --- | --- | --- |
| `GET` | `/books` | Listar os livros |
| `POST` | `/books` | Cadastrar um livro |
| `PATCH` | `/books/:id` | Atualizar os status |
| `PUT` | `/books/:id` | Editar título, autor e ano |
| `DELETE` | `/books/:id` | Excluir um livro |

## Estrutura principal

```text
sistemaDeBiblioteca/
├── assets/
├── index.html
├── script.js
├── books-api.js
├── server.js
├── database.sql
├── package.json
├── favoritos.html
├── favoritos.js
├── lidos.html
├── lidos.js
├── planejados.html
├── planejados.js
├── notifications.js
├── config.example.js
├── style.css
└── README.md
```

## Armazenamento e backup

Os livros ficam no banco SQLite. Os autores favoritos ainda ficam no
`localStorage` do navegador. A importação e a exportação de backup em JSON
estão temporariamente desativadas até serem migradas para o SQLite.

## Publicação

O projeto agora precisa de um servidor Node.js e de armazenamento persistente
para o arquivo SQLite. Portanto, somente o GitHub Pages não é suficiente para
executar a aplicação completa.
