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
    document.body.classList.toggle("menu-open", menuEstaAberto);

    menuButton.setAttribute("aria-expanded", String(menuEstaAberto));

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

function notificar(mensagem, tipo = "sucesso", duracao = 3500, acao = null) {
  if (typeof window.mostrarNotificacao === "function") {
    window.mostrarNotificacao(mensagem, tipo, duracao, acao);
  }
}

/* =========================
   ELEMENTOS DA PESQUISA
========================= */

const formularioPesquisa = document.querySelector("#pesquisa-form");

const tipoPesquisa = document.querySelector("#tipo-pesquisa");

const avisoFontePesquisa = document.querySelector("#aviso-fonte-pesquisa");

const fonteResultadosLabel =
  document.querySelector("#fonte-resultados-label") ??
  document.querySelector("#resultados-pesquisa .section-label");

const inputPesquisa = document.querySelector("#pesquisa-titulo");

const botaoPesquisar = document.querySelector("#btn-pesquisar");

const secaoResultados = document.querySelector("#resultados-pesquisa");

const listaResultados = document.querySelector("#lista-resultados");

const statusPesquisa = document.querySelector("#status-pesquisa");

const paginacaoPesquisa = document.querySelector("#paginacao-pesquisa");

const resumoPaginacao = document.querySelector("#resumo-paginacao");

const botoesPaginacao = document.querySelector("#botoes-paginacao");

const apiKey = window.GOOGLE_BOOKS_API_KEY;

/* =========================
   ELEMENTOS DOS LIVROS
========================= */

const formularioAdicionar = document.querySelector("#adicionar-form");

const inputTitulo = document.querySelector("#titulo");
const inputAutor = document.querySelector("#autor");
const inputAno = document.querySelector("#ano");

const botaoAdicionar = document.querySelector("#btn-adicionar");

const listaLivros = document.querySelector("#lista-livros");
const estadoVazio = document.querySelector("#estado-vazio");

/* =========================
   ESTADO DA APLICAÇÃO
========================= */

const RESULTADOS_POR_PAGINA = 8;

let livros = [];
let autoresFavoritos = carregarAutoresFavoritos();
let livroEmEdicao = null;
let ultimosResultadosPesquisa = [];

let consultaPesquisaAtual = "";
let termoPesquisaAtual = "";
let nomeTipoPesquisaAtual = "";
let paginaPesquisaAtual = 1;
let totalResultadosPesquisa = 0;
let totalPaginasPesquisa = 0;
let controladorPesquisa = null;

/* =========================
   AUTORES NO LOCAL STORAGE
========================= */

function carregarAutoresFavoritos() {
  const autoresSalvos = localStorage.getItem("autoresFavoritos");

  if (!autoresSalvos) {
    return [];
  }

  try {
    const autoresCarregados = JSON.parse(autoresSalvos);

    if (!Array.isArray(autoresCarregados)) {
      return [];
    }

    const autoresUnicos = new Map();

    autoresCarregados.forEach((autor) => {
      const nomeOriginal =
        typeof autor === "string"
          ? autor.trim()
          : String(autor?.nome ?? "").trim();

      const nomesSeparados = separarNomesAutores(nomeOriginal);

      nomesSeparados.forEach((nome) => {
        const nomeNormalizado = normalizarTexto(nome);

        if (!nome || !nomeNormalizado) {
          return;
        }

        if (!autoresUnicos.has(nomeNormalizado)) {
          autoresUnicos.set(nomeNormalizado, {
            id: gerarIdAutor(nome),
            nome,
          });
        }
      });
    });

    return [...autoresUnicos.values()];
  } catch (erro) {
    console.error("Não foi possível carregar os autores favoritos:", erro);

    return [];
  }
}

function salvarAutoresFavoritos() {
  localStorage.setItem("autoresFavoritos", JSON.stringify(autoresFavoritos));
}

/* =========================
   FUNÇÕES AUXILIARES
========================= */

function gerarId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizarTexto(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function normalizarUrlCapa(valor) {
  const url = String(valor ?? "").trim();

  if (!url) {
    return null;
  }

  return url.replace(/^http:/i, "https:");
}

function separarNomesAutores(valor) {
  const valores = Array.isArray(valor) ? valor : [valor];

  const autoresUnicos = new Map();

  valores.forEach((item) => {
    String(item ?? "")
      .split(/\s*(?:,|;|\s+&\s+)\s*/u)
      .map((nome) => nome.trim())
      .filter(Boolean)
      .forEach((nome) => {
        const nomeNormalizado = normalizarTexto(nome);

        if (!nomeNormalizado || nomeNormalizado === "autor nao informado") {
          return;
        }

        if (!autoresUnicos.has(nomeNormalizado)) {
          autoresUnicos.set(nomeNormalizado, nome);
        }
      });
  });

  return [...autoresUnicos.values()];
}

function gerarIdAutor(nome) {
  const idNormalizado = normalizarTexto(nome)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (idNormalizado) {
    return idNormalizado;
  }

  return gerarId();
}

function obterAutoresLivro(livro) {
  const autoresOriginais =
    Array.isArray(livro?.autores) && livro.autores.length > 0
      ? livro.autores
      : livro?.autor
        ? [livro.autor]
        : [];

  return separarNomesAutores(autoresOriginais);
}

function extrairAno(dataPublicacao) {
  if (!dataPublicacao) {
    return "Ano não informado";
  }

  const anoEncontrado = String(dataPublicacao).match(/\d{4}/);

  return anoEncontrado ? anoEncontrado[0] : "Ano não informado";
}

function montarConsultaPesquisa(termo, tipo) {
  const termoLimpo = String(termo ?? "")
    .replaceAll('"', "")
    .trim();

  if (tipo === "titulo") {
    return `intitle:"${termoLimpo}"`;
  }

  if (tipo === "autor") {
    return `inauthor:"${termoLimpo}"`;
  }

  return termoLimpo;
}

function obterNomeTipoPesquisa(tipo) {
  if (tipo === "titulo") {
    return "por título";
  }

  if (tipo === "autor") {
    return "por autor";
  }

  return "na busca geral";
}

function encontrarLivroCadastrado(
  idExterno,
  titulo,
  autor,
  fonte = "google-books",
  tipo = "livro",
) {
  return livros.find((livro) => {
    const fonteLivro =
      livro.fonte ?? (livro.googleId ? "google-books" : "manual");

    const tipoLivro = livro.tipo ?? "livro";

    const idLivro = livro.idExterno ?? livro.googleId ?? null;

    if (
      idExterno &&
      idLivro &&
      fonteLivro === fonte &&
      String(idLivro) === String(idExterno)
    ) {
      return true;
    }

    const mesmoTitulo =
      normalizarTexto(livro.titulo) === normalizarTexto(titulo);

    const mesmoAutor = normalizarTexto(livro.autor) === normalizarTexto(autor);

    return mesmoTitulo && mesmoAutor && tipoLivro === tipo;
  });
}

/* =========================
   CAMPO DE PESQUISA
========================= */

function atualizarPlaceholderPesquisa() {
  if (!tipoPesquisa || !inputPesquisa) {
    return;
  }

  const tipo = tipoPesquisa.value;

  if (tipo === "titulo") {
    inputPesquisa.placeholder = "Digite o título do livro";
    inputPesquisa.setAttribute(
      "aria-label",
      "Título do livro que deseja pesquisar",
    );
    return;
  }

  if (tipo === "autor") {
    inputPesquisa.placeholder = "Digite o nome do autor";
    inputPesquisa.setAttribute(
      "aria-label",
      "Nome do autor que deseja pesquisar",
    );
    return;
  }

  inputPesquisa.placeholder = "Digite o título, autor ou termo";
  inputPesquisa.setAttribute("aria-label", "Termo que deseja pesquisar");
}

function atualizarInterfacePesquisa() {
  if (avisoFontePesquisa) {
    avisoFontePesquisa.textContent =
      "Livros são pesquisados no Google Books. Mangás e quadrinhos são filtrados desta busca.";
  }

  atualizarPlaceholderPesquisa();
}

if (tipoPesquisa && inputPesquisa) {
  tipoPesquisa.addEventListener("change", () => {
    atualizarPlaceholderPesquisa();
    inputPesquisa.focus();
  });
}

/* =========================
   ATUALIZAR RESULTADOS
========================= */

function atualizarResultadosAtuais() {
  if (ultimosResultadosPesquisa.length === 0) {
    return;
  }

  renderizarResultadosPesquisa(ultimosResultadosPesquisa);
}

function atualizarInterfaceAutores() {
  atualizarResultadosAtuais();
  renderizarLivros();
}

function encontrarAutorFavorito(nome) {
  const nomeNormalizado = normalizarTexto(nome);

  return autoresFavoritos.find(
    (autor) => normalizarTexto(autor.nome) === nomeNormalizado,
  );
}

function autorEstaFavoritado(nome) {
  return Boolean(encontrarAutorFavorito(nome));
}

function adicionarAutorFavorito(nome) {
  const nomeLimpo = String(nome ?? "").trim();

  if (!nomeLimpo || autorEstaFavoritado(nomeLimpo)) {
    return;
  }

  autoresFavoritos.push({
    id: gerarIdAutor(nomeLimpo),
    nome: nomeLimpo,
  });

  salvarAutoresFavoritos();
  atualizarInterfaceAutores();

  notificar(`"${nomeLimpo}" foi adicionado aos autores favoritos.`);
}

function restaurarAutorFavorito(autorRemovido, indiceAnterior) {
  if (autorEstaFavoritado(autorRemovido.nome)) {
    return;
  }

  const indiceSeguro = Math.min(indiceAnterior, autoresFavoritos.length);

  autoresFavoritos.splice(indiceSeguro, 0, {
    ...autorRemovido,
  });

  salvarAutoresFavoritos();
  atualizarInterfaceAutores();

  notificar(`"${autorRemovido.nome}" voltou para os autores favoritos.`);
}

function removerAutorFavorito(nome) {
  const nomeNormalizado = normalizarTexto(nome);

  const indiceAutor = autoresFavoritos.findIndex(
    (autor) => normalizarTexto(autor.nome) === nomeNormalizado,
  );

  if (indiceAutor === -1) {
    return;
  }

  const autorRemovido = {
    ...autoresFavoritos[indiceAutor],
  };

  autoresFavoritos.splice(indiceAutor, 1);

  salvarAutoresFavoritos();
  atualizarInterfaceAutores();

  notificar(
    `"${autorRemovido.nome}" foi removido dos autores favoritos.`,
    "aviso",
    6000,
    {
      texto: "Desfazer",
      aoClicar: () => {
        restaurarAutorFavorito(autorRemovido, indiceAutor);
      },
    },
  );
}

async function adicionarLivro(
  titulo,
  autor,
  ano,
  googleId = null,
  capa = null,
  destino = "lido",
  autores = [],
  metadados = {},
) {
  const fonte = metadados.fonte ?? (googleId ? "google-books" : "manual");

  const tipo = metadados.tipo ?? "livro";

  const idExterno = metadados.idExterno ?? googleId ?? null;

  const livroExistente = encontrarLivroCadastrado(
    idExterno,
    titulo,
    autor,
    fonte,
    tipo,
  );

  const capaSegura = normalizarUrlCapa(capa);

  const autoresNormalizados = obterAutoresLivro({
    autor,
    autores,
  });

  if (livroExistente) {
    livroExistente.fonte = fonte;
    livroExistente.tipo = tipo;
    livroExistente.idExterno = idExterno ?? livroExistente.idExterno ?? null;

    livroExistente.googleId =
      fonte === "google-books"
        ? (idExterno ?? livroExistente.googleId ?? null)
        : (livroExistente.googleId ?? null);

    livroExistente.titulo = titulo;
    livroExistente.autor = autor;
    livroExistente.autores = autoresNormalizados;
    livroExistente.ano = ano;

    livroExistente.capa = capaSegura ?? livroExistente.capa ?? null;

    if (destino === "lido") {
      livroExistente.lido = true;
      livroExistente.planejado = false;
    }

    if (destino === "planejado") {
      livroExistente.lido = false;
      livroExistente.planejado = true;
    }
    await atualizarStatusLivro(livroExistente);
  } else {
    const novoLivro = {
      fonte,
      tipo,
      idExterno,
      googleId: fonte === "google-books" ? idExterno : null,
      titulo,
      autor,
      autores: autoresNormalizados,
      ano,
      capa: capaSegura,
      lido: destino === "lido",
      planejado: destino === "planejado",
      favorito: false,
    };

    await adicionarLivroNoBanco(novoLivro);
    livros.push(novoLivro);
  }

  renderizarLivros();
  atualizarResultadosAtuais();
}

/* =========================
   CAPA SEM IMAGEM
========================= */

function criarPlaceholderCapa() {
  const placeholder = document.createElement("span");

  placeholder.classList.add("cover-placeholder");
  placeholder.textContent = "📖";
  placeholder.setAttribute("aria-label", "Livro sem capa disponível");

  return placeholder;
}

function criarAreaAutoresLivro(livro) {
  const autores = obterAutoresLivro(livro);

  if (autores.length === 0) {
    return null;
  }

  const area = document.createElement("div");
  area.classList.add("book-authors-area");

  const tituloArea = document.createElement("span");
  tituloArea.classList.add("book-authors-label");
  tituloArea.textContent = autores.length === 1 ? "Autor:" : "Autores:";

  const listaBotoes = document.createElement("div");
  listaBotoes.classList.add("book-authors-buttons");

  autores.forEach((nomeAutor) => {
    const botaoAutor = document.createElement("button");
    const estaFavoritado = autorEstaFavoritado(nomeAutor);

    botaoAutor.type = "button";
    botaoAutor.classList.add("btn-favorite-author");

    botaoAutor.classList.toggle("is-favorite", estaFavoritado);

    botaoAutor.textContent = estaFavoritado
      ? `★ ${nomeAutor}`
      : `☆ ${nomeAutor}`;

    botaoAutor.setAttribute("aria-pressed", String(estaFavoritado));

    botaoAutor.setAttribute(
      "aria-label",
      estaFavoritado
        ? `Remover ${nomeAutor} dos autores favoritos`
        : `Adicionar ${nomeAutor} aos autores favoritos`,
    );

    botaoAutor.addEventListener("click", () => {
      alternarAutorFavorito(nomeAutor);
    });

    listaBotoes.appendChild(botaoAutor);
  });

  area.append(tituloArea, listaBotoes);

  return area;
}

/* =========================
   RESULTADOS DO GOOGLE BOOKS
========================= */

const CATEGORIAS_QUADRINHOS = [
  "manga",
  "mangas",
  "comic",
  "comics",
  "graphic novel",
  "graphic novels",
  "quadrinho",
  "quadrinhos",
  "historias em quadrinhos",
  "histórias em quadrinhos",
  "manhwa",
  "manhua",
];

function volumePareceMangaOuQuadrinho(volume) {
  const categorias = volume?.volumeInfo?.categories ?? [];
  const textoCategorias = normalizarTexto(categorias.join(" "));

  return CATEGORIAS_QUADRINHOS.some((categoria) =>
    textoCategorias.includes(normalizarTexto(categoria)),
  );
}

function normalizarResultadoGoogle(volume) {
  const informacoes = volume?.volumeInfo ?? {};

  const autores = Array.isArray(informacoes.authors)
    ? informacoes.authors
        .map((nome) => String(nome ?? "").trim())
        .filter(Boolean)
    : [];

  return {
    fonte: "google-books",
    tipo: "livro",
    idExterno: volume?.id ?? null,
    titulo: informacoes.title ?? "Título não informado",
    autor: autores.length ? autores.join(", ") : "Autor não informado",
    autores,
    ano: extrairAno(informacoes.publishedDate),
    capa:
      informacoes.imageLinks?.thumbnail ??
      informacoes.imageLinks?.smallThumbnail ??
      null,
    detalhes: [],
    descricao: null,
    url: informacoes.infoLink ?? null,
  };
}

function criarCartaoResultado(resultado) {
  const item = document.createElement("li");
  item.classList.add("search-result-card");

  const areaCapa = document.createElement("div");
  areaCapa.classList.add("search-result-cover");

  if (resultado.capa) {
    const imagem = document.createElement("img");

    imagem.src = normalizarUrlCapa(resultado.capa);

    imagem.alt = `Capa de ${resultado.titulo}`;
    imagem.loading = "lazy";

    imagem.addEventListener("error", () => {
      areaCapa.innerHTML = "";
      areaCapa.appendChild(criarPlaceholderCapa(resultado.tipo));
    });

    areaCapa.appendChild(imagem);
  } else {
    areaCapa.appendChild(criarPlaceholderCapa(resultado.tipo));
  }

  const conteudo = document.createElement("div");
  conteudo.classList.add("search-result-content");

  const fonteBadge = document.createElement("span");
  fonteBadge.classList.add("result-source-badge");
  fonteBadge.textContent = "Google Books · Livro";

  const elementoTitulo = document.createElement("h3");
  elementoTitulo.textContent = resultado.titulo;
  elementoTitulo.title = resultado.titulo;

  const elementoAutor = document.createElement("p");
  elementoAutor.classList.add("search-result-author");
  elementoAutor.textContent = resultado.autor;

  const metadados = document.createElement("div");
  metadados.classList.add("search-result-metadata");

  const elementoAno = document.createElement("span");
  elementoAno.classList.add("search-result-year");
  elementoAno.textContent = resultado.ano;
  metadados.appendChild(elementoAno);

  resultado.detalhes.forEach((detalhe) => {
    const badge = document.createElement("span");
    badge.classList.add("search-result-detail");
    badge.textContent = detalhe;
    metadados.appendChild(badge);
  });

  conteudo.append(fonteBadge, elementoTitulo, elementoAutor, metadados);

  if (resultado.descricao) {
    const descricao = document.createElement("p");
    descricao.classList.add("search-result-summary");
    descricao.textContent = resultado.descricao;
    conteudo.appendChild(descricao);
  }

  if (resultado.fonte === "google-books" && resultado.autores.length > 0) {
    const areaAutores = criarAreaAutoresLivro(resultado);

    if (areaAutores) {
      conteudo.appendChild(areaAutores);
    }
  }

  const acoes = document.createElement("div");
  acoes.classList.add("search-result-actions");

  const botaoAdicionarLidos = document.createElement("button");

  botaoAdicionarLidos.type = "button";
  botaoAdicionarLidos.classList.add("btn-add-result");

  const botaoPlanejarLeitura = document.createElement("button");

  botaoPlanejarLeitura.type = "button";
  botaoPlanejarLeitura.classList.add("btn-plan-result");

  const livroCadastrado = encontrarLivroCadastrado(
    resultado.idExterno,
    resultado.titulo,
    resultado.autor,
    resultado.fonte,
    resultado.tipo,
  );

  const estaNosLidos = livroCadastrado?.lido === true;
  const estaPlanejado = livroCadastrado?.planejado === true;

  botaoAdicionarLidos.textContent = estaNosLidos
    ? "Já está nos lidos"
    : "Adicionar aos lidos";

  botaoAdicionarLidos.disabled = estaNosLidos;

  botaoPlanejarLeitura.textContent = estaPlanejado
    ? "Leitura planejada"
    : "Quero ler";

  botaoPlanejarLeitura.disabled = estaPlanejado;

  const nomeItem = "livro";

  botaoAdicionarLidos.setAttribute(
    "aria-label",
    estaNosLidos
      ? `${resultado.titulo} já está nos lidos`
      : `Adicionar o ${nomeItem} ${resultado.titulo} aos lidos`,
  );

  botaoPlanejarLeitura.setAttribute(
    "aria-label",
    estaPlanejado
      ? `${resultado.titulo} já está na lista Quero ler`
      : `Adicionar o ${nomeItem} ${resultado.titulo} à lista Quero ler`,
  );

  const salvarResultado = (destino) => {
    adicionarLivro(
      resultado.titulo,
      resultado.autor,
      resultado.ano,
      resultado.fonte === "google-books" ? resultado.idExterno : null,
      resultado.capa,
      destino,
      resultado.autores,
      {
        fonte: resultado.fonte,
        tipo: resultado.tipo,
        idExterno: resultado.idExterno,
      },
    );
  };

  botaoAdicionarLidos.addEventListener("click", () => {
    salvarResultado("lido");

    notificar(`"${resultado.titulo}" foi adicionado aos lidos.`);

    if (statusPesquisa) {
      statusPesquisa.textContent = `"${resultado.titulo}" foi adicionado aos lidos.`;
    }
  });

  botaoPlanejarLeitura.addEventListener("click", () => {
    salvarResultado("planejado");

    notificar(`"${resultado.titulo}" foi adicionado à lista Quero ler.`);

    if (statusPesquisa) {
      statusPesquisa.textContent = `"${resultado.titulo}" foi adicionado à lista Quero ler.`;
    }
  });

  acoes.append(botaoAdicionarLidos, botaoPlanejarLeitura);

  if (resultado.url) {
    const linkExterno = document.createElement("a");
    linkExterno.classList.add("search-result-link");
    linkExterno.href = resultado.url;
    linkExterno.target = "_blank";
    linkExterno.rel = "noopener noreferrer";

    linkExterno.textContent = "Mais informações";

    acoes.appendChild(linkExterno);
  }

  conteudo.appendChild(acoes);
  item.append(areaCapa, conteudo);

  return item;
}

function renderizarResultadosPesquisa(resultados) {
  if (!listaResultados) {
    return;
  }

  listaResultados.innerHTML = "";

  resultados.forEach((resultado) => {
    listaResultados.appendChild(criarCartaoResultado(resultado));
  });
}

/* =========================
   PAGINAÇÃO DA PESQUISA
========================= */

function criarBotaoPaginacao({
  texto,
  pagina,
  ariaLabel,
  ativo = false,
  desabilitado = false,
}) {
  const botao = document.createElement("button");

  botao.type = "button";
  botao.classList.add("pagination-button");
  botao.textContent = texto;
  botao.disabled = desabilitado;

  if (ariaLabel) {
    botao.setAttribute("aria-label", ariaLabel);
  }

  if (ativo) {
    botao.classList.add("is-current");
    botao.setAttribute("aria-current", "page");
  }

  if (!ativo && !desabilitado) {
    botao.addEventListener("click", () => {
      carregarPaginaPesquisa(pagina, true);
    });
  }

  return botao;
}

function obterItensPaginacao(paginaAtual, totalPaginas) {
  if (totalPaginas <= 7) {
    return Array.from({ length: totalPaginas }, (_, indice) => indice + 1);
  }

  if (paginaAtual <= 4) {
    return [1, 2, 3, 4, 5, "fim", totalPaginas];
  }

  if (paginaAtual >= totalPaginas - 3) {
    return [
      1,
      "inicio",
      totalPaginas - 4,
      totalPaginas - 3,
      totalPaginas - 2,
      totalPaginas - 1,
      totalPaginas,
    ];
  }

  return [
    1,
    "inicio",
    paginaAtual - 1,
    paginaAtual,
    paginaAtual + 1,
    "fim",
    totalPaginas,
  ];
}

function renderizarPaginacao() {
  if (!paginacaoPesquisa || !resumoPaginacao || !botoesPaginacao) {
    return;
  }

  botoesPaginacao.innerHTML = "";

  if (totalResultadosPesquisa === 0 || totalPaginasPesquisa === 0) {
    paginacaoPesquisa.hidden = true;
    resumoPaginacao.textContent = "";
    return;
  }

  const primeiroResultado =
    (paginaPesquisaAtual - 1) * RESULTADOS_POR_PAGINA + 1;

  const ultimoResultado = Math.min(
    primeiroResultado + ultimosResultadosPesquisa.length - 1,
    totalResultadosPesquisa,
  );

  resumoPaginacao.textContent =
    `Mostrando ${primeiroResultado}–${ultimoResultado} de ` +
    `${totalResultadosPesquisa} resultados. ` +
    `Página ${paginaPesquisaAtual} de ${totalPaginasPesquisa}.`;

  const botaoAnterior = criarBotaoPaginacao({
    texto: "‹ Anterior",
    pagina: paginaPesquisaAtual - 1,
    ariaLabel: "Ir para a página anterior",
    desabilitado: paginaPesquisaAtual === 1,
  });

  botoesPaginacao.appendChild(botaoAnterior);

  const itensPaginacao = obterItensPaginacao(
    paginaPesquisaAtual,
    totalPaginasPesquisa,
  );

  itensPaginacao.forEach((item) => {
    if (typeof item === "string") {
      const reticencias = document.createElement("span");

      reticencias.classList.add("pagination-ellipsis");
      reticencias.textContent = "…";
      reticencias.setAttribute("aria-hidden", "true");

      botoesPaginacao.appendChild(reticencias);
      return;
    }

    const botaoPagina = criarBotaoPaginacao({
      texto: String(item),
      pagina: item,
      ariaLabel: `Ir para a página ${item}`,
      ativo: item === paginaPesquisaAtual,
    });

    botoesPaginacao.appendChild(botaoPagina);
  });

  const botaoProxima = criarBotaoPaginacao({
    texto: "Próxima ›",
    pagina: paginaPesquisaAtual + 1,
    ariaLabel: "Ir para a próxima página",
    desabilitado: paginaPesquisaAtual === totalPaginasPesquisa,
  });

  botoesPaginacao.appendChild(botaoProxima);
  paginacaoPesquisa.hidden = false;
}

/* =========================
   GOOGLE BOOKS
========================= */

async function pesquisarLivros(consulta, pagina, sinal) {
  if (!apiKey) {
    throw new Error("A chave da Google Books API não foi carregada.");
  }

  const indiceInicial = (pagina - 1) * RESULTADOS_POR_PAGINA;

  const parametros = new URLSearchParams({
    q: consulta,
    startIndex: String(indiceInicial),
    maxResults: String(RESULTADOS_POR_PAGINA),
    printType: "books",
    langRestrict: "pt",
    orderBy: "relevance",
    key: apiKey,
  });

  const resposta = await fetch(
    `https://www.googleapis.com/books/v1/volumes?${parametros}`,
    { signal: sinal },
  );

  if (!resposta.ok) {
    let mensagemErro = `Erro ${resposta.status} ao pesquisar livros.`;

    try {
      const detalhesErro = await resposta.json();

      if (detalhesErro.error?.message) {
        mensagemErro = detalhesErro.error.message;
      }
    } catch {
      // Mantém a mensagem padrão.
    }

    throw new Error(mensagemErro);
  }

  return resposta.json();
}

async function carregarPaginaPesquisa(pagina, rolarAteResultados = false) {
  if (
    !consultaPesquisaAtual ||
    !secaoResultados ||
    !listaResultados ||
    !statusPesquisa ||
    !botaoPesquisar
  ) {
    return;
  }

  if (controladorPesquisa) {
    controladorPesquisa.abort();
  }

  const controladorAtual = new AbortController();
  controladorPesquisa = controladorAtual;

  const paginaSolicitada = Math.max(1, pagina);

  secaoResultados.hidden = false;
  listaResultados.innerHTML = "";

  if (paginacaoPesquisa) {
    paginacaoPesquisa.hidden = true;
  }

  if (fonteResultadosLabel) {
    fonteResultadosLabel.textContent = "Google Books · somente livros";
  }

  statusPesquisa.textContent =
    `Carregando a página ${paginaSolicitada} ` +
    `${nomeTipoPesquisaAtual} para “${termoPesquisaAtual}”...`;

  botaoPesquisar.disabled = true;
  botaoPesquisar.textContent = "Pesquisando...";

  try {
    const dados = await pesquisarLivros(
      consultaPesquisaAtual,
      paginaSolicitada,
      controladorAtual.signal,
    );

    const resultadosRecebidos = dados.items ?? [];

    const resultadosSomenteLivros = resultadosRecebidos.filter(
      (volume) => !volumePareceMangaOuQuadrinho(volume),
    );

    const quantidadeOcultada =
      resultadosRecebidos.length - resultadosSomenteLivros.length;

    const resultados = resultadosSomenteLivros.map(normalizarResultadoGoogle);

    totalResultadosPesquisa = Number(dados.totalItems) || 0;

    totalPaginasPesquisa = Math.ceil(
      totalResultadosPesquisa / RESULTADOS_POR_PAGINA,
    );

    paginaPesquisaAtual = paginaSolicitada;
    ultimosResultadosPesquisa = resultados;

    renderizarResultadosPesquisa(resultados);
    renderizarPaginacao();

    if (resultados.length === 0) {
      statusPesquisa.textContent =
        quantidadeOcultada > 0
          ? `Os ${quantidadeOcultada} resultados desta página foram ocultados porque parecem mangás ou quadrinhos.`
          : paginaSolicitada === 1
            ? `Nenhum livro foi encontrado ${nomeTipoPesquisaAtual} para “${termoPesquisaAtual}”.`
            : "Não há resultados disponíveis nesta página.";
    } else {
      const primeiroResultado =
        (paginaPesquisaAtual - 1) * RESULTADOS_POR_PAGINA + 1;

      const ultimoResultado = primeiroResultado + resultados.length - 1;

      const avisoOcultos = quantidadeOcultada
        ? ` ${quantidadeOcultada} quadrinho(s) ou mangá(s) foram ocultados nesta página.`
        : "";

      statusPesquisa.textContent =
        `Resultados ${primeiroResultado}–${ultimoResultado} ` +
        `de ${totalResultadosPesquisa} encontrados ` +
        `${nomeTipoPesquisaAtual} para “${termoPesquisaAtual}”.` +
        avisoOcultos;
    }

    if (rolarAteResultados) {
      secaoResultados.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  } catch (erro) {
    if (erro.name === "AbortError") {
      return;
    }

    console.error("Erro na pesquisa:", erro);

    ultimosResultadosPesquisa = [];
    totalResultadosPesquisa = 0;
    totalPaginasPesquisa = 0;

    listaResultados.innerHTML = "";
    renderizarPaginacao();

    statusPesquisa.textContent = `Erro na pesquisa: ${erro.message}`;

    notificar("Não foi possível pesquisar os livros.", "erro");
  } finally {
    if (controladorPesquisa === controladorAtual) {
      botaoPesquisar.disabled = false;
      botaoPesquisar.textContent = "Pesquisar";
      controladorPesquisa = null;
    }
  }
}

/* =========================
   ENVIO DA PESQUISA
========================= */

if (
  formularioPesquisa &&
  tipoPesquisa &&
  inputPesquisa &&
  botaoPesquisar &&
  secaoResultados &&
  listaResultados &&
  statusPesquisa
) {
  formularioPesquisa.addEventListener("submit", async (event) => {
    event.preventDefault();

    const termo = inputPesquisa.value.trim();

    if (!termo) {
      inputPesquisa.focus();
      return;
    }

    const tipo = tipoPesquisa.value;

    consultaPesquisaAtual = montarConsultaPesquisa(termo, tipo);

    termoPesquisaAtual = termo;
    nomeTipoPesquisaAtual = obterNomeTipoPesquisa(tipo);

    paginaPesquisaAtual = 1;
    totalResultadosPesquisa = 0;
    totalPaginasPesquisa = 0;
    ultimosResultadosPesquisa = [];

    await carregarPaginaPesquisa(1, false);
  });
}

/* =========================
   CARTÃO DOS LIVROS LIDOS
========================= */

function criarCartaoLivro(livro) {
  const item = document.createElement("li");

  item.classList.add("book-card");
  item.dataset.id = livro.id;

  const informacoes = document.createElement("div");
  informacoes.classList.add("book-info");

  const titulo = document.createElement("h3");
  titulo.textContent = livro.titulo;

  const autor = document.createElement("p");
  autor.textContent = `Autor: ${livro.autor}`;

  const ano = document.createElement("span");
  ano.classList.add("book-year");
  ano.textContent = livro.ano;

  informacoes.append(titulo, autor, ano);

  const areaAutores = criarAreaAutoresLivro(livro);

  if (areaAutores) {
    informacoes.appendChild(areaAutores);
  }

  const acoes = document.createElement("div");
  acoes.classList.add("book-actions");

  const botaoEditar = document.createElement("button");

  botaoEditar.type = "button";
  botaoEditar.classList.add("btn-edit");
  botaoEditar.textContent = "Editar";

  botaoEditar.setAttribute("aria-label", `Editar o livro ${livro.titulo}`);

  botaoEditar.addEventListener("click", () => {
    iniciarEdicao(livro.id);
  });

  const botaoExcluir = document.createElement("button");

  botaoExcluir.type = "button";
  botaoExcluir.classList.add("btn-delete");
  botaoExcluir.textContent = "Excluir";

  botaoExcluir.setAttribute("aria-label", `Excluir o livro ${livro.titulo}`);

  botaoExcluir.addEventListener("click", () => {
    excluirLivro(livro.id);
  });

  acoes.append(botaoEditar, botaoExcluir);
  item.append(informacoes, acoes);

  return item;
}

/* =========================
   RENDERIZAÇÃO DOS LIDOS
========================= */

function renderizarLivros() {
  if (!listaLivros || !estadoVazio) {
    return;
  }

  listaLivros.innerHTML = "";

  const livrosLidos = livros.filter((livro) => livro.lido === true);

  livrosLidos.forEach((livro) => {
    listaLivros.appendChild(criarCartaoLivro(livro));
  });

  estadoVazio.hidden = livrosLidos.length > 0;
}

/* =========================
   EDIÇÃO
========================= */

function iniciarEdicao(id) {
  const livroEncontrado = livros.find((livro) => livro.id === id);

  if (
    !livroEncontrado ||
    !inputTitulo ||
    !inputAutor ||
    !inputAno ||
    !botaoAdicionar ||
    !formularioAdicionar
  ) {
    return;
  }

  livroEmEdicao = id;

  inputTitulo.value = livroEncontrado.titulo;
  inputAutor.value = livroEncontrado.autor;

  inputAno.value = /^\d+$/.test(livroEncontrado.ano) ? livroEncontrado.ano : "";

  botaoAdicionar.textContent = "Salvar alterações";

  formularioAdicionar.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });

  inputTitulo.focus();

  notificar(`Editando "${livroEncontrado.titulo}".`, "aviso");
}

async function salvarEdicao(titulo, autor, ano) {
  const livroEditado = livros.find((livro) => livro.id === livroEmEdicao);

  livros = livros.map((livro) => {
    if (livro.id === livroEmEdicao) {
      return {
        ...livro,
        titulo,
        autor,
        autores: [autor],
        ano,
      };
    }

    return livro;
  });

  const livroParaAtualizar = livros.find((livro) => livro.id === livroEmEdicao);

  if (livroParaAtualizar) {
    await atualizarDadosLivro(livroParaAtualizar);
  }

  livroEmEdicao = null;

  if (botaoAdicionar) {
    botaoAdicionar.textContent = "Adicionar livro";
  }

  renderizarLivros();
  atualizarResultadosAtuais();

  notificar(livroEditado ? `"${titulo}" foi atualizado.` : "Livro atualizado.");
}

/* =========================
   EXCLUSÃO COM DESFAZER
========================= */

async function excluirLivro(id) {
  const indiceLivro = livros.findIndex((livro) => livro.id === id);

  if (indiceLivro === -1) {
    return;
  }

  const livroRemovido = {
    ...livros[indiceLivro],
  };

  await excluirLivroDoBanco(id);

  livros.splice(indiceLivro, 1);

  if (livroEmEdicao === id) {
    livroEmEdicao = null;

    if (botaoAdicionar) {
      botaoAdicionar.textContent = "Adicionar livro";
    }

    formularioAdicionar?.reset();
  }

  renderizarLivros();
  atualizarResultadosAtuais();

  notificar(`"${livroRemovido.titulo}" foi excluído.`, "aviso", 6000, {
    texto: "Desfazer",

    aoClicar: () => {
      restaurarLivroExcluido(livroRemovido, indiceLivro);
    },
  });
}

async function restaurarLivroExcluido(livroRemovido, indiceLivro) {
  const jaExiste = livros.some((livro) => livro.id === livroRemovido.id);
  if (jaExiste) {
    return;
  }

  const indiceSeguro = Math.min(indiceLivro, livros.length);

  await adicionarLivroNoBanco(livroRemovido);

  livros.splice(indiceSeguro, 0, livroRemovido);

  renderizarLivros();
  atualizarResultadosAtuais();

  notificar(`"${livroRemovido.titulo}" foi restaurado.`, "sucesso", 3000);
}

/* =========================
   FORMULÁRIO MANUAL
========================= */

if (formularioAdicionar && inputTitulo && inputAutor && inputAno) {
  formularioAdicionar.addEventListener("submit", (event) => {
    event.preventDefault();

    const titulo = inputTitulo.value.trim();
    const autor = inputAutor.value.trim();
    const ano = inputAno.value.trim();

    if (!titulo || !autor || !ano) {
      return;
    }

    if (livroEmEdicao) {
      salvarEdicao(titulo, autor, ano);
    } else {
      adicionarLivro(titulo, autor, ano, null, null, "lido", [autor]);

      notificar(`"${titulo}" foi adicionado aos livros lidos.`);
    }

    formularioAdicionar.reset();
    inputTitulo.focus();
  });
}

/* =========================
   PESQUISA RECEBIDA PELA URL
========================= */

async function aplicarPesquisaDaURL() {
  if (!formularioPesquisa || !tipoPesquisa || !inputPesquisa) {
    return;
  }

  const parametros = new URLSearchParams(window.location.search);

  const busca = parametros.get("busca")?.trim();
  const tipoRecebido = parametros.get("tipo");

  if (!busca) {
    return;
  }

  const tiposPermitidos = ["geral", "titulo", "autor"];

  const tipo = tiposPermitidos.includes(tipoRecebido) ? tipoRecebido : "titulo";

  tipoPesquisa.value = tipo;
  inputPesquisa.value = busca;

  atualizarInterfacePesquisa();

  consultaPesquisaAtual = montarConsultaPesquisa(busca, tipo);

  termoPesquisaAtual = busca;
  nomeTipoPesquisaAtual = obterNomeTipoPesquisa(tipo);

  paginaPesquisaAtual = 1;
  totalResultadosPesquisa = 0;
  totalPaginasPesquisa = 0;
  ultimosResultadosPesquisa = [];

  await carregarPaginaPesquisa(1, false);

  const areaPesquisa = formularioPesquisa.closest(".search");

  areaPesquisa?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });

  inputPesquisa.focus();

  const posicaoFinal = inputPesquisa.value.length;

  inputPesquisa.setSelectionRange(posicaoFinal, posicaoFinal);
}

/* =========================
   INICIALIZAÇÃO
========================= */

async function iniciarPaginaInicial() {
  livros = await carregarLivrosDoBanco();
  salvarAutoresFavoritos();
  atualizarInterfacePesquisa();
  renderizarLivros();
  aplicarPesquisaDaURL();
}

iniciarPaginaInicial();
