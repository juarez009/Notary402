import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseL402Receipt } from "../src/l402.js";

describe("parseL402Receipt", () => {
  it("requires macaroon and preimage", () => {
    assert.equal(parseL402Receipt("macaroon:preimage").valid, true);
    assert.equal(parseL402Receipt("macaroon-only").valid, false);
  });
});
