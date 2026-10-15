import { describe, it, expect } from "vitest";
import { base64ToUint8, uint8ToBase64 } from "../lib/binary";

describe("Binary Encoding Utilities", () => {
  it("should encode Uint8Array to base64 and decode back losslessly", () => {
    const raw = new Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100]); // "Hello World"
    const b64 = uint8ToBase64(raw);
    expect(b64).toBe("SGVsbG8gV29ybGQ=");

    const decoded = base64ToUint8(b64);
    expect(decoded).toEqual(raw);
  });

  it("should handle large chunked payloads without stack overflow", () => {
    const size = 100000;
    const large = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      large[i] = i % 256;
    }

    const b64 = uint8ToBase64(large);
    expect(typeof b64).toBe("string");

    const decoded = base64ToUint8(b64);
    expect(decoded.length).toBe(size);
    expect(decoded[0]).toBe(0);
    expect(decoded[size - 1]).toBe((size - 1) % 256);
  });
});
