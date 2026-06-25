/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // Sử dụng ts-jest để biên dịch TypeScript khi chạy test
  preset: "ts-jest",

  // Môi trường chạy test là Node.js
  testEnvironment: "node",

  // Xác định vị trí các file test: nằm trong thư mục src và tests, có đuôi .test.ts hoặc .spec.ts
  testMatch: [
    "**/src/**/*.test.ts",
    "**/src/**/*.spec.ts",
    "**/tests/**/*.test.ts",
    "**/tests/**/*.spec.ts"
  ],

  // Tự động dọn dẹp mock giữa các lượt test để không bị ảnh hưởng lẫn nhau
  clearMocks: true,

  // Cấu hình báo cáo độ bao phủ (Coverage) nếu cần
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],

  // Bỏ qua không quét các file trong node_modules và thư mục dist (build đầu ra)
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};
