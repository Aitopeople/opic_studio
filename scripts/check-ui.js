async function checkUi(page) {
  const browser = page.context().browser();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1080 },
  });
  await context.addInitScript(() => {
    // Only this QA context uses synthetic audio/narration/recognition. Production uses browser APIs.
    navigator.mediaDevices.getUserMedia = async () => {
      const audio = new AudioContext();
      const oscillator = audio.createOscillator();
      const destination = audio.createMediaStreamDestination();
      const gain = audio.createGain();
      gain.gain.value = 0.08;
      oscillator.connect(gain);
      gain.connect(destination);
      oscillator.start();
      const track = destination.stream.getAudioTracks()[0];
      const original = track.stop.bind(track);
      track.stop = () => {
        original();
        oscillator.stop();
        audio.close();
      };
      return destination.stream;
    };
    window.speechSynthesis.speak = (utterance) => {
      setTimeout(() => utterance.onend?.(new Event("end")), 100);
    };
    class TestRecognition {
      start() {
        this.timer = setTimeout(
          () =>
            this.onresult?.({
              resultIndex: 0,
              results: [
                {
                  isFinal: true,
                  0: {
                    transcript:
                      "Last summer I visited a small seaside town with my family. We planned to walk along the beach, but it started raining. We found a quiet cafe and spent the afternoon talking. That unexpected change made the trip memorable.",
                  },
                },
              ],
            }),
          150,
        );
      }
      stop() {
        clearTimeout(this.timer);
        setTimeout(() => this.onend?.(), 20);
      }
      abort() {
        clearTimeout(this.timer);
      }
    }
    window.SpeechRecognition = TestRecognition;
  });
  const tab = await context.newPage();
  const errors = [];
  tab.on("pageerror", (e) => errors.push(e.message));
  const ensure = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  try {
    await tab.goto("http://localhost:3000");
    await tab.getByRole("heading", { name: "학습 홈", exact: true }).waitFor();
    await tab.screenshot({
      path: "output/playwright/dashboard-desktop.png",
      fullPage: true,
    });
    const grid = await tab
      .locator(".grid-12")
      .first()
      .evaluate(
        (el) => getComputedStyle(el).gridTemplateColumns.split(" ").length,
      );
    ensure(grid === 12, "desktop grid must have 12 columns");
    const foundations = await tab.evaluate(() => {
      const style = (selector) =>
        getComputedStyle(document.querySelector(selector));
      return {
        body: style("body").fontSize,
        heading: style("h1").fontSize,
        gutter: style(".workspace-content").paddingLeft,
        panel: style('[data-slot="card-content"]').paddingLeft,
        sidebar: style('[data-slot="sidebar-gap"]').width,
        header: style(".workspace-topbar").height,
      };
    });
    ensure(
      JSON.stringify(foundations) ===
        JSON.stringify({
          body: "14px",
          heading: "24px",
          gutter: "32px",
          panel: "24px",
          sidebar: "256px",
          header: "56px",
        }),
      `foundation mismatch: ${JSON.stringify(foundations)}`,
    );
    await tab.getByRole("button", { name: "사이드바 토글" }).click();
    await tab.waitForFunction(
      () =>
        document
          .querySelector('[data-slot="sidebar-gap"]')
          .getBoundingClientRect().width === 48,
    );
    await tab.keyboard.press("Control+b");
    await tab.waitForFunction(
      () =>
        document
          .querySelector('[data-slot="sidebar-gap"]')
          .getBoundingClientRect().width === 256,
    );
    ensure(
      await tab.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "desktop overflow",
    );
    await tab
      .getByRole("button", { name: "ChatGPT 연결", exact: true })
      .click();
    await tab
      .getByRole("dialog")
      .getByRole("link", { name: "Continue with ChatGPT" })
      .waitFor();
    await tab.screenshot({
      path: "output/playwright/subscription-connect.png",
    });
    await tab.getByRole("button", { name: "체험 계정으로 둘러보기" }).click();
    await tab.getByRole("dialog").waitFor({ state: "hidden" });
    await tab
      .getByRole("button", { name: "실전 모의시험 시작", exact: true })
      .click();
    await tab
      .getByRole("heading", { name: "배경 설문", exact: true })
      .waitFor();
    await tab.screenshot({
      path: "output/playwright/survey.png",
      fullPage: true,
    });
    await tab.setViewportSize({ width: 320, height: 780 });
    const occupation = tab.getByRole("combobox", {
      name: "현재 하는 일",
      exact: true,
    });
    await occupation.click();
    await tab.getByRole("option", { name: "직장인", exact: true }).click();
    const headingInView = (el) => {
      const rect = el.getBoundingClientRect();
      const topbar = document
        .querySelector(".workspace-topbar")
        .getBoundingClientRect();
      return (
        document.activeElement === el &&
        rect.top >= topbar.bottom &&
        rect.bottom <= innerHeight
      );
    };
    await tab.getByRole("button", { name: "다음 단계", exact: true }).click();
    await tab
      .getByRole("heading", { name: "지금의 말하기 수준을 알려주세요." })
      .waitFor();
    ensure(
      await tab
        .getByRole("heading", { name: "지금의 말하기 수준을 알려주세요." })
        .evaluate(headingInView),
      "new step heading must be focused and visible",
    );
    ensure(
      (await tab.locator('[aria-current="step"]').innerText()).includes(
        "자기평가",
      ),
      "step progress must announce self-assessment",
    );
    const levels = tab.getByRole("radio");
    ensure(
      (await levels.count()) === 6 &&
        (await levels.evaluateAll((items) =>
          items.every((item) =>
            document
              .getElementById(item.getAttribute("aria-describedby"))
              ?.textContent.trim(),
          ),
        )),
      "each level must describe its speaking ability",
    );
    await tab.getByRole("button", { name: "이전 단계" }).click();
    ensure(
      await tab
        .getByRole("heading", { name: "배경 설문", exact: true })
        .evaluate(headingInView),
      "back must focus the previous step",
    );
    ensure(
      (await occupation.innerText()).includes("직장인"),
      "changing steps must preserve survey choices",
    );
    await tab.getByRole("button", { name: "다음 단계", exact: true }).click();
    await tab.setViewportSize({ width: 1440, height: 1080 });
    await tab.getByRole("button", { name: "다음 단계", exact: true }).click();
    await tab.getByRole("button", { name: "테스트 음성 듣기" }).click();
    await tab.getByRole("checkbox", { name: "소리가 잘 들립니다." }).check();
    await tab.getByRole("button", { name: "테스트 녹음", exact: true }).click();
    await tab
      .getByRole("button", { name: "녹음 마치기", exact: true })
      .waitFor();
    await tab.waitForTimeout(600);
    await tab.getByRole("button", { name: "녹음 마치기", exact: true }).click();
    await tab
      .getByRole("checkbox", { name: "내 목소리가 선명하게 녹음되었습니다." })
      .check();
    await tab.getByRole("button", { name: "다음 단계", exact: true }).click();
    await tab
      .getByRole("checkbox", {
        name: "녹음 저장·음성 인식 서비스·AI 평가의 외부 전송을 확인했습니다.",
      })
      .check();
    await tab
      .getByRole("button", { name: "모의시험 시작", exact: true })
      .click();
    await tab
      .getByRole("heading", { name: "Question 01", exact: true })
      .waitFor();
    ensure(
      (await tab.locator(".english-prompt").count()) === 0,
      "simulation must hide subtitles",
    );
    await tab.screenshot({
      path: "output/playwright/exam-room.png",
      fullPage: true,
    });
    for (let i = 1; i <= 7; i++) {
      await tab
        .getByRole("heading", {
          name: `Question ${String(i).padStart(2, "0")}`,
          exact: true,
        })
        .waitFor();
      await tab.getByRole("button", { name: /질문 듣기/ }).click();
      await tab.getByRole("button", { name: "답변 시작", exact: true }).click();
      await tab
        .getByRole("button", { name: "답변 마치고 다음", exact: true })
        .waitFor();
      await tab.waitForTimeout(350);
      await tab
        .getByRole("button", { name: "답변 마치고 다음", exact: true })
        .click();
    }
    await tab
      .getByRole("heading", { name: "다음 질문의 난이도를 선택해 주세요." })
      .waitFor();
    await tab.screenshot({
      path: "output/playwright/difficulty-adjustment.png",
      fullPage: true,
    });
    await tab
      .getByRole("button", { name: /어려운 질문 조금 더 복잡한 수준으로/ })
      .click();
    await tab
      .getByRole("heading", { name: "Question 08", exact: true })
      .waitFor();
    await tab.reload();
    await tab
      .getByRole("heading", { name: "Question 08", exact: true })
      .waitFor();
    await tab.getByRole("button", { name: "종료", exact: true }).click();
    await tab.getByRole("button", { name: "저장하고 종료" }).click();
    await tab
      .getByRole("heading", { name: "답변 복습", exact: true })
      .waitFor();
    ensure(
      (await tab
        .locator(".grid-item")
        .filter({ has: tab.locator(".metric-card") })
        .first()
        .evaluate((el) => getComputedStyle(el).gridColumnStart)) === "span 3",
      "desktop review metrics must occupy four equal columns",
    );
    ensure(
      (await tab.locator("audio").count()) === 1,
      "stored recording playback must be available",
    );
    const audioUrl = await tab.locator("audio").getAttribute("src");
    const audio = await context.request.get(`http://localhost:3000${audioUrl}`);
    ensure(
      audio.status() === 200 && (await audio.body()).length > 100,
      "audio bytes must be stored and readable by owner",
    );
    await tab.evaluate(() => window.scrollTo(0, 0));
    await tab.screenshot({
      path: "output/playwright/review.png",
      fullPage: true,
    });
    await tab.setViewportSize({ width: 390, height: 844 });
    ensure(
      await tab.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "mobile review overflow",
    );
    await tab.screenshot({
      path: "output/playwright/review-mobile.png",
      fullPage: true,
    });
    await tab.setViewportSize({ width: 1440, height: 1080 });
    const metadata = await tab.evaluate(() => ({
      font: getComputedStyle(document.body).fontFamily,
      overflow: document.documentElement.scrollWidth > innerWidth,
    }));
    await tab.getByRole("button", { name: "학습 기록으로 돌아가기" }).click();
    await tab
      .getByRole("button", { name: /시험 삭제/ })
      .first()
      .click();
    await tab.getByRole("button", { name: "기록 삭제", exact: true }).click();
    await tab.getByText("학습 기록이 없습니다", { exact: true }).waitFor();
    await tab
      .getByRole("button", { name: "문제 라이브러리", exact: true })
      .first()
      .click();
    await tab.setViewportSize({ width: 320, height: 780 });
    await tab.getByRole("link", { name: "다음 페이지" }).click();
    ensure(
      await tab
        .getByRole("heading", { name: /연습 문제.*2페이지/ })
        .evaluate(headingInView),
      "paging must focus the new results below the header",
    );
    const firstRow = await tab
      .locator(".question-library-row")
      .first()
      .boundingBox();
    ensure(
      firstRow.y >= 0 && firstRow.y + firstRow.height <= 780,
      "first question on the new page must be visible",
    );
    const search = tab.getByRole("textbox", { name: "문제 검색" });
    await search.fill("카페");
    ensure(
      await search.evaluate((el) => el === document.activeElement),
      "filtering from page two must keep search focus",
    );
    await tab.setViewportSize({ width: 1440, height: 1080 });
    ensure(
      (await tab.locator(".question-library-row").count()) > 0,
      "library search should match Korean topic names",
    );
    await tab.getByRole("button", { name: "학습 홈", exact: true }).click();
    await tab.setViewportSize({ width: 390, height: 844 });
    await tab
      .locator('[data-slot="sidebar-container"]')
      .waitFor({ state: "hidden" });
    ensure(
      await tab.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "mobile dashboard overflow",
    );
    await tab.screenshot({
      path: "output/playwright/dashboard-mobile.png",
      fullPage: true,
    });
    const mobileGutter = await tab
      .locator(".workspace-content")
      .evaluate((el) => getComputedStyle(el).paddingLeft);
    ensure(mobileGutter === "16px", "mobile gutter must be 16px");
    await tab.getByRole("button", { name: "사이드바 토글" }).click();
    await tab.getByRole("dialog").waitFor();
    await tab
      .getByRole("dialog")
      .evaluate((el) =>
        Promise.all(
          el
            .getAnimations({ subtree: true })
            .map((animation) => animation.finished),
        ),
      );
    await tab.keyboard.press("Escape");
    await tab.getByRole("dialog").waitFor({ state: "hidden" });
    await tab.getByRole("button", { name: "사이드바 토글" }).click();
    await tab.getByRole("button", { name: "시험 가이드", exact: true }).click();
    await tab
      .getByRole("heading", { name: "시험 가이드", exact: true })
      .waitFor();
    ensure(
      await tab.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "mobile guide overflow",
    );
    ensure(errors.length === 0, `runtime errors: ${errors.join("; ")}`);
    return {
      passed: true,
      syntheticMedia: true,
      gridColumns: grid,
      foundations,
      metadata,
      assertions:
        "desktop/mobile layout, subscription CTA, survey, equipment check, 7 audio submissions with browser transcript, mandatory adjustment, refresh resume, recording playback, review, delete, library search",
    };
  } finally {
    await context.close();
  }
}
