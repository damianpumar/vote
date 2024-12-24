import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { Event } from "./event.js";
import { cors } from "hono/cors";

const app = new Hono();

app.use(
  cors({
    origin: "*",
    allowHeaders: ["*"],
    allowMethods: ["*"],
    credentials: false,
  })
);

const record: Record<string, number> = {};

app.get("vote/:id", async (c) => {
  const id = c.req.param("id");

  if (!id) {
    return c.notFound();
  }

  if (!record[id]) {
    record[id] = 0;
  }

  record[id]++;

  Event.send(`vote::${id}`, {
    id,
    count: record[id],
  });

  return c.text("Hello developer 🤘, thanks for voting");
});

app.get("/result/:id", (c) => {
  const id = c.req.param("id");
  if (!id) {
    return c.notFound();
  }

  return streamSSE(c, async (stream) => {
    Event.subscribe("*", stream);

    stream.onAbort(() => {
      Event.remove("*");
    });

    await stream.writeSSE({
      id: Date.now().toString(),
      event: "connected",
      data: `Welcome! 🤘 to event vote::${id}`,
    });

    if (!record[id]) {
      record[id] = 0;
    }

    Event.send(`vote::${id}`, {
      id,
      count: record[id],
    });
  });
});

const port = 3000;
console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
