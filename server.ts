import puppeteer from "npm:puppeteer";
import { encodeBase64 } from "jsr:@std/encoding/base64";

const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome-stable",
});

interface Params {
    fromLocation: string;
    toLocation: string;
    operationalDay: string;
    vehicleLabel: string;
    startTime: string;
    endTime: string;
}

interface String {
    interpolate(params: object): string;
}

String.prototype.interpolate = function (params: object) {
    const names = Object.keys(params);
    const vals = Object.values(params);
    return new Function(...names, `return \`${this}\`;`)(...vals);
};

function generateDataUrl(queryParams: Params) {
    const html = new TextDecoder().decode(
        Deno.readFileSync("./og.html"),
    );

    const encodedHtml = encodeBase64(html.interpolate(queryParams));
    return `data:text/html;base64,${encodedHtml}`;
}

async function generatePngResponse(queryParams: Params) {
    const page = await browser.newPage();
    await page.goto(generateDataUrl(queryParams));
    const screenshot = await page.screenshot();

    return new Response(screenshot, {
        headers: [["Content-Type", "image/png"]],
    });
}

Deno.serve((req) => {
    const url = new URL(req.url);
    if (req.method === "GET" && url.pathname === "/og") {
        return generatePngResponse(
            Object.fromEntries(url.searchParams) as unknown as Params,
        );
    }

    return new Response(null, { status: 404 });
});
