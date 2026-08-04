import assert from "node:assert/strict";
import test from "node:test";
import {
  CHICKEN_CITY_RATIO,
  getChickenLaneCenter,
  getChickenSecuredLane,
  pickChickenFailureLane,
} from "../lib/chicken-model.ts";

test("chicken lane centers share one city and roadway geometry", () => {
  const width = 1_000;
  const lanes = 7;
  const cityWidth = width * CHICKEN_CITY_RATIO;
  const laneWidth = (width - cityWidth) / lanes;

  assert.equal(getChickenLaneCenter(width, 0, lanes), cityWidth / 2);
  assert.equal(
    getChickenLaneCenter(width, 1, lanes),
    cityWidth + laneWidth / 2,
  );
  assert.equal(
    getChickenLaneCenter(width, 7, lanes),
    cityWidth + laneWidth * 6.5,
  );
});

test("chicken lane centers remain exact across mobile and desktop widths", () => {
  const lanes = 7;
  for (const width of [320, 375, 390, 768, 1024, 1440]) {
    const cityWidth = width * CHICKEN_CITY_RATIO;
    const laneWidth = (width - cityWidth) / lanes;
    for (let lane = 1; lane <= lanes; lane += 1) {
      const expected = cityWidth + (lane - 0.5) * laneWidth;
      assert.ok(
        Math.abs(getChickenLaneCenter(width, lane, lanes) - expected) < 0.001,
        `lane ${lane} is misaligned at ${width}px`,
      );
    }
  }
});

test("a collision occupies the attempted lane but does not secure it", () => {
  assert.equal(getChickenSecuredLane("crossing", 3), 2);
  assert.equal(getChickenSecuredLane("crashed", 3), 2);
  assert.equal(getChickenSecuredLane("safe", 3), 3);
  assert.equal(getChickenSecuredLane("cashed-out", 3), 3);
});

test("failure lane selection can safely allow a full crossing", () => {
  assert.equal(pickChickenFailureLane(() => 0, "medium", 7), 1);
  assert.equal(pickChickenFailureLane(() => 0.99, "medium", 7), 8);
});
