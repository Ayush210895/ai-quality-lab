import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { projectStories } from "./data/projectStories";

vi.mock("recharts", () => ({
  Area: () => null,
  AreaChart: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Bar: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  CartesianGrid: () => null,
  Cell: () => null,
  Legend: () => null,
  Line: () => null,
  LineChart: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  ReferenceLine: () => null,
  ResponsiveContainer: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Scatter: () => null,
  ScatterChart: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
  ZAxis: () => null,
}));

describe("workspace navigation", () => {
  beforeEach(() => {
    window.location.hash = "#/lab";
  });

  it.each([
    ["Evidence registry", "All GitHub projects, one evaluation path"],
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
    fireEvent.click(screen.getByRole("tab", { name: "Classification" }));
    fireEvent.click(screen.getByRole("button", { name: /Apply 0\.406/ }));
    expect(screen.getByText("Current: 0.41")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByText("Current: 0.50")).toBeInTheDocument();
  });

  it("routes a connected project to its evidence workspace", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("tab", { name: "Evidence registry" }));
    fireEvent.click(screen.getByRole("button", { name: "Open evidence" }));

    expect(screen.getByRole("tab", { name: "GitHub model comparison" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getAllByRole("heading", { name: "Travel harm-risk model" }).length).toBeGreaterThan(0);
  });

  it("opens the project atlas and a dedicated project page", async () => {
    window.location.hash = "#/";
    render(<App />);

    expect(screen.getByRole("heading", { name: /AI, ML and data systems/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Explore travel-marketplace-harm-risk" }));

    expect(await screen.findByRole("heading", { name: "travel-marketplace-harm-risk" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What this evidence allows us to decide" })).toBeInTheDocument();
    expect(window.location.hash).toBe("#/projects/travel-marketplace-harm-risk");
  });

  it("shows the case-study hook, tradeoffs, and interactive architecture", async () => {
    window.location.hash = "#/";
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Explore travel-marketplace-harm-risk" }));

    expect(await screen.findByText("The result in one sentence")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What had to be balanced" })).toBeInTheDocument();
    expect(screen.getByText("Harm value captured versus incident recall")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "architecture" }));
    fireEvent.click(screen.getByRole("button", { name: "Run system flow" }));
    expect(screen.getByRole("button", { name: "Inspect Input stage" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Restart flow" })).toBeInTheDocument();
  });

  it("defines a decision for every public-facing case study", () => {
    expect(projectStories).toHaveLength(17);
    expect(projectStories.every((project) => project.decision.trim().length > 40)).toBe(true);
    expect(projectStories.every((project) => project.nextStep.trim().length > 40)).toBe(true);
  });
});
