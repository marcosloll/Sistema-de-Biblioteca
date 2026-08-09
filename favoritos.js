/* =========================
   MENU MOBILE
========================= */

const menuButton = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");

const linksDoMenu = document.querySelectorAll(
  ".nav-links a",
);

function fecharMenu() {
  if (!menuButton || !navLinks) {
    return;
  }

  navLinks.classList.remove("is-open");
  menuButton.classList.remove("is-open");

  document.body.classList.remove("menu-open");

  menuButton.setAttribute(
    "aria-expanded",
    "false",
  );

  menuButton.setAttribute(
    "aria-label",
    "Abrir menu",
  );
}

if (menuButton && navLinks) {
  menuButton.addEventListener("click", () => {
    const menuEstaAberto =
      navLinks.classList.toggle("is-open");

    menuButton.classList.toggle(
      "is-open",
      menuEstaAberto,
    );

    document.body.classList.toggle(
      "menu-open",
      menuEstaAberto,
    );

    menuButton.setAttribute(
      "aria-expanded",
      String(menuEstaAberto),
    );

    menuButton.setAttribute(
      "aria-label",
      menuEstaAberto
        ? "Fechar menu"
        : "Abrir menu",
    );
  });
}

linksDoMenu.forEach((link) => {
  link.addEventListener("click", fecharMenu);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    fecharMenu();
  }
});

/* =========================
   NOTIFICAÇÕES
========================= */

function notificar(
  mensagem,
  tipo = "sucesso",
  duracao = 3500,
  acao = null,
) {
  if (
    typeof window.mostrarNotificacao ===
    "function"
  ) {
    window.mostrarNotificacao(
      mensagem,
      tipo,
      duracao,
      acao,
    );
  }
}

/* =========================
   ELEMENTOS DAS ABAS
========================= */

const abaLivros = document.querySelector(
  "#aba-livros",
);

const abaAutores = document.querySelector(
  "#aba-autores",
);

const painelLivros = document.querySelector(
  "#painel-livros-favoritos",
);

const painelAutores = document.querySelector(
  "#painel-autores-favoritos",
);

const contadorAbaLivros = document.querySelector(
  "#contador-aba-livros",
);

const contadorAbaAutores = document.querySelector(
  "#contador-aba-autores",
);

/* =========================
   ELEMENTOS DOS LIVROS
========================= */

const listaFavoritos = document.querySelector(
  "#lista-favoritos",
);

const estadoVazioFavoritos =
  document.querySelector(
    "#estado-vazio-favoritos",
  );

const statusFavoritos = document.querySelector(
  "#status-favoritos",
);

/* =========================
   ELEMENTOS DOS AUTORES
========================= */

const listaAutoresFavoritos =
  document.querySelector(
    "#lista-autores-favoritos",
  );

const estadoVazioAutores =
  document.querySelector(
    "#estado-vazio-autores",
  );

const statusAutoresFavoritos =
  document.querySelector(
    "#status-autores-favoritos",
  );

/* =========================
   FUNÇÕES AUXILIARES
========================= */

function normalizarTexto(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function gerarIdAutor(nome) {
  const idNormalizado = normalizarTexto(nome)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (idNormalizado) {
    return idNormalizado;
  }

  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
}

function obterAutoresLivro(livro) {
  let autores = [];

  if (
    Array.isArray(livro.autores) &&
    livro.autores.length > 0
  ) {
    autores = livro.autores;
  } else if (livro.autor) {
    autores = [livro.autor];
  }

  const autoresUnicos = new Map();

  autores.forEach((autor) => {
    const nome = String(autor ?? "").trim();
    const nomeNormalizado = normalizarTexto(nome);

    if (
      !nome ||
      !nomeNormalizado ||
      nomeNormalizado ===
        "autor nao informado"
    ) {
      return;
    }

    if (!autoresUnicos.has(nomeNormalizado)) {
      autoresUnicos.set(nomeNormalizado, nome);
    }
  });

  return [...autoresUnicos.values()];
}

/* =========================
   LIVROS NO LOCAL STORAGE
========================= */

let livros = carregarLivros();

function carregarLivros() {
  const livrosSalvos =
    localStorage.getItem("livros");

  if (!livrosSalvos) {
    return [];
  }

  try {
    const livrosCarregados =
      JSON.parse(livrosSalvos);

    if (!Array.isArray(livrosCarregados)) {
      return [];
    }

    return livrosCarregados.map((livro) => {
      const autoresNormalizados =
        Array.isArray(livro.autores)
          ? livro.autores
              .map((autor) =>
                String(autor ?? "").trim(),
              )
              .filter(Boolean)
          : livro.autor
            ? [String(livro.autor).trim()]
            : [];

      return {
        ...livro,

        googleId:
          livro.googleId ?? null,

        capa:
          livro.capa ?? null,

        lido:
          livro.lido ?? true,

        planejado:
          livro.planejado ?? false,

        favorito:
          livro.favorito ?? false,

        autores:
          autoresNormalizados,
      };
    });
  } catch (erro) {
    console.error(
      "Não foi possível carregar os livros:",
      erro,
    );

    return [];
  }
}

function salvarLivros() {
  localStorage.setItem(
    "livros",
    JSON.stringify(livros),
  );
}

/* =========================
   AUTORES NO LOCAL STORAGE
========================= */

let autoresFavoritos =
  carregarAutoresFavoritos();

function carregarAutoresFavoritos() {
  const autoresSalvos = localStorage.getItem(
    "autoresFavoritos",
  );

  if (!autoresSalvos) {
    return [];
  }

  try {
    const autoresCarregados =
      JSON.parse(autoresSalvos);

    if (!Array.isArray(autoresCarregados)) {
      return [];
    }

    const autoresUnicos = new Map();

    autoresCarregados.forEach((autor) => {
      const nome =
        typeof autor === "string"
          ? autor.trim()
          : String(autor?.nome ?? "").trim();

      const nomeNormalizado =
        normalizarTexto(nome);

      if (!nome || !nomeNormalizado) {
        return;
      }

      if (
        !autoresUnicos.has(nomeNormalizado)
      ) {
        autoresUnicos.set(
          nomeNormalizado,
          {
            id:
              typeof autor === "object" &&
              autor?.id
                ? autor.id
                : gerarIdAutor(nome),

            nome,
          },
        );
      }
    });

    return [...autoresUnicos.values()];
  } catch (erro) {
    console.error(
      "Não foi possível carregar os autores favoritos:",
      erro,
    );

    return [];
  }
}

function salvarAutoresFavoritos() {
  localStorage.setItem(
    "autoresFavoritos",
    JSON.stringify(autoresFavoritos),
  );
}

/* =========================
   ABAS
========================= */

function ativarAba(tipo) {
  if (
    !abaLivros ||
    !abaAutores ||
    !painelLivros ||
    !painelAutores
  ) {
    return;
  }

  const mostrarAutores =
    tipo === "autores";

  abaLivros.classList.toggle(
    "is-active",
    !mostrarAutores,
  );

  abaAutores.classList.toggle(
    "is-active",
    mostrarAutores,
  );

  abaLivros.setAttribute(
    "aria-selected",
    String(!mostrarAutores),
  );

  abaAutores.setAttribute(
    "aria-selected",
    String(mostrarAutores),
  );

  abaLivros.tabIndex =
    mostrarAutores ? -1 : 0;

  abaAutores.tabIndex =
    mostrarAutores ? 0 : -1;

  painelLivros.hidden = mostrarAutores;
  painelAutores.hidden = !mostrarAutores;

  painelLivros.setAttribute(
    "aria-hidden",
    String(mostrarAutores),
  );

  painelAutores.setAttribute(
    "aria-hidden",
    String(!mostrarAutores),
  );

  const urlAtual = new URL(
    window.location.href,
  );

  urlAtual.hash =
    mostrarAutores ? "autores" : "";

  window.history.replaceState(
    null,
    "",
    urlAtual,
  );
}

if (abaLivros && abaAutores) {
  abaLivros.addEventListener("click", () => {
    ativarAba("livros");
  });

  abaAutores.addEventListener("click", () => {
    ativarAba("autores");
  });

  const botoesAbas = [
    abaLivros,
    abaAutores,
  ];

  botoesAbas.forEach(
    (botao, indiceAtual) => {
      botao.addEventListener(
        "keydown",
        (event) => {
          const teclasPermitidas = [
            "ArrowLeft",
            "ArrowRight",
            "Home",
            "End",
          ];

          if (
            !teclasPermitidas.includes(
              event.key,
            )
          ) {
            return;
          }

          event.preventDefault();

          let novoIndice = indiceAtual;

          if (event.key === "ArrowRight") {
            novoIndice =
              (indiceAtual + 1) %
              botoesAbas.length;
          }

          if (event.key === "ArrowLeft") {
            novoIndice =
              (indiceAtual -
                1 +
                botoesAbas.length) %
              botoesAbas.length;
          }

          if (event.key === "Home") {
            novoIndice = 0;
          }

          if (event.key === "End") {
            novoIndice =
              botoesAbas.length - 1;
          }

          const novaAba =
            novoIndice === 0
              ? "livros"
              : "autores";

          ativarAba(novaAba);

          botoesAbas[
            novoIndice
          ].focus();
        },
      );
    },
  );
}

/* =========================
   CAPA SEM IMAGEM
========================= */

function criarPlaceholderCapa() {
  const placeholder =
    document.createElement("span");

  placeholder.classList.add(
    "cover-placeholder",
  );

  placeholder.textContent = "📖";

  placeholder.setAttribute(
    "aria-label",
    "Livro sem capa disponível",
  );

  return placeholder;
}

/* =========================
   AUTORES FAVORITOS
========================= */

function encontrarAutorFavorito(nome) {
  const nomeNormalizado =
    normalizarTexto(nome);

  return autoresFavoritos.find(
    (autor) =>
      normalizarTexto(autor.nome) ===
      nomeNormalizado,
  );
}

function autorEstaFavoritado(nome) {
  return Boolean(
    encontrarAutorFavorito(nome),
  );
}

function adicionarAutorFavorito(nome) {
  const nomeLimpo =
    String(nome ?? "").trim();

  if (
    !nomeLimpo ||
    autorEstaFavoritado(nomeLimpo)
  ) {
    return;
  }

  autoresFavoritos.push({
    id: gerarIdAutor(nomeLimpo),
    nome: nomeLimpo,
  });

  salvarAutoresFavoritos();
  renderizarTudo();

  notificar(
    `"${nomeLimpo}" foi adicionado aos autores favoritos.`,
  );
}

function restaurarAutorFavorito(
  autorRemovido,
  indiceAnterior,
) {
  if (
    autorEstaFavoritado(
      autorRemovido.nome,
    )
  ) {
    return;
  }

  const indiceSeguro = Math.min(
    indiceAnterior,
    autoresFavoritos.length,
  );

  autoresFavoritos.splice(
    indiceSeguro,
    0,
    {
      ...autorRemovido,
    },
  );

  salvarAutoresFavoritos();
  renderizarTudo();

  notificar(
    `"${autorRemovido.nome}" voltou para os autores favoritos.`,
  );
}

function removerAutorFavorito(nome) {
  const nomeNormalizado =
    normalizarTexto(nome);

  const indiceAutor =
    autoresFavoritos.findIndex(
      (autor) =>
        normalizarTexto(autor.nome) ===
        nomeNormalizado,
    );

  if (indiceAutor === -1) {
    return;
  }

  const autorRemovido = {
    ...autoresFavoritos[indiceAutor],
  };

  autoresFavoritos.splice(
    indiceAutor,
    1,
  );

  salvarAutoresFavoritos();
  renderizarTudo();

  notificar(
    `"${autorRemovido.nome}" foi removido dos autores favoritos.`,
    "aviso",
    6000,
    {
      texto: "Desfazer",

      aoClicar: () => {
        restaurarAutorFavorito(
          autorRemovido,
          indiceAutor,
        );
      },
    },
  );
}

function alternarAutorFavorito(nome) {
  if (autorEstaFavoritado(nome)) {
    removerAutorFavorito(nome);
    return;
  }

  adicionarAutorFavorito(nome);
}

/* =========================
   ÁREA DE AUTORES DO LIVRO
========================= */

function criarAreaAutoresLivro(livro) {
  const autores = obterAutoresLivro(livro);

  if (autores.length === 0) {
    return null;
  }

  const area = document.createElement("div");

  area.classList.add("book-authors-area");

  const tituloArea =
    document.createElement("span");

  tituloArea.classList.add(
    "book-authors-label",
  );

  tituloArea.textContent = "Autores:";

  const listaBotoes =
    document.createElement("div");

  listaBotoes.classList.add(
    "book-authors-buttons",
  );

  autores.forEach((nomeAutor) => {
    const botaoAutor =
      document.createElement("button");

    const estaFavoritado =
      autorEstaFavoritado(nomeAutor);

    botaoAutor.type = "button";

    botaoAutor.classList.add(
      "btn-favorite-author",
    );

    botaoAutor.classList.toggle(
      "is-favorite",
      estaFavoritado,
    );

    botaoAutor.textContent =
      estaFavoritado
        ? `★ ${nomeAutor}`
        : `☆ ${nomeAutor}`;

    botaoAutor.setAttribute(
      "aria-pressed",
      String(estaFavoritado),
    );

    botaoAutor.setAttribute(
      "aria-label",
      estaFavoritado
        ? `Remover ${nomeAutor} dos autores favoritos`
        : `Adicionar ${nomeAutor} aos autores favoritos`,
    );

    botaoAutor.addEventListener(
      "click",
      () => {
        alternarAutorFavorito(
          nomeAutor,
        );
      },
    );

    listaBotoes.appendChild(
      botaoAutor,
    );
  });

  area.append(
    tituloArea,
    listaBotoes,
  );

  return area;
}

/* =========================
   LIVROS FAVORITOS
========================= */

function restaurarNosFavoritos(
  livroRemovido,
  indiceAnterior,
) {
  const livroExistente = livros.find(
    (livro) =>
      livro.id === livroRemovido.id,
  );

  if (livroExistente) {
    livroExistente.favorito = true;
  } else {
    const indiceSeguro = Math.min(
      indiceAnterior,
      livros.length,
    );

    livros.splice(
      indiceSeguro,
      0,
      {
        ...livroRemovido,
        favorito: true,
      },
    );
  }

  salvarLivros();
  renderizarTudo();

  notificar(
    `"${livroRemovido.titulo}" voltou para os favoritos.`,
  );
}

function removerDosFavoritos(id) {
  const indiceLivro =
    livros.findIndex(
      (livro) => livro.id === id,
    );

  if (indiceLivro === -1) {
    return;
  }

  const livroRemovido = {
    ...livros[indiceLivro],

    autores: [
      ...obterAutoresLivro(
        livros[indiceLivro],
      ),
    ],
  };

  livros[indiceLivro].favorito =
    false;

  if (
    !livros[indiceLivro].lido &&
    !livros[indiceLivro].planejado
  ) {
    livros.splice(indiceLivro, 1);
  }

  salvarLivros();
  renderizarTudo();

  notificar(
    `"${livroRemovido.titulo}" foi removido dos favoritos.`,
    "aviso",
    6000,
    {
      texto: "Desfazer",

      aoClicar: () => {
        restaurarNosFavoritos(
          livroRemovido,
          indiceLivro,
        );
      },
    },
  );
}

function marcarComoLido(id) {
  const livro = livros.find(
    (item) => item.id === id,
  );

  if (!livro || livro.lido) {
    return;
  }

  livro.lido = true;
  livro.planejado = false;

  salvarLivros();
  renderizarTudo();

  notificar(
    `"${livro.titulo}" foi marcado como lido.`,
  );
}

/* =========================
   CARTÃO DO LIVRO
========================= */

function criarCartaoFavorito(livro) {
  const item =
    document.createElement("li");

  item.classList.add(
    "search-result-card",
  );

  const areaCapa =
    document.createElement("div");

  areaCapa.classList.add(
    "search-result-cover",
  );

  if (livro.capa) {
    const imagem =
      document.createElement("img");

    imagem.src = livro.capa;
    imagem.alt =
      `Capa do livro ${livro.titulo}`;

    imagem.loading = "lazy";

    imagem.addEventListener(
      "error",
      () => {
        areaCapa.innerHTML = "";

        areaCapa.appendChild(
          criarPlaceholderCapa(),
        );
      },
    );

    areaCapa.appendChild(imagem);
  } else {
    areaCapa.appendChild(
      criarPlaceholderCapa(),
    );
  }

  const conteudo =
    document.createElement("div");

  conteudo.classList.add(
    "search-result-content",
  );

  const titulo =
    document.createElement("h3");

  titulo.textContent = livro.titulo;
  titulo.title = livro.titulo;

  const autor =
    document.createElement("p");

  autor.classList.add(
    "search-result-author",
  );

  autor.textContent =
    livro.autor ||
    "Autor não informado";

  const ano =
    document.createElement("span");

  ano.classList.add(
    "search-result-year",
  );

  ano.textContent =
    livro.ano ||
    "Ano não informado";

  conteudo.append(
    titulo,
    autor,
    ano,
  );

  const areaAutores =
    criarAreaAutoresLivro(livro);

  if (areaAutores) {
    conteudo.appendChild(
      areaAutores,
    );
  }

  const acoes =
    document.createElement("div");

  acoes.classList.add(
    "search-result-actions",
  );

  const botaoLido =
    document.createElement("button");

  botaoLido.type = "button";

  botaoLido.classList.add(
    "btn-favorite-mark-read",
  );

  if (livro.lido) {
    botaoLido.textContent =
      "Já está nos lidos";

    botaoLido.disabled = true;
  } else {
    botaoLido.textContent =
      "Marcar como lido";
  }

  botaoLido.setAttribute(
    "aria-label",
    livro.lido
      ? `${livro.titulo} já está nos livros lidos`
      : `Marcar ${livro.titulo} como lido`,
  );

  botaoLido.addEventListener(
    "click",
    () => {
      marcarComoLido(livro.id);
    },
  );

  const botaoRemover =
    document.createElement("button");

  botaoRemover.type = "button";

  botaoRemover.classList.add(
    "btn-remove-favorite",
  );

  botaoRemover.textContent =
    "Remover favorito";

  botaoRemover.setAttribute(
    "aria-label",
    `Remover ${livro.titulo} dos favoritos`,
  );

  botaoRemover.addEventListener(
    "click",
    () => {
      removerDosFavoritos(
        livro.id,
      );
    },
  );

  acoes.append(
    botaoLido,
    botaoRemover,
  );

  conteudo.appendChild(acoes);

  item.append(
    areaCapa,
    conteudo,
  );

  return item;
}

/* =========================
   CONTAGEM DE LIVROS DO AUTOR
========================= */

function contarLivrosDoAutor(nomeAutor) {
  const autorNormalizado =
    normalizarTexto(nomeAutor);

  return livros.filter((livro) => {
    const autores =
      obterAutoresLivro(livro);

    return autores.some(
      (autor) =>
        normalizarTexto(autor) ===
        autorNormalizado,
    );
  }).length;
}

/* =========================
   CARTÃO DO AUTOR
========================= */

function criarCartaoAutor(autor) {
  const item =
    document.createElement("li");

  item.classList.add(
    "author-favorite-card",
  );

  const icone =
    document.createElement("div");

  icone.classList.add(
    "author-favorite-icon",
  );

  icone.textContent = "✍️";
  icone.setAttribute(
    "aria-hidden",
    "true",
  );

  const conteudo =
    document.createElement("div");

  conteudo.classList.add(
    "author-favorite-content",
  );

  const nome =
    document.createElement("h3");

  nome.textContent = autor.nome;

  const classificacao =
    document.createElement("span");

  classificacao.classList.add(
    "author-favorite-label",
  );

  classificacao.textContent =
    "Autor favorito";

  const quantidadeLivros =
    contarLivrosDoAutor(autor.nome);

  const resumo =
    document.createElement("p");

  if (quantidadeLivros === 0) {
    resumo.textContent =
      "Nenhum livro deste autor está salvo na sua biblioteca.";
  } else if (quantidadeLivros === 1) {
    resumo.textContent =
      "1 livro deste autor está salvo na sua biblioteca.";
  } else {
    resumo.textContent =
      `${quantidadeLivros} livros deste autor estão salvos na sua biblioteca.`;
  }

  const acoes =
    document.createElement("div");

  acoes.classList.add(
    "author-favorite-actions",
  );

  const linkPesquisar =
    document.createElement("a");

  const parametros =
    new URLSearchParams({
      tipo: "autor",
      busca: autor.nome,
    });

  linkPesquisar.href =
    `./index.html?${parametros.toString()}`;

  linkPesquisar.classList.add(
    "btn-search-author",
  );

  linkPesquisar.textContent =
    "Pesquisar obras";

  linkPesquisar.setAttribute(
    "aria-label",
    `Pesquisar obras de ${autor.nome}`,
  );

  const botaoRemover =
    document.createElement("button");

  botaoRemover.type = "button";

  botaoRemover.classList.add(
    "btn-remove-author",
  );

  botaoRemover.textContent =
    "Remover favorito";

  botaoRemover.setAttribute(
    "aria-label",
    `Remover ${autor.nome} dos autores favoritos`,
  );

  botaoRemover.addEventListener(
    "click",
    () => {
      removerAutorFavorito(
        autor.nome,
      );
    },
  );

  acoes.append(
    linkPesquisar,
    botaoRemover,
  );

  conteudo.append(
    nome,
    classificacao,
    resumo,
    acoes,
  );

  item.append(
    icone,
    conteudo,
  );

  return item;
}

/* =========================
   RENDERIZAR LIVROS
========================= */

function renderizarFavoritos() {
  if (
    !listaFavoritos ||
    !estadoVazioFavoritos ||
    !statusFavoritos
  ) {
    return;
  }

  listaFavoritos.innerHTML = "";

  const livrosFavoritos =
    livros.filter(
      (livro) =>
        livro.favorito === true,
    );

  livrosFavoritos.forEach(
    (livro) => {
      listaFavoritos.appendChild(
        criarCartaoFavorito(livro),
      );
    },
  );

  const listaEstaVazia =
    livrosFavoritos.length === 0;

  estadoVazioFavoritos.hidden =
    !listaEstaVazia;

  if (contadorAbaLivros) {
    contadorAbaLivros.textContent =
      String(livrosFavoritos.length);
  }

  if (listaEstaVazia) {
    statusFavoritos.textContent =
      "Sua lista de livros favoritos está vazia.";

    return;
  }

  statusFavoritos.textContent =
    livrosFavoritos.length === 1
      ? "Você tem 1 livro favorito."
      : `Você tem ${livrosFavoritos.length} livros favoritos.`;
}

/* =========================
   RENDERIZAR AUTORES
========================= */

function renderizarAutoresFavoritos() {
  if (
    !listaAutoresFavoritos ||
    !estadoVazioAutores ||
    !statusAutoresFavoritos
  ) {
    return;
  }

  listaAutoresFavoritos.innerHTML = "";

  autoresFavoritos.forEach(
    (autor) => {
      listaAutoresFavoritos.appendChild(
        criarCartaoAutor(autor),
      );
    },
  );

  const listaEstaVazia =
    autoresFavoritos.length === 0;

  estadoVazioAutores.hidden =
    !listaEstaVazia;

  if (contadorAbaAutores) {
    contadorAbaAutores.textContent =
      String(autoresFavoritos.length);
  }

  if (listaEstaVazia) {
    statusAutoresFavoritos.textContent =
      "Sua lista de autores favoritos está vazia.";

    return;
  }

  statusAutoresFavoritos.textContent =
    autoresFavoritos.length === 1
      ? "Você tem 1 autor favorito."
      : `Você tem ${autoresFavoritos.length} autores favoritos.`;
}

/* =========================
   RENDERIZAÇÃO GERAL
========================= */

function renderizarTudo() {
  renderizarFavoritos();
  renderizarAutoresFavoritos();
}

/* =========================
   INICIALIZAÇÃO
========================= */

renderizarTudo();

const abaInicial =
  window.location.hash === "#autores"
    ? "autores"
    : "livros";

ativarAba(abaInicial);