async function carregarLivrosDoBanco() {
  const resposta = await fetch("http://localhost:3000/books");
  const dados = await resposta.json();
  const livrosConvertidos = dados.map((livro) => {
    return {
      id: livro.id,
      titulo: livro.title,
      autor: livro.author,
      ano: livro.year,
      capa: livro.cover,
      lido: livro.read === 1,
      favorito: livro.favorite === 1,
      planejado: livro.want_to_read === 1,
      autores: [livro.author],
      googleId: livro.google_books_id,
      idExterno: livro.google_books_id,
      url: livro.info_link,
      tipo: "livro",
      fonte: livro.google_books_id ? "google-books" : "manual",
    };
  });

  return livrosConvertidos;
}

async function atualizarStatusLivro(livro) {
  const resposta = await fetch(`http://localhost:3000/books/${livro.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      read: livro.lido ? 1 : 0,
      favorite: livro.favorito ? 1 : 0,
      want_to_read: livro.planejado ? 1 : 0,
    }),
  });
  return resposta.json();
}

async function adicionarLivroNoBanco(livro) {
  const response = await fetch("http://localhost:3000/books", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: livro.titulo,
      author: livro.autor,
      year: livro.ano,
      cover: livro.capa ?? null,
      read: livro.lido ? 1 : 0,
      favorite: livro.favorito ? 1 : 0,
      want_to_read: livro.planejado ? 1 : 0,
      google_books_id: livro.googleId ?? null,
      info_link: livro.url ?? null,
    }),
  });

  const dados = await response.json();

  livro.id = dados.id;

  return livro;
}

async function atualizarDadosLivro(livro) {
  const resposta = await fetch(`http://localhost:3000/books/${livro.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: livro.titulo,
      author: livro.autor,
      year: livro.ano,
    }),
  });

  return resposta.json();
}
async function excluirLivroDoBanco(id) {
  const response = await fetch(`http://localhost:3000/books/${id}`, {
    method: "DELETE",
  });
  return response.json();
}
