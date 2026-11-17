async function checkPractice(page) {
  const context = await page
    .context()
    .browser()
    .newContext({ viewport: { width: 1440, height: 1080 } });
  const base = "http://127.0.0.1:3000";
  let examId;
  await context.addInitScript(() => {
    window.practiceMicDenied = true;
    navigator.mediaDevices.getUserMedia = async () => {
      if (window.practiceMicDenied)
        throw new DOMException("Permission denied", "NotAllowedError");
      const audio = new AudioContext(),
        oscillator = audio.createOscillator(),
        destination = audio.createMediaStreamDestination();
      oscillator.connect(destination);
      oscillator.start();
      const track = destination.stream.getAudioTracks()[0],
        stop = track.stop.bind(track);
      track.stop = () => {
        stop();
        oscillator.stop();
        void audio.close();
      };
      return destination.stream;
    };
    window.speechSynthesis.speak = (utterance) =>
      setTimeout(() => utterance.onend?.(new Event("end")), 50);
  });
  const tab = await context.newPage(),
    errors = [];
  tab.on("pageerror", (error) => errors.push(error.message));
  const ensure = (value, message) => {
    if (!value) throw new Error(message);
  };
  try {
    await tab.goto(`${base}/?view=bank`);
    await tab
      .getByRole("heading", { name: "문제 라이브러리", exact: true })
      .waitFor();
    const row = tab.locator(".question-library-row").first();
    const prompt = await row.locator('[lang="en"]').innerText();
    await row.getByRole("button", { name: "연습하기" }).click();
    await tab
      .getByRole("heading", { name: "한 문항 연습", exact: true })
      .waitFor();
    const questionId = new URL(tab.url()).searchParams.get("practice");
    ensure(
      (await tab.locator(".setup-steps").count()) === 0,
      "single practice must not show the survey wizard",
    );
    ensure(
      (await tab.locator('[lang="en"]').innerText()) === prompt,
      "selected prompt must be preserved",
    );
    await tab.getByRole("button", { name: "ChatGPT 연결 후 연습" }).click();
    await tab.getByRole("button", { name: "체험 계정으로 둘러보기" }).click();
    await tab.getByRole("dialog").waitFor({ state: "hidden" });
    ensure(
      await tab
        .getByRole("button", { name: "연습 시작", exact: true })
        .isDisabled(),
      "recording consent must be required",
    );
    // Exercise the same-origin return path without invoking live OAuth.
    await tab.goto(`${base}/?connected=1`);
    await tab
      .getByRole("heading", { name: "한 문항 연습", exact: true })
      .waitFor();
    ensure(
      new URL(tab.url()).searchParams.get("practice") === questionId,
      "connection return must keep the chosen question",
    );
    await tab.setViewportSize({ width: 390, height: 844 });
    ensure(
      await tab.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "mobile practice overflow",
    );
    await tab.screenshot({
      path: "output/playwright/single-practice-mobile.png",
      fullPage: true,
    });
    await tab.setViewportSize({ width: 1440, height: 1080 });
    await tab.getByRole("checkbox").check();
    await tab.getByRole("button", { name: "연습 시작", exact: true }).click();
    await tab
      .getByText("마이크 권한을 허용한 뒤 다시 시작해 주세요.", { exact: true })
      .waitFor();
    const before = await context.request.get(`${base}/api/exams`);
    ensure(
      (await before.json()).exams.length === 0,
      "permission denial must not create a practice record",
    );
    await tab.evaluate(() => {
      window.practiceMicDenied = false;
    });
    await tab.getByRole("button", { name: "연습 시작", exact: true }).click();
    await tab
      .getByRole("heading", { name: "Question 01", exact: true })
      .waitFor();
    examId = new URL(tab.url()).searchParams.get("exam");
    ensure(
      (await tab.locator(".english-prompt").innerText()) === prompt,
      "practice must open exactly the selected question",
    );
    await tab.getByRole("button", { name: /질문 듣기/ }).click();
    await tab.getByRole("button", { name: "답변 시작", exact: true }).click();
    await tab
      .getByRole("button", { name: "답변 마치고 복습", exact: true })
      .waitFor();
    await tab.waitForTimeout(400);
    await tab
      .getByRole("button", { name: "답변 마치고 복습", exact: true })
      .click();
    await tab
      .getByRole("heading", { name: "답변 복습", exact: true })
      .waitFor();
    const response = await context.request.get(`${base}/api/exams/${examId}`),
      { exam } = await response.json();
    ensure(
      exam.status === "completed" &&
        exam.questions.length === 1 &&
        exam.answers.length === 1 &&
        exam.config.topics.length === 0 &&
        exam.questions[0].id === questionId,
      "one answer must complete a single-question practice without a survey",
    );
    ensure(
      (
        await context.request.get(`${base}${exam.answers[0].audio}`)
      ).status() === 200,
      "practice audio must be stored",
    );
    await tab
      .getByRole("button", { name: "다시 연습하기", exact: true })
      .click();
    await tab
      .getByRole("heading", { name: "한 문항 연습", exact: true })
      .waitFor();
    ensure(
      (await tab.locator('[lang="en"]').innerText()) === prompt,
      "retry must keep the same question",
    );
    await tab.getByRole("button", { name: "문제 목록", exact: true }).click();
    await tab
      .getByRole("heading", { name: "문제 라이브러리", exact: true })
      .waitFor();
    await tab
      .getByRole("button", { name: "실전 모의시험", exact: true })
      .click();
    await tab
      .getByRole("heading", { name: "모의시험 준비", exact: true })
      .waitFor();
    ensure(
      (await tab.locator(".setup-steps li").count()) === 4,
      "simulation must keep the full orientation",
    );
    ensure(errors.length === 0, errors.join("; "));
    return {
      passed: true,
      syntheticMedia: true,
      assertions:
        "library selection, anonymous account connection return, consent, microphone denial without creating a record, exact single question, recording and one-answer completion, retry same question, mobile layout, simulation orientation preserved",
    };
  } finally {
    if (examId)
      await context.request.delete(`${base}/api/exams/${examId}`, {
        headers: { Origin: base },
      });
    await context.close();
  }
}
