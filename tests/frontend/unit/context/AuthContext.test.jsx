import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthProvider, useAuth } from "../../../../client/src/context/AuthContext";
import authReducer from "../../../../client/src/store/slices/authSlice";
import { apiAuth } from "../../../../client/src/services/api";

// Mock apiAuth
vi.mock("../../../../client/src/services/api", () => {
  return {
    apiAuth: {
      getProfile: vi.fn(),
      logout: vi.fn(),
    },
  };
});

// A test component to read AuthContext value
function TestComponent() {
  const { user, login, logout, loading } = useAuth();
  if (loading) return <div data-testid="loading">Loading...</div>;
  if (!user) return <div data-testid="no-user">No User</div>;
  return (
    <div>
      <div data-testid="user-name">{user.name}</div>
      <button data-testid="logout-btn" onClick={logout}>Logout</button>
      <button data-testid="login-btn" onClick={() => login({ name: "Logged User", id: "123" })}>Login</button>
    </div>
  );
}

describe("AuthContext and AuthProvider", () => {
  let store;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    store = configureStore({
      reducer: {
        auth: authReducer,
      },
    });
  });

  it("restores session successfully when apiAuth.getProfile returns valid user", async () => {
    const mockUser = { id: "1", name: "John Doe", email: "john@example.com", avatarUrl: "avatar.jpg" };
    apiAuth.getProfile.mockResolvedValue(mockUser);

    render(
      <Provider store={store}>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </Provider>
    );

    // Initial state should be loading
    expect(screen.getByTestId("loading")).toBeDefined();

    // Wait until profile loaded
    await waitFor(() => {
      expect(screen.queryByTestId("loading")).toBeNull();
    });

    expect(screen.getByTestId("user-name").textContent).toBe("John Doe");
    expect(JSON.parse(localStorage.getItem("haisan-user"))).toEqual({
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      avatar: "avatar.jpg",
      avatarUrl: "avatar.jpg",
    });
  });

  it("handles session restoration failure and clears local storage", async () => {
    apiAuth.getProfile.mockRejectedValue(new Error("Unauthorized"));
    localStorage.setItem("haisan-user", "some-old-user");

    render(
      <Provider store={store}>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId("loading")).toBeNull();
    });

    expect(screen.getByTestId("no-user")).toBeDefined();
    expect(localStorage.getItem("haisan-user")).toBeNull();
  });

  it("logs out user and updates local storage", async () => {
    const mockUser = { id: "1", name: "John Doe" };
    apiAuth.getProfile.mockResolvedValue(mockUser);
    apiAuth.logout.mockResolvedValue({});

    render(
      <Provider store={store}>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId("user-name")).toBeDefined();
    });

    // Click logout
    screen.getByTestId("logout-btn").click();

    await waitFor(() => {
      expect(screen.getByTestId("no-user")).toBeDefined();
    });

    expect(apiAuth.logout).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("haisan-user")).toBeNull();
  });
});
