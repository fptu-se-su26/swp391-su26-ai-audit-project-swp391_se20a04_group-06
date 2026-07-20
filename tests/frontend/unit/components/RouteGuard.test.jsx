import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { RequireAuth, RequireRole } from "../../../../client/src/components/RouteGuard";
import { useAuth } from "../../../../client/src/context/AuthContext";
import { getUserRole } from "../../../../client/src/config/navigation";

// Mock useAuth context
vi.mock("../../../../client/src/context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

// Mock getUserRole helper
vi.mock("../../../../client/src/config/navigation", () => ({
  getUserRole: vi.fn(),
}));

describe("RouteGuard Components Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("RequireAuth", () => {
    it("renders loading indicator when loading is true", () => {
      useAuth.mockReturnValue({ loading: true, user: null });
      render(
        <MemoryRouter initialEntries={["/protected"]}>
          <RequireAuth>
            <div data-testid="protected-content">Protected</div>
          </RequireAuth>
        </MemoryRouter>
      );
      expect(screen.getByText("Đang kiểm tra phiên đăng nhập...")).toBeDefined();
      expect(screen.queryByTestId("protected-content")).toBeNull();
    });

    it("redirects to login when user is not authenticated", () => {
      useAuth.mockReturnValue({ loading: false, user: null });
      render(
        <MemoryRouter initialEntries={["/protected"]}>
          <Routes>
            <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
            <Route path="/protected" element={
              <RequireAuth>
                <div data-testid="protected-content">Protected</div>
              </RequireAuth>
            } />
          </Routes>
        </MemoryRouter>
      );
      expect(screen.getByTestId("login-page")).toBeDefined();
      expect(screen.queryByTestId("protected-content")).toBeNull();
    });

    it("renders children when user is authenticated", () => {
      useAuth.mockReturnValue({ loading: false, user: { name: "John" } });
      render(
        <MemoryRouter initialEntries={["/protected"]}>
          <Routes>
            <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
            <Route path="/protected" element={
              <RequireAuth>
                <div data-testid="protected-content">Protected Page</div>
              </RequireAuth>
            } />
          </Routes>
        </MemoryRouter>
      );
      expect(screen.getByTestId("protected-content")).toBeDefined();
      expect(screen.queryByTestId("login-page")).toBeNull();
    });
  });

  describe("RequireRole", () => {
    it("renders loading indicator when loading is true", () => {
      useAuth.mockReturnValue({ loading: true, user: null });
      render(
        <MemoryRouter initialEntries={["/admin"]}>
          <RequireRole roles={["admin"]}>
            <div data-testid="admin-content">Admin Page</div>
          </RequireRole>
        </MemoryRouter>
      );
      expect(screen.getByText("Đang kiểm tra quyền truy cập...")).toBeDefined();
    });

    it("redirects to login when user is not authenticated", () => {
      useAuth.mockReturnValue({ loading: false, user: null });
      render(
        <MemoryRouter initialEntries={["/admin"]}>
          <Routes>
            <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
            <Route path="/admin" element={
              <RequireRole roles={["admin"]}>
                <div data-testid="admin-content">Admin Page</div>
              </RequireRole>
            } />
          </Routes>
        </MemoryRouter>
      );
      expect(screen.getByTestId("login-page")).toBeDefined();
    });

    it("redirects to home when user role is not allowed", () => {
      useAuth.mockReturnValue({ loading: false, user: { name: "User" } });
      getUserRole.mockReturnValue("buyer");
      render(
        <MemoryRouter initialEntries={["/admin"]}>
          <Routes>
            <Route path="/" element={<div data-testid="home-page">Home Page</div>} />
            <Route path="/admin" element={
              <RequireRole roles={["admin"]}>
                <div data-testid="admin-content">Admin Page</div>
              </RequireRole>
            } />
          </Routes>
        </MemoryRouter>
      );
      expect(screen.getByTestId("home-page")).toBeDefined();
      expect(screen.queryByTestId("admin-content")).toBeNull();
    });

    it("renders children when user role is allowed", () => {
      useAuth.mockReturnValue({ loading: false, user: { name: "Admin" } });
      getUserRole.mockReturnValue("admin");
      render(
        <MemoryRouter initialEntries={["/admin"]}>
          <Routes>
            <Route path="/" element={<div data-testid="home-page">Home Page</div>} />
            <Route path="/admin" element={
              <RequireRole roles={["admin"]}>
                <div data-testid="admin-content">Admin Page</div>
              </RequireRole>
            } />
          </Routes>
        </MemoryRouter>
      );
      expect(screen.getByTestId("admin-content")).toBeDefined();
    });
  });
});
