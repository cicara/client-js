# JSON RPC Client

This repository is a fork of <https://github.com/open-rpc/client-js>.

A JSON-RPC client with multiple transports for browser.

- EventEmitter
- HTTP/HTTPS
- WebSocket
- PostMessageWindow
- PostMessageIframe

```javascript
import { Client, RequestManager, WebSocketTransport } from "@cicara/jsonrpc-client";

const transport = new WebSocketTransport("ws://127.0.0.1:2087");
const client = new Client(new RequestManager([transport]));

async function main() {
  const result = await client.request({ method: "abc", params: {} });
  console.log(result);
}

main()
  .catch((err) => console.error(err))
  .finally(() => client.close());
```
