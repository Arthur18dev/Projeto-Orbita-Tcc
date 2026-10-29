import test from "node:test";
import assert from "node:assert/strict";
import { sendVisit } from "../src/analytics.js";
test("envia somente id aleatório e domínio, sem caminho/query do referenciador", async () => {
  let request;
  await sendVisit({
    endpoint: "https://example.com/api/visits",
    referrer: "https://search.example/path?email=private",
    eventId: "test-id",
    fetcher: async (url, options) => {
      request = { url, ...options };
      return { ok: true };
    },
  });
  assert.equal(request.method, "POST");
  assert.deepEqual(JSON.parse(request.body), {
    eventId: "test-id",
    source: "search.example",
  });
  assert.equal(request.credentials, "omit");
  assert.equal(request.cache, "no-store");
});
test("origem ausente é direct e erro HTTP é detectado", async () => {
  await assert.rejects(
    sendVisit({
      endpoint: "https://example.com/api/visits",
      fetcher: async (_url, options) => {
        assert.equal(JSON.parse(options.body).source, "direct");
        return { ok: false, status: 503 };
      },
    }),
    /503/,
  );
});
test("recusa protocolos não HTTP", async () => {
  await assert.rejects(
    sendVisit({ endpoint: "javascript:alert(1)" }),
    /inválido/,
  );
});
