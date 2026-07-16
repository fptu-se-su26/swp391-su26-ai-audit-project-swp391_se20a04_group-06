import { adminOnly, sellerOnly } from "../../../../backend/src/middlewares/auth";

function createResponse() {
  const response: any = {
    statusCode: 200,
    body: undefined,
    status: jest.fn((code: number) => {
      response.statusCode = code;
      return response;
    }),
    json: jest.fn((body: unknown) => {
      response.body = body;
      return response;
    }),
  };
  return response;
}

describe("RBAC guards", () => {
  it("allows only Admin through adminOnly", () => {
    const next = jest.fn();
    adminOnly({ user: { userId: "admin", role: "Admin" } } as any, createResponse(), next);
    expect(next).toHaveBeenCalledTimes(1);

    const denied = createResponse();
    adminOnly({ user: { userId: "buyer", role: "User" } } as any, denied, jest.fn());
    expect(denied.statusCode).toBe(403);
  });

  it("allows a seller session and rejects a buyer session", () => {
    const next = jest.fn();
    sellerOnly(
      { user: { userId: "seller", role: "User", sessionRole: "seller" } } as any,
      createResponse(),
      next,
    );
    expect(next).toHaveBeenCalledTimes(1);

    const denied = createResponse();
    sellerOnly(
      { user: { userId: "buyer", role: "User", sessionRole: "buyer" } } as any,
      denied,
      jest.fn(),
    );
    expect(denied.statusCode).toBe(403);
    expect(denied.body.code).toBe("SELLER_ONLY");
  });

  it("allows Admin through sellerOnly regardless of session mode", () => {
    const next = jest.fn();
    sellerOnly(
      { user: { userId: "admin", role: "Admin", sessionRole: "buyer" } } as any,
      createResponse(),
      next,
    );
    expect(next).toHaveBeenCalledTimes(1);
  });
});
