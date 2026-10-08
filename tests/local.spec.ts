import { test, expect } from "@playwright/test";
test("캐릭터 저장, 이동, 입력 차단, 큰 이모트", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/?mode=local");
  await page.getByLabel("닉네임").fill("산책친구");
  await page.getByRole("button", { name: "단발", exact: true }).click();
  await page.getByRole("button", { name: "긴머리", exact: true }).click();
  await page.getByRole("button", { name: "모자", exact: true }).click();
  await page.getByRole("button", { name: "상의 색상 3", exact: true }).click();
  await page.reload();
  await expect(page.getByLabel("닉네임")).toHaveValue("산책친구");
  await expect(
    page.getByRole("button", { name: "긴머리", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.screenshot({
    path: "artifacts/lobby-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "느긋한 공원 입장하기" }).click();
  const marker = page.getByTestId("position");
  await expect(marker).toHaveAttribute("data-ready", "true");
  await page.keyboard.down("ArrowRight");
  await expect
    .poll(async () => Number(await marker.getAttribute("data-x")))
    .toBeGreaterThan(0.5);
  await page.keyboard.up("ArrowRight");
  await page.waitForTimeout(250);
  const x = Number(await marker.getAttribute("data-x"));
  await page.getByLabel("채팅 메시지").focus();
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(300);
  await page.keyboard.up("ArrowRight");
  expect(Number(await marker.getAttribute("data-x"))).toBeCloseTo(x, 2);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "공원 조작 도움말" }).click();
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(300);
  await page.keyboard.up("ArrowRight");
  expect(Number(await marker.getAttribute("data-x"))).toBeCloseTo(x, 2);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "손 흔들기", exact: true }).click();
  await expect(page.locator(".big-emote")).toContainText("👋");
  await page.screenshot({ path: "artifacts/park-wave.png", fullPage: true });
  await expect(
    page.getByRole("button", { name: "손 흔들기", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("그래픽").selectOption("low");
  await expect(page.getByLabel("그래픽")).toHaveValue("low");
  expect(errors).toEqual([]);
  await page.getByRole("button", { name: "홈으로", exact: true }).click();
  await page.getByLabel("닉네임").fill("a");
  await expect(
    page.getByRole("button", { name: "느긋한 공원 입장하기" }),
  ).toBeDisabled();
});
test("모든 맵 입장과 모바일 화면 검증", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?mode=local");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "artifacts/lobby-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "느긋한 공원 입장하기" }).click();
  for (const id of ["park", "rooftop", "office", "cafe", "beach"]) {
    if (id !== "park") await page.getByLabel("맵 변경").selectOption(id);
    await expect(page.getByTestId("position")).toHaveAttribute(
      "data-ready",
      "true",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `artifacts/map-${id}-mobile.png`,
      fullPage: true,
    });
  }
  await page.getByRole("button", { name: "홈으로", exact: true }).click();
});
test("같은 브라우저 탭의 실제 로컬 채팅과 방 분리", async ({
  context,
  page,
}) => {
  const other = await context.newPage();
  await page.goto("/?mode=local");
  await page.getByLabel("닉네임").fill("하늘친구");
  await page.getByRole("button", { name: "느긋한 공원 입장하기" }).click();
  await other.goto("/?mode=local");
  await other.getByLabel("닉네임").fill("구름친구");
  await other.getByRole("button", { name: "느긋한 공원 입장하기" }).click();
  await expect(page.getByTestId("player-count")).toHaveText("2/8");
  await expect(other.getByTestId("player-count")).toHaveText("2/8");
  await page.getByLabel("채팅 메시지").fill("안녕, 작은 세상!");
  await page.getByRole("button", { name: "메시지 보내기" }).click();
  await expect(other.getByRole("log")).toContainText("안녕, 작은 세상!");
  await page.getByRole("button", { name: "홈으로", exact: true }).click();
  await expect(other.getByRole("log")).not.toContainText("안녕, 작은 세상!");
  await page.getByRole("button", { name: "느긋한 공원 입장하기" }).click();
  await other.getByLabel("맵 변경").selectOption("cafe");
  await expect(page.getByTestId("player-count")).toHaveText("1/8");
  await expect(other.getByRole("log")).not.toContainText("안녕, 작은 세상!");
  await page.getByRole("button", { name: "홈으로", exact: true }).click();
  await other.getByRole("button", { name: "홈으로", exact: true }).click();
});

test("모바일 터치 방향키 이동·해제·모달 차단", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  try {
    await page.goto("/?mode=local");
    await page.getByRole("button", { name: "느긋한 공원 입장하기" }).click();
    const marker = page.getByTestId("position");
    await expect(marker).toHaveAttribute("data-ready", "true");
    const right = page.getByRole("button", { name: "오른쪽으로 이동" });
    // Real pointer events are shared by mouse and touch; keep a touch held across frames.
    const client = await context.newCDPSession(page);
    const box = await right.boundingBox();
    if (!box) throw new Error("Missing direction pad");
    await client.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }],
    });
    await expect
      .poll(async () => Number(await marker.getAttribute("data-x")))
      .toBeGreaterThan(0.5);
    await client.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await page.waitForTimeout(150);
    const x = Number(await marker.getAttribute("data-x"));
    await page.waitForTimeout(300);
    expect(Number(await marker.getAttribute("data-x"))).toBeCloseTo(x, 2);
    await page.screenshot({
      path: "artifacts/mobile-direction-pad.png",
      fullPage: true,
    });
    await page.getByRole("button", { name: "공원 조작 도움말" }).click();
    await expect(right).toBeDisabled();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "홈으로", exact: true }).click();
  } finally {
    await context.close();
  }
});
test("한글 IME 조합 중 Enter는 전송하지 않음", async ({ page }) => {
  await page.goto("/?mode=local");
  await page.getByRole("button", { name: "느긋한 공원 입장하기" }).click();
  const input = page.getByLabel("채팅 메시지");
  await input.fill("한글 조합 중");
  await input.evaluate((el) =>
    el.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        code: "Enter",
        bubbles: true,
        isComposing: true,
      }),
    ),
  );
  await expect(input).toHaveValue("한글 조합 중");
  await expect(page.getByRole("log")).not.toContainText("한글 조합 중");
  await input.press("Enter");
  await expect(page.getByRole("log")).toContainText("한글 조합 중");
  await page.getByRole("button", { name: "홈으로", exact: true }).click();
});
