import { test, expect } from "@playwright/test";

test("외형 저장·백경광장·소품과 새 표현 동기화·욕설 차단", async ({
  browser,
  request,
}) => {
  test.setTimeout(120000);
  const first = await browser.newContext(),
    second = await browser.newContext();
  const a = await first.newPage(),
    b = await second.newPage();
  const errors: string[] = [];
  a.on("pageerror", (e) => errors.push(e.message));
  b.on("pageerror", (e) => errors.push(e.message));
  const url =
    "http://127.0.0.1:9000/rooms/campus/players.json?ns=demo-dot-social-default-rtdb";
  try {
    await a.goto("/?mode=emulator");
    await a.getByLabel("닉네임").fill("벚꽃친구");
    await a.getByRole("button", { name: "윙크 얼굴", exact: true }).click();
    await a.getByRole("button", { name: "헤드폰", exact: true }).click();
    for (const name of ["머리 색상 8", "피부 색상 5", "액세서리 색상 8"])
      await a.getByRole("button", { name, exact: true }).click();
    await a.reload();
    await expect(
      a.getByRole("button", { name: "윙크 얼굴", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      a.getByRole("button", { name: "피부 색상 5", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    for (const [page, name] of [
      [a, "벚꽃친구"],
      [b, "광장친구"],
    ] as const) {
      if (page === b) await page.goto("/?mode=emulator");
      await page.getByLabel("닉네임").fill(name);
      await page
        .locator(".map-card")
        .filter({ hasText: "부경대학교 백경광장" })
        .click();
      await page
        .getByRole("button", { name: "부경대학교 백경광장 입장하기" })
        .click();
    }
    await expect(b.getByTestId("player-count")).toHaveText("2/8", {
      timeout: 20000,
    });
    await expect(a.getByTestId("position")).toHaveAttribute(
      "data-ready",
      "true",
      { timeout: 20000 },
    );
    await a
      .getByRole("button", { name: "동아리 게시판 읽기", exact: true })
      .click();
    await expect(b.locator(".activity-label")).toContainText(
      "동아리 게시판 읽기",
    );
    await a.waitForTimeout(1000);
    await expect(b.locator(".activity-label")).toContainText(
      "동아리 게시판 읽기",
    );
    const players = Object.values(
      await (
        await request.get(url, { headers: { Authorization: "Bearer owner" } })
      ).json(),
    ) as any[];
    const friend = players.find((p) => p?.profile.nickname === "벚꽃친구");
    expect(friend.profile).toMatchObject({
      face: "wink",
      skin: 4,
      hair: 7,
      accessory: "headphones",
      accessoryColor: 7,
    });
    expect(friend.activity).toMatchObject({ id: "campus-board", kind: "read" });
    await a.screenshot({
      path: "artifacts/campus-desktop.png",
      fullPage: true,
    });
    await a.keyboard.down("ArrowRight");
    await expect(b.locator(".activity-label")).toHaveCount(0);
    await a.keyboard.up("ArrowRight");
    for (const [name, icon] of [
      ["춤추기", "🎵"],
      ["박수치기", "👏"],
      ["하트 보내기", "💗"],
    ]) {
      const button = a.getByRole("button", { name, exact: true });
      await expect(button).toBeEnabled({ timeout: 10000 });
      await button.click();
      await expect(b.locator(".big-emote")).toContainText(icon);
    }
    const input = a.getByLabel("채팅 메시지");
    await input.fill("씨 발");
    await a.getByRole("button", { name: "메시지 보내기" }).click();
    await expect(a.getByRole("alert")).toContainText("욕설이 포함된");
    await expect(input).toHaveValue("씨 발");
    await expect(b.getByRole("log")).not.toContainText("씨 발");
    await input.fill("벚꽃이 예쁘네요");
    await a.getByRole("button", { name: "메시지 보내기" }).click();
    await expect(b.getByRole("log")).toContainText("벚꽃이 예쁘네요");
    await a.setViewportSize({ width: 390, height: 844 });
    await a
      .getByRole("button", { name: "동아리 게시판 읽기", exact: true })
      .click();
    await a.screenshot({
      path: "artifacts/campus-interaction-mobile.png",
      fullPage: true,
    });
    expect(
      await a.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
    for (const page of [a, b])
      await page.getByRole("button", { name: "홈으로", exact: true }).click();
  } finally {
    await first.close();
    await second.close();
  }
});
