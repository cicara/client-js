import { Client, RequestManager, WebSocketTransport } from "../lib";

const transport = new WebSocketTransport("ws://127.0.0.1:2087");
const client = new Client(new RequestManager([transport]));

async function main() {
  const result = await client.request({ method: "abc", params: {} });
  console.log(result);
}

main()
  .catch((err) => console.error(err))
  .finally(() => client.close());
