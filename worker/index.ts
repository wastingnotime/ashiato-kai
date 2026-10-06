const API_ORIGIN = "https://api.ashiato-kai.com";
const ALLOWED_PATHS = [
  /^\/api\/v1\/immigrants$/,
  /^\/api\/v1\/groups\/[1-9]\d*$/,
  /^\/api\/v1\/statistics\/(names|surnames|prefectures)(\/top)?$/,
  /^\/api\/v1\/geolocation(\/[A-Za-z]+)?$/,
];

export default {
  async fetch(request: Request): Promise<Response> {
    const incoming = new URL(request.url);
    const path = incoming.pathname.replace(/^\/web-api/, "");

    if (request.method !== "GET")
      return new Response("Method not allowed", { status: 405 });
    if (!ALLOWED_PATHS.some((pattern) => pattern.test(path))) {
      return new Response("Not found", { status: 404 });
    }

    const upstream = new URL(path + incoming.search, API_ORIGIN);
    try {
      const response = await fetch(upstream, {
        headers: { accept: "application/json" },
      });
      const headers = new Headers();
      for (const name of [
        "content-type",
        "cache-control",
        "etag",
        "last-modified",
      ]) {
        const value = response.headers.get(name);
        if (value) headers.set(name, value);
      }
      return new Response(response.body, { status: response.status, headers });
    } catch {
      return Response.json(
        { error: "A pesquisa está indisponível no momento." },
        { status: 502 },
      );
    }
  },
};
