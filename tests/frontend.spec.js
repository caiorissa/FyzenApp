import { test, expect } from "@playwright/test";

const navigate = async (page, label) => {
  const sidebar = page.getByRole("navigation", {
    name: "Navegação principal",
    exact: true,
  });
  if (await sidebar.isVisible())
    await sidebar.getByRole("button", { name: label, exact: true }).click();
  else {
    const nav = page.getByRole("navigation", { name: "Navegação mobile" });
    const direct = nav.getByRole("button", { name: label, exact: true });
    if (await direct.count()) await direct.click();
    else {
      await nav.getByRole("button", { name: "Mais" }).click();
      await page
        .getByRole("dialog")
        .getByRole("button", { name: label, exact: true })
        .click();
    }
  }
  const titles = {
    Início: "Olá, Marina.",
    Treino: "Seu plano de treino",
    Alimentação: "Seu diário alimentar",
    Progresso: "Cada treino conta",
    Metas: "Metas que movem você",
    "Acesso gratuito": "Tudo do Fyzen, grátis",
    "Painel Ultra": "Sua evolução em detalhe",
    Admin: "Visão administrativa",
  };
  await expect(
    page.getByRole("heading", { name: titles[label], exact: true }),
  ).toBeVisible();
  await expect(page.locator(".screen-content")).toHaveCSS("opacity", "1");
};
const noOverflow = async (page) =>
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);

for (const width of [360, 390, 768, 1024, 1440]) {
  test(`principais telas sem overflow em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Olá, Marina." }),
    ).toBeVisible();
    await noOverflow(page);
    for (const label of [
      "Treino",
      "Alimentação",
      "Progresso",
      "Metas",
      "Acesso gratuito",
    ]) {
      await navigate(page, label);
      await expect(page.locator("main h1")).toBeVisible();
      await noOverflow(page);
      if ([390, 1440].includes(width))
        await page.screenshot({
          path: `docs/qa/${label}-${width}.png`,
          fullPage: false,
        });
    }
    expect(errors).toEqual([]);
  });
}

test("login, cadastro, senha e recuperação com feedback acessível", async ({
  page,
}) => {
  await page.goto("/?scenario=login");
  await page.getByRole("button", { name: "Esqueci minha senha" }).click();
  await expect(page.getByRole("alert")).toContainText("Digite seu e-mail");
  await page.getByLabel("E-mail", { exact: true }).fill("marina@example.test");
  await page.getByRole("button", { name: "Esqueci minha senha" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Link de recuperação enviado",
  );
  await page.getByLabel("Senha", { exact: true }).fill("example123");
  await page.getByRole("button", { name: "Mostrar senha" }).click();
  await expect(page.getByLabel("Senha", { exact: true })).toHaveAttribute(
    "type",
    "text",
  );
  await page.getByRole("button", { name: "Criar conta grátis" }).click();
  await expect(page.getByLabel("Nome", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.getByLabel("E-mail", { exact: true }).fill("invalid@example.test");
  await page.getByRole("button", { name: "Entrar na minha conta" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "E-mail ou senha incorretos",
  );
});

test("metas persistem ao navegar; falha mantém edição e mostra erro", async ({
  page,
}) => {
  await page.goto("/");
  await navigate(page, "Metas");
  await page.getByLabel("Minutos de atividade por dia").fill("45");
  await page.getByRole("button", { name: "Salvar metas" }).click();
  await expect(page.getByText("Metas de atividade salvas.")).toBeVisible();
  await page
    .getByLabel("Nova meta personalizada")
    .fill("Caminhar depois do almoço");
  await page.getByRole("button", { name: "Adicionar", exact: true }).click();
  await expect(
    page.getByText("Caminhar depois do almoço", { exact: true }),
  ).toBeVisible();
  await navigate(page, "Início");
  await navigate(page, "Metas");
  await expect(page.getByLabel("Minutos de atividade por dia")).toHaveValue(
    "45",
  );
  await page.evaluate(() => sessionStorage.setItem("qa-fail-save", "true"));
  await page.getByLabel("Nova meta personalizada").fill("Meta não salva");
  await page.getByRole("button", { name: "Adicionar", exact: true }).click();
  await expect(
    page.getByText(
      "Não foi possível salvar. Suas metas anteriores foram mantidas.",
    ),
  ).toBeVisible();
  await expect(page.getByLabel("Nova meta personalizada")).toHaveValue(
    "Meta não salva",
  );
  await expect(
    page.getByRole("button", { name: "Remover meta: Meta não salva" }),
  ).toHaveCount(0);
});

test("refeições: adicionar, persistir, remover e validar", async ({ page }) => {
  await page.goto("/");
  await navigate(page, "Alimentação");
  await page.getByLabel("Nome da refeição").fill("Arroz, frango e salada");
  await page.getByLabel("Calorias (kcal)").fill("450");
  await page
    .getByRole("button", { name: "Adicionar refeição", exact: true })
    .click();
  await expect(
    page.getByText("Refeição adicionada.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Arroz, frango e salada", { exact: true }),
  ).toBeVisible();
  await navigate(page, "Início");
  await navigate(page, "Alimentação");
  await expect(
    page.getByText("Arroz, frango e salada", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Remover refeição: Arroz, frango e salada" })
    .click();
  await expect(
    page.getByText("Refeição removida.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Arroz, frango e salada", { exact: true }),
  ).toHaveCount(0);
});

test("plano: geração preserva campos; relatório fecha por Escape e retorna foco", async ({
  page,
}) => {
  await page.route("**/api/workout/week", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        treinos: [
          {
            grupo: "Peito",
            exercicios: ["Supino reto – 4x10", "Crossover – 3x12"],
          },
        ],
        source: "ia",
      }),
    }),
  );
  await page.goto("/?scenario=empty");
  await navigate(page, "Treino");
  await expect(
    page.getByRole("button", { name: "Gerar meu plano" }),
  ).toBeDisabled();
  await page.getByLabel("Sexo", { exact: true }).selectOption("feminino");
  await page.getByLabel("Idade", { exact: false }).fill("29");
  await page.getByLabel("Peso", { exact: false }).fill("65");
  await page.getByLabel("Altura", { exact: false }).fill("168");
  await page.getByLabel("Nível", { exact: true }).selectOption("iniciante");
  await page
    .getByLabel("Objetivo", { exact: true })
    .selectOption("hipertrofia");
  await page.getByLabel("Local do treino").selectOption("academia");
  await page.getByRole("button", { name: "Gerar meu plano" }).click();
  await expect(page.getByText("Plano gerado e salvo!")).toBeVisible();
  await page.getByRole("button", { name: "Ver resumo semanal" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Ver resumo semanal" }),
  ).toBeFocused();
});

test("Ultra: falha da IA mantém geração de plano disponível", async ({
  page,
}) => {
  await page.route("**/api/workout/week", (route) =>
    route.abort("connectionrefused"),
  );
  await page.goto("/?scenario=empty&plan=ultra");
  await navigate(page, "Treino");
  await page.getByLabel("Sexo", { exact: true }).selectOption("feminino");
  await page.getByLabel("Idade", { exact: false }).fill("29");
  await page.getByLabel("Peso", { exact: false }).fill("65");
  await page.getByLabel("Altura", { exact: false }).fill("168");
  await page.getByLabel("Nível", { exact: true }).selectOption("iniciante");
  await page
    .getByLabel("Objetivo", { exact: true })
    .selectOption("hipertrofia");
  await page.getByLabel("Local do treino").selectOption("academia");
  await page.getByRole("button", { name: "Gerar meu plano" }).click();
  await expect(
    page.getByText(
      "Plano gerado e salvo. A Fyzen AI está indisponível no momento, então usamos o método padrão.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Ver resumo semanal" }),
  ).toBeVisible();
});

test("Ultra: aceita o contrato de semana do backend publicado", async ({
  page,
}) => {
  await page.route("**/api/workout/week", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        treinos: [
          {
            grupo: "Peito",
            exercicios: ["Supino reto — 4x10", "Crucifixo — 3x12"],
          },
        ],
        source: "ia",
      }),
    });
  });
  await page.goto("/?scenario=empty&plan=ultra");
  await navigate(page, "Treino");
  await page.getByLabel("Sexo", { exact: true }).selectOption("feminino");
  await page.getByLabel("Idade", { exact: false }).fill("29");
  await page.getByLabel("Peso", { exact: false }).fill("65");
  await page.getByLabel("Altura", { exact: false }).fill("168");
  await page.getByLabel("Nível", { exact: true }).selectOption("iniciante");
  await page
    .getByLabel("Objetivo", { exact: true })
    .selectOption("hipertrofia");
  await page.getByLabel("Local do treino").selectOption("academia");
  await page.getByRole("button", { name: "Gerar meu plano" }).click();

  await expect(
    page.getByText("Fyzen AI está gerando seu plano..."),
  ).toBeVisible();
  await expect(page.getByText("Plano gerado e salvo!")).toBeVisible();
  await expect(page.getByText("Supino reto — 4x10")).toBeVisible();
});

test("Ultra é gratuito e todo exercício oferece vídeo demonstrativo", async ({
  page,
}) => {
  await page.goto("/?plan=free&expired=1");
  await navigate(page, "Treino");
  const exerciseRows = page.getByRole("listitem");
  await expect(exerciseRows).not.toHaveCount(0);
  await expect(
    page.getByRole("link", { name: /Buscar vídeos de demonstração de/ }),
  ).toHaveCount((await exerciseRows.count()) - 1);
  await expect(
    page.getByRole("button", { name: /Ver vídeo de demonstração de/ }),
  ).toHaveCount(1);
  await page
    .getByRole("button", {
      name: "Ver vídeo de demonstração de Agachamento livre",
    })
    .click();
  await expect(
    page.getByRole("dialog", {
      name: "Vídeo de demonstração: Agachamento livre",
    }),
  ).toBeVisible();
  await expect(
    page.getByTitle("Vídeo de demonstração de Agachamento livre"),
  ).toHaveAttribute(
    "src",
    "https://www.youtube-nocookie.com/embed/M7lc1UVf-VE?playsinline=1",
  );
  await page.getByRole("button", { name: "Fechar vídeo" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: "Ver vídeo de demonstração de Agachamento livre",
    }),
  ).toBeFocused();
  await expect(
    page
      .getByRole("link", { name: /Buscar vídeos de demonstração de/ })
      .first(),
  ).toBeVisible();
  await navigate(page, "Acesso gratuito");
  await expect(page.getByText("Gratuito para todos")).toBeVisible();
  await expect(
    page.getByText("Todos os recursos, sempre grátis."),
  ).toBeVisible();
});

test("Ultra, verificação de e-mail e menu mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?plan=ultra");
  await navigate(page, "Painel Ultra");
  await expect(
    page.getByRole("heading", { name: "Sua evolução em detalhe" }),
  ).toBeVisible();
  await noOverflow(page);
  await page.getByRole("button", { name: "Mais", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Mais", exact: true }),
  ).toBeFocused();
  await page.goto("/?scenario=unverified");
  await expect(
    page.getByRole("heading", { name: "Confirme seu e-mail" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reenviar e-mail" }).click();
  await expect(page.getByRole("status")).toContainText("Novo e-mail enviado");
});

test("checklist: conclusão registra uma vez e persiste ao trocar de tela", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-09-07T15:00:00Z"));
  await page.goto("/");
  await navigate(page, "Treino");
  const checks = page.getByRole("checkbox");
  await expect(checks).toHaveCount(3);
  for (const checkbox of await checks.all()) await checkbox.click();
  await expect(checks.first()).toHaveAttribute("aria-checked", "true");
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          Object.keys(
            JSON.parse(sessionStorage.getItem("qa-documents") || "{}"),
          ).filter((key) => key.startsWith("historicoTreino/")).length,
      ),
    )
    .toBe(1);
  await navigate(page, "Início");
  await navigate(page, "Treino");
  await expect(checks.first()).toHaveAttribute("aria-checked", "true");
  await page.getByRole("button", { name: "Terça", exact: true }).click();
  await expect(checks.first()).toBeDisabled();
  await page.getByRole("button", { name: "Segunda", exact: true }).click();
  await expect(checks.first()).toHaveAttribute("aria-checked", "true");
  expect(
    await page.evaluate(
      () =>
        Object.keys(
          JSON.parse(sessionStorage.getItem("qa-documents") || "{}"),
        ).filter((key) => key.startsWith("historicoTreino/")).length,
    ),
  ).toBe(1);
});

test("modo treino registra série, descansa e finaliza em uma sessão versionada", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-09-07T15:00:00Z"));
  await page.goto("/");
  await navigate(page, "Treino");
  await page
    .getByRole("button", { name: "Iniciar modo treino" })
    .first()
    .click();
  await page.getByRole("button", { name: "Iniciar treino" }).click();
  await expect(page.getByRole("main", { name: "Modo treino" })).toBeVisible();
  for (let exercise = 0; exercise < 3; exercise++) {
    for (let set = 1; set <= 3; set++) {
      await page
        .locator('input[inputmode="decimal"]:not(:disabled)')
        .fill("70");
      await page
        .locator('input[inputmode="numeric"]:not(:disabled)')
        .fill("10");
      await page.getByRole("button", { name: `Concluir série ${set}` }).click();
      if (exercise === 0 && set === 1)
        await expect(page.getByText("Descanso", { exact: true })).toBeVisible();
      if (!(exercise === 2 && set === 3))
        await page.getByRole("button", { name: "Pular" }).click();
    }
  }
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          Object.keys(
            JSON.parse(
              localStorage.getItem("fyzen:workout-session:qa-user") || "{}",
            ),
          ).length,
      ),
    )
    .toBeGreaterThan(0);
  await page.getByRole("button", { name: "Finalizar treino" }).click();
  await expect(
    page.getByText("Treino concluído", { exact: true }),
  ).toBeVisible();
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          Object.keys(
            JSON.parse(sessionStorage.getItem("qa-documents") || "{}"),
          ).filter((key) => key.startsWith("workoutSessions/qa-user/sessions/"))
            .length,
      ),
    )
    .toBe(1);
});

test("modo treino retoma a série registrada após refresh", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-09-07T15:00:00Z"));
  await page.goto("/");
  await navigate(page, "Treino");
  await page
    .getByRole("button", { name: "Iniciar modo treino" })
    .first()
    .click();
  await page.getByRole("button", { name: "Iniciar treino" }).click();
  await page.getByLabel("Carga da série 1 em kg").fill("70");
  await page.getByLabel("Repetições da série 1").fill("10");
  await page.getByRole("button", { name: "Concluir série 1" }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Continuar treino" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continuar treino" }).click();
  await expect(page.getByRole("main", { name: "Modo treino" })).toBeVisible();
  await expect(page.getByLabel("Carga da série 1 em kg")).toHaveValue("70");
});

for (const width of [320, 360, 390, 430]) {
  test(`modo treino não cria overflow em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.clock.setFixedTime(new Date("2026-09-07T15:00:00Z"));
    await page.goto("/");
    await navigate(page, "Treino");
    await page
      .getByRole("button", { name: "Iniciar modo treino" })
      .first()
      .click();
    await page.getByRole("button", { name: "Iniciar treino" }).click();
    await expect(page.getByRole("main", { name: "Modo treino" })).toBeVisible();
    await noOverflow(page);
    await page.screenshot({
      path: `docs/qa/Modo-treino-${width}.png`,
      fullPage: false,
    });
  });
}

test("painel administrativo permanece acessível somente ao administrador", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Admin", exact: true }),
  ).toHaveCount(0);
  await page.goto("/?scenario=admin");
  await navigate(page, "Admin");
  await noOverflow(page);
  await expect(page.getByLabel("Mensagem do aviso")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow(page);
});

test("Ultra: regenerar dia e semana salva os novos exercícios", async ({
  page,
}) => {
  await page.route("**/workout/day", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        grupos: [
          {
            grupo: "Peito",
            exercicios: [
              "Supino inclinado – 3x12",
              "Crucifixo com halteres – 3x12",
              "Flexão de braço – 3x10",
            ],
          },
        ],
      }),
    }),
  );
  await page.goto("/?plan=ultra");
  await navigate(page, "Treino");
  await page.getByRole("button", { name: "Gerar novo treino do dia" }).click();
  await expect(
    page.getByText("Novo treino do dia salvo.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Supino inclinado – 3x12", { exact: true }),
  ).toBeVisible();
  await navigate(page, "Início");
  await navigate(page, "Treino");
  await expect(
    page.getByText("Supino inclinado – 3x12", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Gerar nova semana inteira" }).click();
  await expect(
    page.getByText("Nova semana salva no seu plano.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Supino inclinado – 3x12", { exact: true }),
  ).toHaveCount(0);
  const saved = await page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem("qa-documents"))["planos/qa-user"].plan
        .treinos,
  );
  expect(saved).toHaveLength(5);
});

test("abrir treino não grava nem sobrescreve o perfil carregado", async ({
  page,
}) => {
  await page.goto("/");
  await navigate(page, "Treino");
  // Observe beyond the existing 1.5 second autosave debounce.
  await page.waitForTimeout(1800);
  expect(
    await page.evaluate(() => sessionStorage.getItem("qa-documents")),
  ).toBeNull();
});

test("todos os recursos Ultra continuam gratuitos para qualquer conta", async ({
  page,
}) => {
  await page.goto("/?plan=free&expired=1");
  await expect(page.getByText("Acesso total")).toHaveCount(0);
  await expect(page.getByText("ULTRA · GRÁTIS")).toHaveCount(0);
  await expect(page.getByText("Fyzen Ultra · grátis")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Painel Ultra", exact: true }),
  ).toBeVisible();
  await navigate(page, "Treino");
  await expect(
    page.getByRole("button", { name: "Gerar novo treino do dia" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("link", { name: /Buscar vídeos de demonstração de/ })
      .first(),
  ).toBeVisible();
  await navigate(page, "Acesso gratuito");
  await expect(page.getByText("Gratuito para todos")).toBeVisible();
});
