async function checkTargetFeedback(page) {
  const context = await page
    .context()
    .browser()
    .newContext({ viewport: { width: 1440, height: 1080 } });
  const tab = await context.newPage(),
    base = "http://127.0.0.1:3000";
  const errors = [];
  tab.on("pageerror", (error) => errors.push(error.message));
  const ensure = (value, message) => {
    if (!value) throw new Error(message);
  };
  let evaluations = 0;
  const question = (id, prompt, type) => ({
    id,
    prompt,
    type,
    topic: "travel",
    topicLabel: "여행",
    hint: "",
    difficulty: 4,
  });
  const exam = {
    id: "target-preview",
    createdAt: Date.now(),
    completedAt: Date.now(),
    deadline: Date.now(),
    status: "completed",
    config: {
      mode: "practice",
      difficulty: 4,
      count: 15,
      target: "IH",
      topics: ["travel"],
      occupation: "일 경험 없음",
      student: "아니요",
      residence: "혼자 거주",
    },
    questions: [
      question("one", "Describe your favorite place.", "description"),
      question("two", "Tell me about a trip.", "past"),
    ],
    answers: [
      {
        index: 0,
        duration: 30,
        audio: null,
        mime: null,
        transcript: "My favorite place is the beach.",
        transcriptSource: "gpt",
        skipped: false,
      },
      {
        index: 1,
        duration: 45,
        audio: null,
        mime: null,
        transcript: "Last summer, I go to Busan with my friends.",
        transcriptSource: "gpt",
        skipped: false,
      },
    ],
    plays: 0,
    index: 2,
    adjustment: null,
    evaluation: {
      range: "평가 근거 부족",
      confidence: "low",
      summary: "미리 작성한 UI 검증용 피드백입니다.",
      dimensions: ["functions", "context", "accuracy", "text"].map((name) => ({
        name,
        score: 3,
        feedback: "검증용",
      })),
      strengths: ["검증용"],
      priorities: ["검증용"],
      evidence: [],
      grammar: [],
      studyPlan: ["검증용"],
      disclaimer: "미리 작성한 UI 검증용 데이터입니다.",
    },
  };
  const report = {
    version: "target-coaching-v1",
    target: "IH",
    summary: "IH를 목표로 과거 시점을 보완하는 UI 예시입니다.",
    criteria: [
      {
        id: "task",
        status: "demonstrated",
        feedback: "장소 질문에 답했습니다.",
        evidence: [{ question: 1, quote: "My favorite place is the beach." }],
        practice: "장소의 특징을 설명해 보세요.",
      },
      {
        id: "organization",
        status: "developing",
        feedback: "경험을 확장해 보세요.",
        evidence: [
          { question: 2, quote: "Last summer, I go to Busan with my friends." },
        ],
        practice: "실제 경험의 이유를 덧붙여 보세요.",
      },
      {
        id: "timeframes",
        status: "developing",
        feedback: "과거 시점을 확인해 보세요.",
        evidence: [{ question: 2, quote: "I go to Busan" }],
        practice: "went를 써서 다시 말해 보세요.",
      },
      {
        id: "clarity",
        status: "not_observed",
        feedback: "이번 표본으로는 확인할 근거가 충분하지 않습니다.",
        evidence: [],
        practice: "다른 질문에도 답해 보세요.",
      },
    ],
  };
  try {
    await tab.goto(`${base}/?view=example`);
    await tab
      .getByRole("heading", { name: "IH 목표 피드백", exact: true })
      .waitFor();
    ensure(
      (await tab
        .locator(".target-feedback [data-target-criterion]")
        .count()) === 4,
      "example must display four criteria",
    );
    ensure(
      (await tab
        .locator(".target-feedback")
        .getByText("Last summer, I go to Busan with my friends.", {
          exact: false,
        })
        .count()) > 0,
      "example must show actual transcript evidence",
    );
    await tab.screenshot({
      path: "output/playwright/target-feedback-example.png",
      fullPage: true,
    });
    await context.route("**/api/session", (route) =>
      route.fulfill({
        json: {
          user: { id: "qa", name: "UI 검증", email: null, demo: true },
          aiConfigured: true,
          sharing: true,
          authConfigured: true,
          authMode: "local",
          demoEnabled: true,
          showPlanWelcome: false,
          transcriptionConfigured: false,
          model: "test",
          effort: "medium",
        },
      }),
    );
    await context.route("**/api/exams", (route) =>
      route.fulfill({ json: { exams: [] } }),
    );
    await context.route("**/api/exams/target-preview", (route) =>
      route.fulfill({ json: { exam } }),
    );
    await context.route("**/api/exams/target-preview/evaluate", (route) => {
      evaluations++;
      exam.evaluation.targetFeedback = report;
      return route.fulfill({ json: { exam } });
    });
    await tab.goto(`${base}/?exam=target-preview`);
    await tab
      .getByRole("heading", { name: "IH 목표 피드백", exact: true })
      .waitFor();
    ensure(
      evaluations === 0,
      "legacy results must not automatically trigger a billed evaluation",
    );
    await tab
      .getByRole("button", {
        name: "목표 피드백 포함해 다시 평가",
        exact: true,
      })
      .click();
    await tab.locator('[data-target-status="not_observed"]').waitFor();
    ensure(
      evaluations === 1,
      "one explicit action should produce one evaluation request",
    );
    ensure(
      (await tab
        .getByRole("button", {
          name: "목표 피드백 포함해 다시 평가",
          exact: true,
        })
        .count()) === 0,
      "current coaching must not invite duplicate paid requests",
    );
    await tab
      .locator('[data-target-criterion="timeframes"]')
      .getByRole("button", { name: "Q2 답변 보기" })
      .click();
    ensure(
      (await tab
        .locator(".review-question")
        .nth(1)
        .getAttribute("aria-pressed")) === "true",
      "evidence link must select its referenced answer",
    );
    ensure(
      (await tab.locator(".english-prompt").innerText()) ===
        "Tell me about a trip.",
      "evidence navigation selected wrong prompt",
    );
    await tab.getByText("목표 기준과 출처", { exact: true }).click();
    ensure(
      (await tab
        .locator(".target-feedback")
        .getByRole("link", { name: "OPIc 공식 등급 설명" })
        .getAttribute("href")) ===
        "https://www.opic.co.kr/opics/servlet/controller.opic.site.about.AboutServlet?p_process=move-introduce-opic",
      "source link missing",
    );
    await tab.screenshot({
      path: "output/playwright/target-feedback-desktop.png",
      fullPage: true,
    });
    await tab.setViewportSize({ width: 390, height: 844 });
    ensure(
      await tab.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "mobile target panel overflow",
    );
    await tab.screenshot({
      path: "output/playwright/target-feedback-mobile.png",
      fullPage: true,
    });
    // A mismatching saved target report must not be relabelled as another grade.
    exam.config.target = "IM2";
    await tab.reload();
    await tab
      .getByRole("heading", { name: "IM2 목표 피드백", exact: true })
      .waitFor();
    ensure(
      (await tab.locator("[data-target-status]").count()) === 0,
      "mismatching saved report must not appear as IM2 feedback",
    );
    await tab.getByText("목표 기준과 출처", { exact: true }).click();
    await tab.getByText(/IM1·IM2·IM3은 공개된 IM 설명을 공통 바탕/).waitFor();
    ensure(
      evaluations === 1,
      "changing views must not automatically re-evaluate",
    );
    ensure(errors.length === 0, errors.join("; "));
    return {
      passed: true,
      mockedEvaluation: true,
      paidCalls: 0,
      assertions:
        "authored preview, target criteria and evidence, explicit legacy refresh, source links, question navigation, missing evidence, wrong-target cache, IM caveat, mobile layout",
    };
  } finally {
    await context.close();
  }
}
