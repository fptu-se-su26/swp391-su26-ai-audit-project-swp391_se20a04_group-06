"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const payment_controller_1 = require("../../../../backend/src/controllers/payment.controller");
const user_repository_1 = require("../../../../backend/src/repositories/user.repository");
const PaymentTransaction_1 = require("../../../../backend/src/models/PaymentTransaction");
jest.mock("../../../../backend/src/repositories/user.repository");
jest.mock("../../../../backend/src/models/PaymentTransaction", () => ({
    PaymentTransaction: {
        findOne: jest.fn(),
    },
}));
jest.mock("../../../../backend/src/utils/logger", () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
function createResponse() {
    const response = {
        statusCode: 200,
        body: undefined,
        status: jest.fn((code) => {
            response.statusCode = code;
            return response;
        }),
        json: jest.fn((body) => {
            response.body = body;
            return response;
        }),
    };
    return response;
}
describe("Premium payment endpoints", () => {
    const previousEnv = { ...process.env };
    beforeEach(() => {
        process.env = { ...previousEnv };
        jest.clearAllMocks();
    });
    afterAll(() => {
        process.env = previousEnv;
    });
    it("returns a VietQR intent when Sepay bank variables are configured", async () => {
        process.env.PREMIUM_PRICE = "99000";
        process.env.SEPAY_BANK_ID = "VCB";
        process.env.SEPAY_BANK_ACCOUNT = "123456789";
        process.env.SEPAY_ACCOUNT_NAME = "HAISAN VN";
        user_repository_1.userRepository.findRawById.mockResolvedValue({
            _id: "60c72b2f9b1d8b2bad000001",
            isPremium: false,
        });
        const request = {
            user: { userId: "60c72b2f9b1d8b2bad000001" },
        };
        const response = createResponse();
        await (0, payment_controller_1.getPremiumIntent)(request, response);
        expect(response.body.configured).toBe(true);
        expect(response.body.qrUrl).toContain("img.vietqr.io");
        expect(response.body.transferContent).toContain(request.user.userId);
        expect(response.body.amount).toBe(99000);
    });
    it("does not expose a fake QR when bank variables are absent", async () => {
        delete process.env.SEPAY_BANK_ID;
        delete process.env.SEPAY_BANK_ACCOUNT;
        user_repository_1.userRepository.findRawById.mockResolvedValue({
            _id: "60c72b2f9b1d8b2bad000001",
            isPremium: false,
        });
        const response = createResponse();
        await (0, payment_controller_1.getPremiumIntent)({ user: { userId: "60c72b2f9b1d8b2bad000001" } }, response);
        expect(response.body.configured).toBe(false);
        expect(response.body.qrUrl).toBeNull();
    });
    it("returns premium state and latest transaction", async () => {
        const latestTransaction = { amount: 99000, gatewayTransactionId: "tx-1" };
        user_repository_1.userRepository.findRawById.mockResolvedValue({
            _id: "60c72b2f9b1d8b2bad000001",
            isPremium: true,
        });
        const lean = jest.fn().mockResolvedValue(latestTransaction);
        const sort = jest.fn().mockReturnValue({ lean });
        PaymentTransaction_1.PaymentTransaction.findOne.mockReturnValue({ sort });
        const response = createResponse();
        await (0, payment_controller_1.getPremiumStatus)({ user: { userId: "60c72b2f9b1d8b2bad000001" } }, response);
        expect(response.body).toEqual({
            isPremium: true,
            latestTransaction,
        });
    });
    it("rejects a Sepay transfer below the configured Premium price", async () => {
        process.env.SEPAY_WEBHOOK_KEY = "test-webhook-key";
        process.env.PREMIUM_PRICE = "99000";
        PaymentTransaction_1.PaymentTransaction.findOne.mockResolvedValue(null);
        const response = createResponse();
        await (0, payment_controller_1.sepayWebhook)({
            headers: { authorization: "Bearer test-webhook-key" },
            body: {
                id: "gateway-low-amount",
                transferAmount: 2000,
                content: "HAISAN PREMIUM 60c72b2f9b1d8b2bad000001",
            },
        }, response);
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toContain("99000");
    });
});
