import "server-only";

import { existsSync } from "node:fs";
import puppeteer from "puppeteer-core";

const CANDIDATE_PATHS = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter((value): value is string => Boolean(value));

export function chromeExecutable(): string | null {
  return CANDIDATE_PATHS.find((path) => existsSync(path)) ?? null;
}

type BrowserTarget = { executablePath: string; args: string[] };

/**
 * On a developer machine the installed Chrome is used. Vercel has no browser
 * at all, so the Chromium that ships with `@sparticuz/chromium` is unpacked
 * into the function's temporary directory instead.
 */
async function browserTarget(): Promise<BrowserTarget> {
  const local = chromeExecutable();
  if (local) {
    return {
      executablePath: local,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    };
  }

  const chromium = await import("@sparticuz/chromium");
  const executablePath = await chromium.default.executablePath();
  return {
    executablePath,
    args: [...chromium.default.args, "--font-render-hinting=none"],
  };
}

export async function htmlToPdf(html: string): Promise<Uint8Array> {
  const target = await browserTarget();

  const browser = await puppeteer.launch({
    executablePath: target.executablePath,
    headless: true,
    args: target.args,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load", timeout: 30_000 });
    await page.waitForNetworkIdle({ idleTime: 500, timeout: 10_000 }).catch(() => undefined);
    await page.evaluate(async () => {
      await document.fonts.ready;
      const images = Array.from(document.images);
      await Promise.all(
        images.map((image) =>
          image.complete
            ? Promise.resolve()
            : new Promise((resolve) => {
                image.addEventListener("load", resolve, { once: true });
                image.addEventListener("error", resolve, { once: true });
              }),
        ),
      );
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "14mm", right: "12mm", bottom: "14mm", left: "12mm" },
    });

    return new Uint8Array(pdf);
  } finally {
    await browser.close();
  }
}
