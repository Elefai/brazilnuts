import test from "node:test";
import assert from "node:assert/strict";
import { automaticTriggers } from "./automation-policy.mjs";

test("automatic campaign policy reacts to new opportunity, not journey completion", () => {
  assert.deepEqual([...automaticTriggers].sort(), ["batch", "occupancy", "table"]);
  for (const completedJourneyEvent of ["buy", "validate", "advance"])
    assert.equal(automaticTriggers.has(completedJourneyEvent), false);
});
