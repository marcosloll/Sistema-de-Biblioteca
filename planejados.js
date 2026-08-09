/* =========================
   MENU MOBILE
========================= */

const menuButton = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
const linksDoMenu = document.querySelectorAll(".nav-links a");

function fecharMenu() {
  if (!menuButton || !navLinks) {
    return;
  }

  navLinks.classList.remove("is-open");
  menuButton.classList.remove("is-open");
  document.body.classList.remove("menu-open");

  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Abrir menu");
}

if (menuButton && navLinks) {
  menuButton.addEventListener("click", () => {
    const menuEstaAberto = navLinks.classList.toggle("is-open");

    menuButton.classList.toggle("is-open", menuEstaAberto);

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
      menuEstaAberto ? "Fechar menu" : "Abrir menu",
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
  if (typeof window.mostrarNotificacao === "function") {
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

const listaPlanejados = document.querySelector(
  "#lista-planejados",
);

const estadoVazioPlanejados = document.querySelector(
  "#estado-vazio-planejados",
);

const statusPlanejados = document.querySelector(
  "#status-planejados",
);

/* =========================
   ARMAZENAMENTO
========================= */

let livros = carregarLivros();

function carregarLivros() {
  const livrosSalvos = localStorage.getItem("livros");

  if (!livrosSalvos) {
    return [];
  }

  try {
    const livrosCarregados = JSON.parse(livrosSalvos);

    if (!Array.isArray(livrosCarregados)) {
      return [];
    }

    return livrosCarregados.map((livro) => ({
      ...livro,
      googleId: livro.googleId ?? null,
      capa: livro.capa ?? null,
      lido: livro.lido ?? true,
      planejado: livro.planejado ?? false,
      favorito: livro.favorito ?? false,
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
  localStorage.setItem("livros", JSON.stringify(livros));
}

/* =========================
   CAPA SEM IMAGEM
========================= */

function criarPlaceholderCapa() {
  const placeholder = document.createElement("span");

  placeholder.classList.add("cover-placeholder");
  placeholder.textContent = "📖";

  placeholder.setAttribute(
    "aria-label",
    "Livro sem capa disponível",
  );

  return placeholder;
}

/* =========================
   MARCAR COMO LIDO
========================= */

function marcarComoLido(id) {
  const livro = livros.find((item) => item.id === id);

  if (!livro) {
    return;
  }

  livro.lido = true;
  livro.planejado = false;

  salvarLivros();
  renderizarPlanejados();

  notificar(
    `"${livro.titulo}" foi marcado como lido.`,
  );
}

/* =========================
   REMOVER COM DESFAZER
========================= */

function restaurarNosPlanejados(
  livroRemovido,
  indiceAnterior,
) {
  const livroExistente = livros.find(
    (livro) => livro.id === livroRemovido.id,
  );

  if (livroExistente) {
    livroExistente.planejado = true;
  } else {
    const indiceSeguro = Math.min(
      indiceAnterior,
      livros.length,
    );

    livros.splice(indiceSeguro, 0, {
      ...livroRemovido,
      planejado: true,
    });
  }

  salvarLivros();
  renderizarPlanejados();

  notificar(
    `"${livroRemovido.titulo}" voltou para a lista Quero ler.`,
  );
}

function removerDosPlanejados(id) {
  const indiceLivro = livros.findIndex(
    (item) => item.id === id,
  );

  if (indiceLivro === -1) {
    return;
  }

  const livroRemovido = {
    ...livros[indiceLivro],
  };

  livros[indiceLivro].planejado = false;

  if (
    !livros[indiceLivro].lido &&
    !livros[indiceLivro].favorito
  ) {
    livros.splice(indiceLivro, 1);
  }

  salvarLivros();
  renderizarPlanejados();

  notificar(
    `"${livroRemovido.titulo}" foi removido da lista Quero ler.`,
    "aviso",
    6000,
    {
      texto: "Desfazer",

      aoClicar: () => {
        restaurarNosPlanejados(
          livroRemovido,
          indiceLivro,
        );
      },
    },
  );
}

/* =========================
   CARTÃO
========================= */

function criarCartaoPlanejado(livro) {
  const item = document.createElement("li");
  item.classList.add("search-result-card");

  const areaCapa = document.createElement("div");
  areaCapa.classList.add("search-result-cover");

  if (livro.capa) {
    const imagem = document.createElement("img");

    imagem.src = livro.capa;
    imagem.alt = `Capa do livro ${livro.titulo}`;
    imagem.loading = "lazy";

    imagem.addEventListener("error", () => {
      areaCapa.innerHTML = "";
      areaCapa.appendChild(criarPlaceholderCapa());
    });

    areaCapa.appendChild(imagem);
  } else {
    areaCapa.appendChild(criarPlaceholderCapa());
  }

  const conteudo = document.createElement("div");
  conteudo.classList.add("search-result-content");

  const titulo = document.createElement("h3");
  titulo.textContent = livro.titulo;
  titulo.title = livro.titulo;

  const autor = document.createElement("p");
  autor.classList.add("search-result-author");
  autor.textContent = livro.autor;

  const ano = document.createElement("span");
  ano.classList.add("search-result-year");
  ano.textContent = livro.ano || "Ano não informado";

  const acoes = document.createElement("div");
  acoes.classList.add("search-result-actions");

  const botaoLido = document.createElement("button");

  botaoLido.type = "button";
  botaoLido.classList.add("btn-mark-read");
  botaoLido.textContent = "Marcar como lido";

  botaoLido.setAttribute(
    "aria-label",
    `Marcar ${livro.titulo} como lido`,
  );

  botaoLido.addEventListener("click", () => {
    marcarComoLido(livro.id);
  });

  const botaoRemover = document.createElement("button");

  botaoRemover.type = "button";
  botaoRemover.classList.add("btn-remove-plan");
  botaoRemover.textContent = "Remover";

  botaoRemover.setAttribute(
    "aria-label",
    `Remover ${livro.titulo} da lista Quero ler`,
  );

  botaoRemover.addEventListener("click", () => {
    removerDosPlanejados(livro.id);
  });

  acoes.append(botaoLido, botaoRemover);
  conteudo.append(titulo, autor, ano, acoes);
  item.append(areaCapa, conteudo);

  return item;
}

/* =========================
   RENDERIZAÇÃO
========================= */

function renderizarPlanejados() {
  if (
    !listaPlanejados ||
    !estadoVazioPlanejados ||
    !statusPlanejados
  ) {
    return;
  }

  listaPlanejados.innerHTML = "";

  const livrosPlanejados = livros.filter(
    (livro) => livro.planejado === true,
  );

  livrosPlanejados.forEach((livro) => {
    listaPlanejados.appendChild(
      criarCartaoPlanejado(livro),
    );
  });

  const listaEstaVazia = livrosPlanejados.length === 0;

  estadoVazioPlanejados.hidden = !listaEstaVazia;

  if (listaEstaVazia) {
    statusPlanejados.textContent =
      "Sua lista de leitura está vazia.";

    return;
  }

  statusPlanejados.textContent =
    livrosPlanejados.length === 1
      ? "Você tem 1 livro para ler."
      : `Você tem ${livrosPlanejados.length} livros para ler.`;
}

/* =========================
   INICIALIZAÇÃO
========================= */

renderizarPlanejados();