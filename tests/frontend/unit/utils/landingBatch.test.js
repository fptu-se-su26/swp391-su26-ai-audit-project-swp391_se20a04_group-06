import { describe, expect, it } from "vitest";
import {
  getLandingBatchId,
  getLandingBatchImage,
  getLandingBatchStatus,
} from "../../../../client/src/utils/landingBatch";

describe("landing batch utilities", () => {
  it("supports MongoDB and API id formats", () => {
    expect(getLandingBatchId({ _id: "mongo-id" })).toBe("mongo-id");
    expect(getLandingBatchId({ id: "api-id", _id: "mongo-id" })).toBe("api-id");
  });

  it("extracts cover and first image safely", () => {
    expect(getLandingBatchImage({ coverImg: "cover.jpg", images: ["first.jpg"] })).toBe(
      "cover.jpg",
    );
    expect(getLandingBatchImage({ images: [{ url: "first.jpg" }] })).toBe("first.jpg");
    expect(getLandingBatchImage({})).toBeNull();
  });

  it("normalizes supported statuses", () => {
    expect(getLandingBatchStatus("Closed")).toEqual({ key: "closed", label: "Đã đóng" });
    expect(getLandingBatchStatus("Deleted")).toEqual({ key: "deleted", label: "Đã ẩn" });
    expect(getLandingBatchStatus(undefined)).toEqual({ key: "active", label: "Đang bán" });
  });
});
