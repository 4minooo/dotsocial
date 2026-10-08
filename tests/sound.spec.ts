import { test, expect } from "@playwright/test";
test("맵 환경음 재생·전환·소리 설정 저장과 5종 음원 생성", async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).ambientStarts = 0;
    const original = AudioContext.prototype.createBufferSource;
    AudioContext.prototype.createBufferSource = function () {
      (window as any).audioContext = this;
      const source = original.call(this),
        start = source.start.bind(source);
      source.start = (...args: Parameters<typeof start>) => {
        (window as any).ambientStarts++;
        start(...args);
      };
      return source;
    };
  });
  await page.goto("/?mode=local");
  await page.getByLabel("닉네임").fill("소리친구");
  await page.getByRole("button", { name: "느긋한 공원 입장하기" }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          `${(window as any).audioContext?.state}/${(window as any).ambientStarts}`,
      ),
    )
    .toBe("running/1");
  await page.getByLabel("맵 변경").selectOption("office");
  await expect
    .poll(() => page.evaluate(() => (window as any).ambientStarts))
    .toBe(2);
  await expect(page.getByLabel("맵 변경")).toContainText("바쁜 사무실");
  await page.getByRole("button", { name: "배경음과 효과음 끄기" }).click();
  expect(
    await page.evaluate(() => localStorage.getItem("dot-social.sound")),
  ).toBe("off");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "배경음과 효과음 켜기" }),
  ).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "배경음과 효과음 켜기" }).click();
  const levels = await page.evaluate(async () => {
    const { makeAmbience } = await import("/src/sound.ts");
    return ["park", "rooftop", "office", "cafe", "beach"].map((map) => {
      const buffer = makeAmbience(
        new OfflineAudioContext(2, 24000 * 24, 24000),
        map,
      );
      const values = buffer.getChannelData(0);
      let sum = 0,
        peak = 0;
      for (const v of values) {
        sum += v * v;
        peak = Math.max(peak, Math.abs(v));
      }
      return {
        duration: buffer.duration,
        rms: Math.sqrt(sum / values.length),
        peak,
        start: values[0],
        end: values[values.length - 1],
      };
    });
  });
  for (const level of levels) {
    expect(level.duration).toBe(24);
    expect(level.rms).toBeGreaterThan(0.001);
    expect(level.peak).toBeLessThan(1);
    expect(Math.abs(level.start)).toBe(0);
    expect(Math.abs(level.end)).toBe(0);
  }
  expect(new Set(levels.map((v) => v.rms.toFixed(4))).size).toBe(5);
});
