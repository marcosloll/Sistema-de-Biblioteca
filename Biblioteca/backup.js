(() => {
  const botaoExportar = document.querySelector(
    "#btn-exportar-backup",
  );

  const botaoImportar = document.querySelector(
    "#btn-importar-backup",
  );

  const inputArquivo = document.querySelector(
    "#arquivo-backup",
  );

  const statusBackup = document.querySelector(
    "#status-backup",
  );

  const NOME_APLICACAO = "biblioteca-pessoal";
  const VERSAO_BACKUP = 1;
  const TAMANHO_MAXIMO_ARQUIVO = 5 * 1024 * 1024;
  const LIMITE_LIVROS = 5000;
  const LIMITE_AUTORES = 2000;

  function notificar(
    mensagem,
    tipo = "sucesso",
    duracao = 3500,
  ) {
    if (
      typeof window.mostrarNotificacao ===
      "function"
    ) {
      window.mostrarNotificacao(
        mensagem,
        tipo,
        duracao,
      );
    }
  }

  function atualizarStatus(mensagem = "") {
    if (statusBackup) {
      statusBackup.textContent = mensagem;
    }
  }

  function gerarId() {
    if (globalThis.crypto?.randomUUID) {
      return globalThis.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}`;
  }

  function normalizarTexto(texto) {
    return String(texto ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();
  }

  function lerListaLocalStorage(chave) {
    const valorSalvo = localStorage.getItem(chave);

    if (!valorSalvo) {
      return [];
    }

    const valor = JSON.parse(valorSalvo);

    if (!Array.isArray(valor)) {
      throw new Error(
        `Os dados de “${chave}” não estão no formato esperado.`,
      );
    }

    return valor;
  }

  function baixarArquivoJson(conteudo, nomeArquivo) {
    const blob = new Blob(
      [JSON.stringify(conteudo, null, 2)],
      { type: "application/json;charset=utf-8" },
    );

    const endereco = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = endereco;
    link.download = nomeArquivo;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(endereco);
  }

  function exportarBackup() {
    try {
      const livros = lerListaLocalStorage("livros");
      const autoresFavoritos = lerListaLocalStorage(
        "autoresFavoritos",
      );

      const agora = new Date();
      const dataArquivo = agora
        .toISOString()
        .slice(0, 10);

      const backup = {
        aplicacao: NOME_APLICACAO,
        versao: VERSAO_BACKUP,
        exportadoEm: agora.toISOString(),
        dados: {
          livros,
          autoresFavoritos,
        },
      };

      baixarArquivoJson(
        backup,
        `biblioteca-backup-${dataArquivo}.json`,
      );

      atualizarStatus(
        `${livros.length} livro(s) e ${autoresFavoritos.length} autor(es) exportado(s).`,
      );

      notificar("Backup exportado com sucesso.");
    } catch (erro) {
      console.error(
        "Não foi possível exportar o backup:",
        erro,
      );

      atualizarStatus(
        "Não foi possível criar o backup.",
      );

      notificar(
        "Não foi possível exportar os dados da biblioteca.",
        "erro",
      );
    }
  }

  function validarEstruturaBackup(backup) {
    if (!backup || typeof backup !== "object") {
      throw new Error("O arquivo não contém um objeto JSON válido.");
    }

    if (backup.aplicacao !== NOME_APLICACAO) {
      throw new Error(
        "O arquivo não foi exportado por esta Biblioteca.",
      );
    }

    if (backup.versao !== VERSAO_BACKUP) {
      throw new Error(
        "A versão deste backup não é compatível com o site.",
      );
    }

    if (!backup.dados || typeof backup.dados !== "object") {
      throw new Error("A área de dados do backup está ausente.");
    }

    if (!Array.isArray(backup.dados.livros)) {
      throw new Error("A lista de livros do backup é inválida.");
    }

    if (!Array.isArray(backup.dados.autoresFavoritos)) {
      throw new Error(
        "A lista de autores favoritos do backup é inválida.",
      );
    }

    if (backup.dados.livros.length > LIMITE_LIVROS) {
      throw new Error(
        "O backup contém livros demais para ser importado.",
      );
    }

    if (
      backup.dados.autoresFavoritos.length >
      LIMITE_AUTORES
    ) {
      throw new Error(
        "O backup contém autores demais para ser importado.",
      );
    }
  }

  function sanitizarLivro(livro, indice) {
    if (!livro || typeof livro !== "object") {
      throw new Error(
        `O livro ${indice + 1} possui um formato inválido.`,
      );
    }

    const titulo = String(livro.titulo ?? "").trim();
    const autor = String(
      livro.autor ?? "Autor não informado",
    ).trim();

    if (!titulo) {
      throw new Error(
        `O livro ${indice + 1} não possui título.`,
      );
    }

    const autoresOriginais = Array.isArray(livro.autores)
      ? livro.autores
      : autor
        ? [autor]
        : [];

    const autoresUnicos = new Map();

    autoresOriginais.forEach((nome) => {
      const nomeLimpo = String(nome ?? "").trim();
      const chave = normalizarTexto(nomeLimpo);

      if (nomeLimpo && chave) {
        autoresUnicos.set(chave, nomeLimpo);
      }
    });

    const idExterno =
      livro.idExterno ?? livro.googleId ?? null;

    return {
      ...livro,
      id: String(livro.id ?? gerarId()),
      fonte:
        livro.fonte === "google-books"
          ? "google-books"
          : "manual",
      tipo: "livro",
      idExterno,
      googleId:
        livro.fonte === "google-books"
          ? (livro.googleId ?? idExterno)
          : null,
      titulo,
      autor: autor || "Autor não informado",
      autores: [...autoresUnicos.values()],
      ano: String(
        livro.ano ?? "Ano não informado",
      ).trim(),
      capa:
        typeof livro.capa === "string"
          ? livro.capa.trim() || null
          : null,
      lido: livro.lido === true,
      planejado: livro.planejado === true,
      favorito: livro.favorito === true,
    };
  }

  function sanitizarAutoresFavoritos(autores) {
    const autoresUnicos = new Map();

    autores.forEach((autor) => {
      const nome =
        typeof autor === "string"
          ? autor.trim()
          : String(autor?.nome ?? "").trim();

      const chave = normalizarTexto(nome);

      if (!nome || !chave) {
        return;
      }

      if (!autoresUnicos.has(chave)) {
        autoresUnicos.set(chave, {
          id: String(autor?.id ?? gerarId()),
          nome,
        });
      }
    });

    return [...autoresUnicos.values()];
  }

  async function importarArquivo(arquivo) {
    if (!arquivo) {
      return;
    }

    if (arquivo.size > TAMANHO_MAXIMO_ARQUIVO) {
      throw new Error(
        "O arquivo ultrapassa o limite de 5 MB.",
      );
    }

    const texto = await arquivo.text();
    let backup;

    try {
      backup = JSON.parse(texto);
    } catch {
      throw new Error("O arquivo não contém JSON válido.");
    }

    validarEstruturaBackup(backup);

    const livros = backup.dados.livros.map(
      sanitizarLivro,
    );

    const autoresFavoritos =
      sanitizarAutoresFavoritos(
        backup.dados.autoresFavoritos,
      );

    const confirmado = window.confirm(
      `Importar ${livros.length} livro(s) e ${autoresFavoritos.length} autor(es)?\n\nOs dados atuais serão substituídos.`,
    );

    if (!confirmado) {
      atualizarStatus("Importação cancelada.");
      return;
    }

    localStorage.setItem(
      "livros",
      JSON.stringify(livros),
    );

    localStorage.setItem(
      "autoresFavoritos",
      JSON.stringify(autoresFavoritos),
    );

    atualizarStatus(
      `${livros.length} livro(s) e ${autoresFavoritos.length} autor(es) importado(s).`,
    );

    notificar(
      "Backup importado. Atualizando a biblioteca...",
    );

    window.setTimeout(() => {
      window.location.reload();
    }, 900);
  }

  botaoExportar?.addEventListener(
    "click",
    exportarBackup,
  );

  botaoImportar?.addEventListener("click", () => {
    inputArquivo?.click();
  });

  inputArquivo?.addEventListener(
    "change",
    async () => {
      const arquivo = inputArquivo.files?.[0];

      try {
        await importarArquivo(arquivo);
      } catch (erro) {
        console.error(
          "Não foi possível importar o backup:",
          erro,
        );

        atualizarStatus(erro.message);

        notificar(
          `Backup recusado: ${erro.message}`,
          "erro",
          6000,
        );
      } finally {
        inputArquivo.value = "";
      }
    },
  );
})();
