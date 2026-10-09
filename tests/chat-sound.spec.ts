import { test, expect, type Page } from "@playwright/test";

test("새 채팅만 알림음: 송수신·사용자 음소거·전체 소리·재입장", async ({
  context,
}) => {
  test.setTimeout(120000);
  await context.addInitScript(() => {
    (window as any).chatToneCount = 0;
    const original = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function () {
      const oscillator = original.call(this),
        start = oscillator.start.bind(oscillator);
      oscillator.start = (...args: Parameters<typeof start>) => {
        if (oscillator.type === "sine") (window as any).chatToneCount++;
        start(...args);
      };
      return oscillator;
    };
  });
  const a = await context.newPage(),
    b = await context.newPage();
  const tones = (page: Page) =>
    page.evaluate(() => (window as any).chatToneCount);
  const enter = async (page: Page, name: string) => {
    await page.goto("/?mode=local");
    await page.getByLabel("닉네임").fill(name);
    await page.getByRole("button", { name: "느긋한 공원 입장하기" }).click();
    await expect(page.getByTestId("player-count")).toHaveText(/^[1-8]\/8$/, {
      timeout: 15000,
    });
  };
  const send = async (text: string) => {
    // Respect the existing one-second chat anti-spam limit.
    await a.waitForTimeout(1050);
    await a.getByLabel("채팅 메시지").fill(text);
    await a.getByRole("button", { name: "메시지 보내기" }).click();
    await expect(a.getByRole("log")).toContainText(text);
  };
  await enter(a, "보내는친구");
  await enter(b, "받는친구");
  expect(await tones(a)).toBe(0);
  expect(await tones(b)).toBe(0);
  await send("첫 알림 테스트");
  await expect(b.getByRole("log")).toContainText("첫 알림 테스트");
  await expect.poll(() => tones(a)).toBe(1);
  await expect.poll(() => tones(b)).toBe(1);
  await b
    .getByRole("button", { name: "보내는친구 님 음소거", exact: true })
    .click();
  await send("사용자 음소거 테스트");
  await expect.poll(() => tones(a)).toBe(2);
  await expect(b.getByRole("log")).not.toContainText("사용자 음소거 테스트");
  await b
    .getByRole("button", { name: "보내는친구 님 음소거 해제", exact: true })
    .click();
  await expect(b.getByRole("log")).toContainText("사용자 음소거 테스트");
  expect(await tones(b)).toBe(1);
  await b.getByRole("button", { name: "배경음과 효과음 끄기" }).click();
  await send("전체 소리 끄기 테스트");
  await expect(b.getByRole("log")).toContainText("전체 소리 끄기 테스트");
  await expect.poll(() => tones(a)).toBe(3);
  expect(await tones(b)).toBe(1);
  await b.getByRole("button", { name: "배경음과 효과음 켜기" }).click();
  expect(await tones(b)).toBe(1);
  await b.getByLabel("맵 변경").selectOption("cafe");
  await expect(b.getByRole("log")).not.toContainText("첫 알림 테스트");
  await b.getByLabel("맵 변경").selectOption("park");
  await expect(b.getByRole("log")).toContainText("첫 알림 테스트");
  expect(await tones(b)).toBe(1);
  await send("다시 새 메시지");
  await expect(b.getByRole("log")).toContainText("다시 새 메시지");
  await expect.poll(() => tones(a)).toBe(4);
  await expect.poll(() => tones(b)).toBe(2);
  await b.getByRole("button", { name: "홈으로", exact: true }).click();
  await enter(b, "새로운친구");
  await expect(b.getByRole("log")).toContainText("다시 새 메시지");
  expect(await tones(b)).toBe(0);
});
