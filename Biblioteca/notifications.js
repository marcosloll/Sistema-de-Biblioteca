(() => {
  let container = document.querySelector(".toast-container");

  if (!container) {
    container = document.createElement("div");

    container.classList.add("toast-container");
    container.setAttribute("aria-live", "polite");
    container.setAttribute("aria-atomic", "true");

    document.body.appendChild(container);
  }

  window.mostrarNotificacao = function (
    mensagem,
    tipo = "sucesso",
    duracao = 3500,
    acao = null,
  ) {
    const notificacao = document.createElement("div");

    notificacao.classList.add("toast", `toast-${tipo}`);

    notificacao.setAttribute(
      "role",
      tipo === "erro" ? "alert" : "status",
    );

    const conteudo = document.createElement("div");
    conteudo.classList.add("toast-content");

    const texto = document.createElement("p");
    texto.textContent = mensagem;

    conteudo.appendChild(texto);

    const controles = document.createElement("div");
    controles.classList.add("toast-controls");

    let botaoAcao = null;

    if (
      acao &&
      typeof acao.texto === "string" &&
      typeof acao.aoClicar === "function"
    ) {
      botaoAcao = document.createElement("button");

      botaoAcao.type = "button";
      botaoAcao.classList.add("toast-action");
      botaoAcao.textContent = acao.texto;

      controles.appendChild(botaoAcao);
    }

    const botaoFechar = document.createElement("button");

    botaoFechar.type = "button";
    botaoFechar.classList.add("toast-close");
    botaoFechar.textContent = "×";

    botaoFechar.setAttribute(
      "aria-label",
      "Fechar notificação",
    );

    controles.appendChild(botaoFechar);

    notificacao.append(conteudo, controles);
    container.appendChild(notificacao);

    requestAnimationFrame(() => {
      notificacao.classList.add("is-visible");
    });

    let removendo = false;

    const temporizador = setTimeout(() => {
      removerNotificacao();
    }, duracao);

    function removerNotificacao() {
      if (removendo) {
        return;
      }

      removendo = true;

      clearTimeout(temporizador);

      notificacao.classList.remove("is-visible");

      notificacao.addEventListener(
        "transitionend",
        () => {
          notificacao.remove();
        },
        { once: true },
      );

      setTimeout(() => {
        notificacao.remove();
      }, 400);
    }

    if (botaoAcao) {
      botaoAcao.addEventListener("click", () => {
        try {
          acao.aoClicar();
        } catch (erro) {
          console.error(
            "Não foi possível executar a ação:",
            erro,
          );
        }

        removerNotificacao();
      });
    }

    botaoFechar.addEventListener(
      "click",
      removerNotificacao,
    );

    return {
      fechar: removerNotificacao,
      elemento: notificacao,
    };
  };
})();