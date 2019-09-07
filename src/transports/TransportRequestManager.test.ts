import * as reqData from "../__mocks__/requestData";
import { TransportRequestManager } from "./TransportRequestManager";
import { JSONRPCRequestData, IJSONRPCNotificationResponse, IBatchRequest } from "../Request";

describe("Transport Request Manager", () => {
  let transportReqMan: TransportRequestManager;
  beforeEach(() => {
    transportReqMan = new TransportRequestManager();
  });

  it("should emit pending request", (done) => {
    transportReqMan.transportEventChannel.on("pending", (data: JSONRPCRequestData) => {
      expect(data).toBeDefined();
      done();
    });
    transportReqMan.addRequest({ request: reqData.generateMockRequest(1, "foo", ["bar"]), internalID: 1 }, undefined);
  });

  it("should timeout pending request after 1s", async () => {
    transportReqMan.transportEventChannel.on("pending", (data: JSONRPCRequestData) => {
      expect(data).toBeDefined();
    });

    const prom = transportReqMan.addRequest({
      request: reqData.generateMockRequest(1, "foo", ["bar"]),
      internalID: 1,
    }, 1000);
    await expect(prom).rejects.toThrowError("timeout");
  });

  it("should handle adding batch request", async () => {
    const req = { request: reqData.generateMockRequest(1, "foo", ["bar"]), internalID: 1 };
    // tslint:disable-next-line:no-empty
    const resolve = () => { };
    // tslint:disable-next-line:no-empty
    const reject = () => { };
    const request: IBatchRequest[] = [{ resolve, reject, request: req }];
    transportReqMan.addRequest(request, undefined);
  });

  it("should error on missing id to resolve", () => {
    const payload = JSON.stringify(reqData.generateMockResponse(9, "haha"));
    const err = transportReqMan.resolveResponse(payload, false) as Error;
    expect(err.message).toContain("Could not resolve");
  });

  it("should error on missing id to resolve and emit error", (done) => {
    transportReqMan.transportEventChannel.on("error", (e) => {
      expect(e.message).toContain("Could not resolve");
      done();
    });
    const payload = JSON.stringify(reqData.generateMockResponse(9, "haha"));
    const err = transportReqMan.resolveResponse(payload) as Error;
    expect(err.message).toContain("Could not resolve");
  });

  it("should add and reject pending requests", async () => {
    const request = { request: reqData.generateMockRequest(1, "foo", ["bar"]), internalID: 1 };
    const prom = transportReqMan.addRequest(request, undefined);
    transportReqMan.settlePendingRequest([request], new Error("rejecting"));
    await expect(prom).rejects.toThrowError("rejecting");
  });

  it("should not fail on invalid pending requests", () => {
    const request = { request: reqData.generateMockRequest(1, "foo", ["bar"]), internalID: 1 };
    transportReqMan.settlePendingRequest([request], new Error("rejecting"));
  });

  it("should emit error on bad format for resolving a response", (done) => {
    transportReqMan.transportEventChannel.on("error", (err) => {
      expect(err.message).toContain("Bad response format");
      done();
    });
    transportReqMan.resolveResponse("{}");
  });

  it("should not emit error on bad format for resolving a response", () => {
    const err = transportReqMan.resolveResponse("{}", false) as Error;
    expect(err.message).toContain("Bad response format");
  });

  it("should emit response on response && resolve response", (done) => {
    const res = reqData.generateMockResponse(1, "hello");
    // Add request to queue
    const prom = transportReqMan.addRequest({
      request: reqData.generateMockRequest(1, "foo", ["bar"]),
      internalID: 1,
    }, undefined);

    // Verify that the response resolves the pending request and the response event fires
    transportReqMan.transportEventChannel.on("response", async (responseData) => {
      const result = await prom;
      expect(responseData.result).toEqual(res.result);
      expect(result).toEqual(res.result);
      done();
    });

    // Resolve pending request;
    transportReqMan.resolveResponse(JSON.stringify(res));
  });

  it("should emit response on batch request &&  resolve response", async (done) => {
    const res = [reqData.generateMockResponse(1, "hello")];
    // Add request to queue
    const requestData = {
      request: reqData.generateMockRequest(1, "foo", ["bar"]),
      internalID: 1,
    };

    const resolve = (data: any) => {
      done();
    };

    // tslint:disable-next-line:no-empty
    const reject = () => {
    };
    const prom = transportReqMan.addRequest([{ request: requestData, resolve, reject }], undefined);

    // Verify that the response resolves the pending request and the response event fires
    transportReqMan.transportEventChannel.on("response", (responseData) => {
      expect(responseData.result).toEqual(res[0].result);
      expect(result).toEqual(res[0].result);
    });

    const result = await prom;
    // Resolve pending request;
    transportReqMan.resolveResponse(JSON.stringify(res), false);
  });

  it("should emit response on batch request &&  reject invalid response", () => {
    const res = reqData.generateMockResponse(2, "hello");
    // Add request to queue
    const requestData = {
      request: reqData.generateMockRequest(1, "foo", ["bar"]),
      internalID: 1,
    };

    // tslint:disable-next-line:no-empty
    const resolve = (data: any) => {
    };

    // tslint:disable-next-line:no-empty
    const reject = () => { };

    transportReqMan.addRequest([{ request: requestData, resolve, reject }], undefined);

    // Resolve pending request;
    const err = transportReqMan.resolveResponse(JSON.stringify([res]), false) as Error;
    expect(err.message).toContain("Could not resolve");
  });

  it("should emit notification on notification response", (done) => {
    transportReqMan.transportEventChannel.on("notification", (data: IJSONRPCNotificationResponse) => {
      expect(data.result).toEqual("hello");
      done();
    });
    transportReqMan.resolveResponse(JSON.stringify(reqData.generateMockNotificationResponse("hello")));
  });

  it("should emit error on garbage response", (done) => {
    transportReqMan.transportEventChannel.on("error", (err) => {
      done();
    });
    transportReqMan.resolveResponse("garbage");
  });

  it("should emit data on proper error response and reject req prom.", (done) => {
    const prom = transportReqMan.addRequest({
      request: reqData.generateMockRequest(1, "foo", ["bar"]),
      internalID: 1,
    }, undefined);
    transportReqMan.transportEventChannel.on("response", async (data) => {
      if (data.error === undefined) {
        throw new Error("Missing error");
      }
      expect(data.error.data).toEqual("Bad terrible data");
      await expect(prom).rejects.toThrowError("Error message");
      done();
    });
    transportReqMan.resolveResponse(JSON.stringify(reqData.generateMockErrorResponse(1, "Bad terrible data")));
  });

});
