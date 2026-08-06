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
   ELEMENTOS
========================= */

const listaLidos = document.querySelector(
  "#lista-lidos",
);

const estadoVazioLidos = document.querySelector(
  "#estado-vazio-lidos",
);

const estadoSemResultadosLidos =
  document.querySelector(
    "#estado-sem-resultados-lidos",
  );

const statusLidos = document.querySelector(
  "#status-lidos",
);

const filtroLidos = document.querySelector(
  "#filtro-lidos",
);

const ordenacaoLidos = document.querySelector(
  "#ordenacao-lidos",
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

function obterAnoNumerico(livro) {
  const anoEncontrado = String(
    livro.ano ?? "",
  ).match(/\d{4}/);

  if (!anoEncontrado) {
    return null;
  }

  return Number(anoEncontrado[0]);
}

function compararTextos(textoA, textoB) {
  return String(textoA ?? "").localeCompare(
    String(textoB ?? ""),
    "pt-BR",
    {
      sensitivity: "base",
    },
  );
}

/* =========================
   ARMAZENAMENTO
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

    return livrosCarregados.map((livro) => ({
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
        Array.isArray(livro.autores)
          ? livro.autores
          : livro.autor
            ? [livro.autor]
            : [],
    }));
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
   FILTRO E ORDENAÇÃO
========================= */

function obterLivrosLidosFiltrados() {
  const livrosLidos = livros.filter(
    (livro) => livro.lido === true,
  );

  const termo = normalizarTexto(
    filtroLidos?.value,
  );

  if (!termo) {
    return livrosLidos;
  }

  return livrosLidos.filter((livro) => {
    const titulo = normalizarTexto(
      livro.titulo,
    );

    const autor = normalizarTexto(
      livro.autor,
    );

    const ano = normalizarTexto(
      livro.ano,
    );

    return (
      titulo.includes(termo) ||
      autor.includes(termo) ||
      ano.includes(termo)
    );
  });
}

function ordenarLivrosLidos(livrosFiltrados) {
  const livrosOrdenados = [
    ...livrosFiltrados,
  ];

  const tipoOrdenacao =
    ordenacaoLidos?.value ?? "recentes";

  const indiceOriginal = new Map();

  livros.forEach((livro, indice) => {
    indiceOriginal.set(livro.id, indice);
  });

  livrosOrdenados.sort((livroA, livroB) => {
    if (tipoOrdenacao === "recentes") {
      return (
        (indiceOriginal.get(livroB.id) ?? 0) -
        (indiceOriginal.get(livroA.id) ?? 0)
      );
    }

    if (tipoOrdenacao === "antigos") {
      return (
        (indiceOriginal.get(livroA.id) ?? 0) -
        (indiceOriginal.get(livroB.id) ?? 0)
      );
    }

    if (tipoOrdenacao === "titulo-az") {
      return compararTextos(
        livroA.titulo,
        livroB.titulo,
      );
    }

    if (tipoOrdenacao === "titulo-za") {
      return compararTextos(
        livroB.titulo,
        livroA.titulo,
      );
    }

    if (tipoOrdenacao === "autor-az") {
      const comparacaoAutor = compararTextos(
        livroA.autor,
        livroB.autor,
      );

      if (comparacaoAutor !== 0) {
        return comparacaoAutor;
      }

      return compararTextos(
        livroA.titulo,
        livroB.titulo,
      );
    }

    if (
      tipoOrdenacao === "ano-recente" ||
      tipoOrdenacao === "ano-antigo"
    ) {
      const anoA = obterAnoNumerico(livroA);
      const anoB = obterAnoNumerico(livroB);

      if (anoA === null && anoB === null) {
        return compararTextos(
          livroA.titulo,
          livroB.titulo,
        );
      }

      if (anoA === null) {
        return 1;
      }

      if (anoB === null) {
        return -1;
      }

      if (tipoOrdenacao === "ano-recente") {
        return anoB - anoA;
      }

      return anoA - anoB;
    }

    return 0;
  });

  return livrosOrdenados;
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
   FAVORITOS
========================= */

function alternarFavorito(id) {
  const livro = livros.find(
    (item) => item.id === id,
  );

  if (!livro) {
    return;
  }

  livro.favorito = !livro.favorito;

  salvarLivros();
  renderizarLidos();

  notificar(
    livro.favorito
      ? `"${livro.titulo}" foi adicionado aos favoritos.`
      : `"${livro.titulo}" foi removido dos favoritos.`,
    livro.favorito
      ? "sucesso"
      : "aviso",
  );
}

/* =========================
   REMOVER COM DESFAZER
========================= */

function restaurarNosLidos(
  livroRemovido,
  indiceAnterior,
) {
  const livroExistente = livros.find(
    (livro) =>
      livro.id === livroRemovido.id,
  );

  if (livroExistente) {
    livroExistente.lido = true;
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
        lido: true,
      },
    );
  }

  salvarLivros();
  renderizarLidos();

  notificar(
    `"${livroRemovido.titulo}" voltou para os livros lidos.`,
  );
}

function removerDosLidos(id) {
  const indiceLivro =
    livros.findIndex(
      (item) => item.id === id,
    );

  if (indiceLivro === -1) {
    return;
  }

  const livroRemovido = {
    ...livros[indiceLivro],
  };

  livros[indiceLivro].lido = false;

  if (
    !livros[indiceLivro].planejado &&
    !livros[indiceLivro].favorito
  ) {
    livros.splice(indiceLivro, 1);
  }

  salvarLivros();
  renderizarLidos();

  notificar(
    `"${livroRemovido.titulo}" foi removido dos livros lidos.`,
    "aviso",
    6000,
    {
      texto: "Desfazer",

      aoClicar: () => {
        restaurarNosLidos(
          livroRemovido,
          indiceLivro,
        );
      },
    },
  );
}

/* =========================
   CARTÃO DO LIVRO
========================= */

function criarCartaoLido(livro) {
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

  const acoes =
    document.createElement("div");

  acoes.classList.add(
    "search-result-actions",
  );

  const botaoFavorito =
    document.createElement("button");

  botaoFavorito.type = "button";

  botaoFavorito.classList.add(
    "btn-favorite-read",
  );

  botaoFavorito.classList.toggle(
    "is-favorite",
    livro.favorito,
  );

  botaoFavorito.textContent =
    livro.favorito
      ? "★ Favoritado"
      : "☆ Favoritar";

  botaoFavorito.setAttribute(
    "aria-pressed",
    String(livro.favorito),
  );

  botaoFavorito.setAttribute(
    "aria-label",
    livro.favorito
      ? `Remover ${livro.titulo} dos favoritos`
      : `Adicionar ${livro.titulo} aos favoritos`,
  );

  botaoFavorito.addEventListener(
    "click",
    () => {
      alternarFavorito(livro.id);
    },
  );

  const botaoRemover =
    document.createElement("button");

  botaoRemover.type = "button";

  botaoRemover.classList.add(
    "btn-remove-read",
  );

  botaoRemover.textContent =
    "Remover dos lidos";

  botaoRemover.setAttribute(
    "aria-label",
    `Remover ${livro.titulo} dos livros lidos`,
  );

  botaoRemover.addEventListener(
    "click",
    () => {
      removerDosLidos(livro.id);
    },
  );

  acoes.append(
    botaoFavorito,
    botaoRemover,
  );

  conteudo.append(
    titulo,
    autor,
    ano,
    acoes,
  );

  item.append(
    areaCapa,
    conteudo,
  );

  return item;
}

/* =========================
   RENDERIZAÇÃO
========================= */

function renderizarLidos() {
  if (
    !listaLidos ||
    !estadoVazioLidos ||
    !estadoSemResultadosLidos ||
    !statusLidos
  ) {
    return;
  }

  listaLidos.innerHTML = "";

  const todosLivrosLidos = livros.filter(
    (livro) => livro.lido === true,
  );

  const livrosFiltrados =
    obterLivrosLidosFiltrados();

  const livrosOrdenados =
    ordenarLivrosLidos(livrosFiltrados);

  livrosOrdenados.forEach((livro) => {
    listaLidos.appendChild(
      criarCartaoLido(livro),
    );
  });

  const totalLivros =
    todosLivrosLidos.length;

  const quantidadeExibida =
    livrosOrdenados.length;

  const termoPesquisa =
    filtroLidos?.value.trim() ?? "";

  const naoTemLivros =
    totalLivros === 0;

  const filtroSemResultados =
    totalLivros > 0 &&
    quantidadeExibida === 0;

  estadoVazioLidos.hidden =
    !naoTemLivros;

  estadoSemResultadosLidos.hidden =
    !filtroSemResultados;

  if (naoTemLivros) {
    statusLidos.textContent =
      "Seu histórico de leitura está vazio.";

    return;
  }

  if (filtroSemResultados) {
    statusLidos.textContent =
      `Nenhum livro foi encontrado para “${termoPesquisa}”.`;

    return;
  }

  if (termoPesquisa) {
    statusLidos.textContent =
      quantidadeExibida === 1
        ? `Mostrando 1 de ${totalLivros} livros lidos.`
        : `Mostrando ${quantidadeExibida} de ${totalLivros} livros lidos.`;

    return;
  }

  statusLidos.textContent =
    totalLivros === 1
      ? "Você já leu 1 livro."
      : `Você já leu ${totalLivros} livros.`;
}

/* =========================
   EVENTOS DOS CONTROLES
========================= */

if (filtroLidos) {
  filtroLidos.addEventListener(
    "input",
    renderizarLidos,
  );

  filtroLidos.addEventListener(
    "search",
    renderizarLidos,
  );
}

if (ordenacaoLidos) {
  ordenacaoLidos.addEventListener(
    "change",
    renderizarLidos,
  );
}

/* =========================
   INICIALIZAÇÃO
========================= */

renderizarLidos();