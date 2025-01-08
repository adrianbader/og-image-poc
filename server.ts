import { Resvg } from "npm:@resvg/resvg-js";

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

function generateSvgString(queryParams: Params) {
    const svg = new TextDecoder().decode(
        Deno.readFileSync("./svgRootTemplate.svg"),
    );

    return svg.interpolate(queryParams);
}

function generatePngResponse(queryParams: Params) {
    const resvg = new Resvg(generateSvgString(queryParams));
    const image = resvg.render();
    const asPng = image.asPng();

    return new Response(asPng, { headers: [["Content-Type", "image/png"]] });
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
