async function checkListening(page) {
  const context = await page
    .context()
    .browser()
    .newContext({ viewport: { width: 1440, height: 1080 } });
  await context.addInitScript(() => {
    // Controlled synthesis events validate playback UX, not audible voice quality.
    window.speechLog = [];
    window.currentSpeech = null;
    window.failSpeech = false;
    window.speechSynthesis.speak = (speech) => {
      window.currentSpeech = speech;
      window.speechLog.push({
        action: "speak",
        text: speech.text,
        rate: speech.rate,
        lang: speech.lang,
      });
      if (window.failSpeech)
        queueMicrotask(() => speech.onerror?.({ error: "audio-busy" }));
    };
    window.speechSynthesis.cancel = () => {
      const previous = window.currentSpeech;
      window.currentSpeech = null;
      window.speechLog.push({ action: "cancel" });
      if (previous)
        queueMicrotask(() => previous.onerror?.({ error: "interrupted" }));
    };
    window.speechSynthesis.resume = () => {};
  });
  const tab = await context.newPage(),
    errors = [];
  tab.on("pageerror", (e) => errors.push(e.message));
  const ensure = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const lastSpeech = () =>
    tab.evaluate(() =>
      window.speechLog.filter((event) => event.action === "speak").at(-1),
    );
  try {
    await tab.goto("http://127.0.0.1:3000/?view=example");
    await tab
      .getByRole("heading", { name: "교정 예시", exact: true })
      .waitFor();
    const cards = tab.locator(".grammar-card");
    await cards
      .nth(0)
      .getByRole("button", { name: "교정문 듣기", exact: true })
      .click();
    let speech = await lastSpeech();
    ensure(
      speech.text === "Last summer, I went to Busan with my friends." &&
        Math.abs(speech.rate - 0.9) < 0.001 &&
        speech.lang === "en-US",
      "must speak corrected English at the selected speed",
    );
    await cards
      .nth(0)
      .getByRole("button", { name: "교정문 듣기 정지" })
      .waitFor();
    await cards
      .nth(1)
      .getByRole("button", { name: "교정문 듣기", exact: true })
      .click();
    ensure(
      (await cards
        .nth(0)
        .getByRole("button", { name: "교정문 듣기", exact: true })
        .getAttribute("aria-pressed")) === "false",
      "previous sentence must stop",
    );
    const secondSentence = await cards
      .nth(1)
      .locator("p.grammar-corrected")
      .innerText();
    ensure(
      secondSentence.includes("many pictures") &&
        (await lastSpeech()).text === secondSentence,
      "new sentence must replace previous speech",
    );
    await tab.getByRole("combobox", { name: "교정문 읽기 속도" }).click();
    await tab.getByRole("option", { name: "0.75×", exact: true }).click();
    speech = await lastSpeech();
    ensure(
      speech.text === secondSentence && speech.rate === 0.75,
      "changing speed must restart the current text at the new rate",
    );
    await cards
      .nth(1)
      .getByRole("button", { name: "교정문 듣기 정지" })
      .click();
    ensure(
      await tab.evaluate(() => window.currentSpeech === null),
      "stop must clear active speech",
    );
    const busan = cards
      .nth(0)
      .getByRole("button", { name: "Busan부터 듣기", exact: true });
    await busan.click();
    ensure(
      (await lastSpeech()).text === "Busan with my friends.",
      "a word click must start at that exact word",
    );
    const countBeforeRepeat = await tab.evaluate(
      () => window.speechLog.filter((event) => event.action === "speak").length,
    );
    await busan.click();
    ensure(
      (await tab.evaluate(
        () =>
          window.speechLog.filter((event) => event.action === "speak").length,
      )) ===
        countBeforeRepeat + 1,
      "clicking the same word must restart that passage",
    );
    const firstWord = cards
      .nth(0)
      .getByRole("button", { name: "I부터 듣기", exact: true });
    await firstWord.focus();
    await firstWord.press("ArrowRight");
    await tab.keyboard.press("Enter");
    ensure(
      (await lastSpeech()).text === "went to Busan with my friends.",
      "keyboard word selection must support playback",
    );
    await tab.getByRole("button", { name: "모두 정지", exact: true }).click();
    const countBeforeSelect = await tab.evaluate(
      () => window.speechLog.filter((event) => event.action === "speak").length,
    );
    await cards
      .nth(0)
      .locator("p.grammar-corrected")
      .evaluate((element) => {
        const range = document.createRange();
        range.selectNodeContents(element);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      });
    await busan.dispatchEvent("click");
    ensure(
      (await tab.evaluate(
        () =>
          window.speechLog.filter((event) => event.action === "speak").length,
      )) === countBeforeSelect,
      "copying selected text must not start speech",
    );
    await tab.evaluate(() => window.getSelection().removeAllRanges());
    await tab
      .getByRole("button", { name: "표현 제안 듣기", exact: true })
      .click();
    const suggestedSentence = await tab
      .locator(".grammar-card")
      .filter({ has: tab.getByRole("button", { name: "표현 제안 듣기 정지" }) })
      .locator("p.grammar-corrected")
      .innerText();
    ensure(
      suggestedSentence.includes("I had a great time on the trip.") &&
        (await lastSpeech()).text === suggestedSentence,
      "optional suggestions must also be audible",
    );
    const full = tab.locator('[data-slot="card"]').filter({
      has: tab.getByText("문법 수정만 적용한 전체 답변", { exact: true }),
    });
    const expected = await full.locator('[lang="en"]').innerText();
    await tab.evaluate(() => {
      window.speechLog = [];
    });
    await tab
      .getByRole("button", { name: "전체 답변 듣기", exact: true })
      .click();
    for (let i = 0; i < 100; i++) {
      const pending = await tab.evaluate(() => {
        const speech = window.currentSpeech;
        if (!speech) return false;
        window.currentSpeech = null;
        speech.onend?.(new Event("end"));
        return true;
      });
      if (!pending) break;
    }
    const spoken = await tab.evaluate(() =>
      window.speechLog
        .filter((event) => event.action === "speak")
        .map((event) => event.text)
        .join(" "),
    );
    ensure(
      spoken === expected.replace(/\s+/g, " "),
      "all corrected paragraphs must be read in order without optional rewrites",
    );
    await tab
      .getByRole("button", { name: "전체 답변 듣기", exact: true })
      .waitFor();
    await cards
      .nth(0)
      .getByRole("button", { name: "교정문 듣기", exact: true })
      .click();
    await tab.evaluate(() => {
      const audio = document.createElement("audio");
      document.body.append(audio);
      audio.dispatchEvent(new Event("play", { bubbles: false }));
      audio.remove();
    });
    ensure(
      await tab.evaluate(() => window.currentSpeech === null),
      "recording playback must interrupt synthesized speech",
    );
    await cards
      .nth(0)
      .getByRole("button", { name: "교정문 듣기", exact: true })
      .click();
    await tab
      .getByRole("button", { name: "문제 라이브러리", exact: true })
      .first()
      .click();
    await tab
      .getByRole("heading", { name: "문제 라이브러리", exact: true })
      .waitFor();
    ensure(
      await tab.evaluate(() => window.currentSpeech === null),
      "navigation must stop playback",
    );
    await tab.getByRole("button", { name: "학습 홈", exact: true }).click();
    await tab
      .getByRole("button", { name: "교정 예시 보기", exact: true })
      .click();
    await tab.evaluate(() => {
      window.failSpeech = true;
    });
    await tab
      .locator(".grammar-card")
      .first()
      .getByRole("button", { name: "교정문 듣기", exact: true })
      .click();
    await tab
      .getByText(
        "음성을 재생하지 못했습니다. 기기의 영어 음성과 소리 출력을 확인하고 다시 시도해 주세요.",
        { exact: true },
      )
      .waitFor();
    await tab.evaluate(() => {
      window.failSpeech = false;
    });
    await tab.setViewportSize({ width: 390, height: 844 });
    ensure(
      await tab.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "mobile playback controls must not overflow",
    );
    await tab
      .locator(".grammar-card")
      .first()
      .getByRole("button", { name: "교정문 듣기", exact: true })
      .click();
    await tab.screenshot({
      path: "output/playwright/correction-listening-mobile.png",
      fullPage: true,
    });
    await tab.getByRole("button", { name: "모두 정지", exact: true }).click();
    ensure(
      await tab.evaluate(() => window.currentSpeech === null),
      "global stop must clear playback",
    );
    await tab.setViewportSize({ width: 1440, height: 1080 });
    await tab.evaluate(() => window.scrollTo(0, 0));
    await tab.screenshot({
      path: "output/playwright/correction-listening-desktop.png",
      fullPage: true,
    });
    ensure(errors.length === 0, errors.join("; "));
    return {
      passed: true,
      mockedSynthesis: true,
      assertions:
        "corrected sentence, word click and repeat, keyboard word navigation, copy selection, optional expression, speed change, single active speaker, stop/replay, whole answer in order, recording interruption, navigation cleanup, playback failure, mobile layout",
    };
  } finally {
    await context.close();
  }
}
