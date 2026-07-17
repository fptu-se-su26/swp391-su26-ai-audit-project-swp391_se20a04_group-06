/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // Sử dụng ts-jest để biên dịch TypeScript khi chạy test
  preset: "ts-jest",

  // Môi trường chạy test là Node.js
  testEnvironment: "node",

  // Cấu hình các thư mục chứa code và test
  roots: [
    "<rootDir>/src",
    "<rootDir>/../tests/backend"
  ],

  // Xác định vị trí các file test: nằm trong thư mục tests cấp độ root, có đuôi .test.ts hoặc .spec.ts
  testMatch: [
    "<rootDir>/../tests/backend/**/*.test.ts",
    "<rootDir>/../tests/backend/**/*.spec.ts"
  ],

  // Cấu hình các thư mục tìm kiếm module/node_modules
  moduleDirectories: ["node_modules", "<rootDir>/node_modules"],

  // Tự động dọn dẹp mock giữa các lượt test để không bị ảnh hưởng lẫn nhau
  clearMocks: true,

  // Cấu hình báo cáo độ bao phủ (Coverage) nếu cần
  collectCoverage: false,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],

  // Bỏ qua không quét các file trong node_modules và thư mục dist (build đầu ra)
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};
