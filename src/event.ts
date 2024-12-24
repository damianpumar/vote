import { SSEStreamingApi } from "hono/streaming";

type Subscriber = {
  subscriber: string;
  stream: SSEStreamingApi;
};

const subscribers: Subscriber[] = [];

async function send(
  event: string,
  data: Object | Array<unknown>,
  receiver: string = "*"
) {
  const receivers = subscribers.filter(
    (c) => receiver === "*" || c.subscriber === receiver
  );

  if (process.env.NODE_ENV !== "production") {
    console.log(
      `🕊️ Sending ${event} to ${receiver} with data: ${JSON.stringify(data)}`
    );
  }

  const promises = receivers.map((receiver) =>
    receiver.stream.writeSSE({
      id: Date.now().toString(),
      event,
      data: JSON.stringify(data),
    })
  );

  await Promise.all(promises);
}

const subscribe = (subscriber: string, stream: SSEStreamingApi) => {
  if (process.env.NODE_ENV !== "production") {
    console.log(
      `🌈 New subscriber ${subscriber} connected to the event stream`
    );
  }

  subscribers.push({
    subscriber,
    stream,
  });
};

const remove = (subscriber: string) => {
  const index = subscribers.findIndex((c) => c.subscriber === subscriber);

  if (index === -1) return;

  if (process.env.NODE_ENV !== "production") {
    console.log(
      `💀 Subscriber ${subscriber} dis  connected from the event stream`
    );
  }

  subscribers.splice(index, 1);
};

export const Event = {
  send,
  subscribe,
  remove,
};
