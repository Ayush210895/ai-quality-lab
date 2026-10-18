import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import App from "./App";

vi.mock("recharts", () => ({
  Bar: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  CartesianGrid: () => null,
  Cell: () => null,
  Legend: () => null,
  Line: () => null,
  LineChart: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  ReferenceLine: () => null,
  ResponsiveContainer: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

describe("workspace navigation", () => {
  it.each([
    ["Classification", "Operating assumptions"],
    ["GitHub model comparison", "Travel harm-risk model"],
    ["Regression & forecasting", "Regression & forecasting"],
    ["Ranking & recommendations", "Ranking & recommendations"],
    ["LLM & RAG", "LLM & RAG"],
    ["Production monitoring", "Production monitoring"],
  ])("activates %s", (tabName, workspaceHeading) => {
    render(<App />);
    fireEvent.click(screen.getByRole("tab", { name: tabName }));

    expect(screen.getByRole("tab", { name: tabName })).toHaveAttribute("aria-selected", "true");
    expect(screen.getAllByRole("heading", { name: workspaceHeading }).length).toBeGreaterThan(0);
  });

  it("applies and resets the classification recommendation", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Apply 0\.406/ }));
    expect(screen.getByText("Current: 0.41")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByText("Current: 0.50")).toBeInTheDocument();
  });
});
