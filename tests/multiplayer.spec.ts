import { test, expect, type Page } from "@playwright/test";
test.setTimeout(120000);
test.beforeEach(async ({ request }) => {
  const response = await request.delete(
    "http://127.0.0.1:9000/.json?ns=demo-dot-social-default-rtdb",
    { headers: { Authorization: "Bearer owner" } },
  );
  expect(response.ok()).toBe(true);
});
async function enter(page: Page, name: string) {
  await page.goto("/?mode=emulator");
  await page.getByLabel("닉네임").fill(name);
  await page.getByRole("button", { name: "느긋한 공원 입장하기" }).click();
  await expect(page.getByTestId("position")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await expect(page.getByTestId("player-count")).toHaveText(/^[1-8]\/8$/);
}
test("독립 Firebase 세션의 채팅·이모트·가위바위보·오목·방 분리", async ({
  browser,
}) => {
  const first = await browser.newContext(),
    second = await browser.newContext(),
    a = await first.newPage(),
    b = await second.newPage(),
    errors: string[] = [];
  a.on("pageerror", (e) => errors.push(e.message));
  b.on("pageerror", (e) => errors.push(e.message));
  try {
    await enter(a, "하늘친구");
    await enter(b, "구름친구");
    await expect(a.getByTestId("player-count")).toHaveText("2/8");
    await expect(b.getByTestId("player-count")).toHaveText("2/8");
    await a.getByLabel("채팅 메시지").fill("안녕하세요 👋");
    await a.getByRole("button", { name: "메시지 보내기" }).click();
    await expect(b.getByRole("log")).toContainText("안녕하세요 👋");
    await b
      .getByRole("button", { name: "하늘친구 님 음소거", exact: true })
      .click();
    await expect(b.getByRole("log")).not.toContainText("안녕하세요 👋");
    await b
      .getByRole("button", { name: "하늘친구 님 음소거 해제", exact: true })
      .click();
    await expect(b.getByRole("log")).toContainText("안녕하세요 👋");
    await a.getByRole("button", { name: "기뻐하기", exact: true }).click();
    await expect(b.locator(".big-emote")).toContainText("✨");
    await a
      .getByRole("button", { name: "구름친구 님에게 가위바위보 초대" })
      .click();
    await b.getByRole("button", { name: "초대 수락" }).click();
    await a.getByRole("button", { name: "바위", exact: true }).click();
    await b.getByRole("button", { name: "가위", exact: true }).click();
    await expect(a.locator(".game-status")).toContainText("이겼어요");
    await expect(b.locator(".game-status")).toContainText("아쉽지만");
    await a.screenshot({ path: "artifacts/rps-result.png", fullPage: true });
    await a.getByRole("button", { name: "닫기", exact: true }).click();
    await b.getByRole("button", { name: "닫기", exact: true }).click();
    await a.getByRole("button", { name: "구름친구 님에게 오목 초대" }).click();
    await b.getByRole("button", { name: "초대 수락" }).click();
    for (let i = 0; i < 4; i++) {
      await a
        .getByRole("button", { name: `8행 ${i + 4}열`, exact: true })
        .click();
      await expect(b.locator(".game-status")).toContainText("내 차례");
      await b
        .getByRole("button", { name: `9행 ${i + 4}열`, exact: true })
        .click();
      await expect(a.locator(".game-status")).toContainText("내 차례");
    }
    await a.getByRole("button", { name: "8행 8열", exact: true }).click();
    await expect(a.locator(".game-status")).toContainText("이겼어요");
    await expect(b.locator(".game-status")).toContainText("상대방이 이겼어요");
    await a.screenshot({ path: "artifacts/gomoku-result.png", fullPage: true });
    await a.getByRole("button", { name: "닫기", exact: true }).click();
    await b.getByRole("button", { name: "닫기", exact: true }).click();
    await b.getByLabel("맵 변경").selectOption("cafe");
    await expect(a.getByTestId("player-count")).toHaveText("1/8");
    await expect(b.getByTestId("player-count")).toHaveText("1/8");
    await expect(b.getByRole("log")).not.toContainText("안녕하세요");
    expect(errors).toEqual([]);
  } finally {
    await first.close();
    await second.close();
  }
});
test("Firebase 연결 끊김, 새로고침, 유령 참가자 정리", async ({
  browser,
  request,
}) => {
  const first = await browser.newContext(),
    second = await browser.newContext(),
    a = await first.newPage(),
    b = await second.newPage();
  try {
    await enter(a, "연결친구");
    await enter(b, "확인친구");
    await expect(b.getByTestId("player-count")).toHaveText("2/8");
    await first.setOffline(true);
    await expect(a.locator(".you-card")).toContainText("재연결", {
      timeout: 20000,
    });
    await expect(b.getByTestId("player-count")).toHaveText("1/8", {
      timeout: 20000,
    });
    await a.keyboard.down("ArrowRight");
    await expect
      .poll(async () =>
        Number(await a.getByTestId("position").getAttribute("data-x")),
      )
      .toBeGreaterThan(0.5);
    await a.keyboard.up("ArrowRight");
    await first.setOffline(false);
    await expect(b.getByTestId("player-count")).toHaveText("2/8", {
      timeout: 20000,
    });
    await expect
      .poll(
        async () => {
          const response = await request.get(
            "http://127.0.0.1:9000/rooms/park/players.json?ns=demo-dot-social-default-rtdb",
            { headers: { Authorization: "Bearer owner" } },
          );
          const players = Object.values(await response.json()) as {
            profile: { nickname: string };
            x: number;
          }[];
          return (
            players.find((p) => p?.profile.nickname === "연결친구")?.x ?? 0
          );
        },
        { timeout: 20000 },
      )
      .toBeGreaterThan(0.5);
    await a.reload();
    await a.getByRole("button", { name: "느긋한 공원 입장하기" }).click();
    await expect(a.getByTestId("player-count")).toHaveText("2/8", {
      timeout: 20000,
    });
    await first.close();
    await expect(b.getByTestId("player-count")).toHaveText("1/8", {
      timeout: 20000,
    });
  } finally {
    await first.close();
    await second.close();
  }
});
