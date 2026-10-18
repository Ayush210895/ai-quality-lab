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

    expect(screen.getByRole("heading", { name: "Ayush Soni" })).toBeInTheDocument();
    expect(screen.getByText("Applied AI and ML systems for decisions that need evidence.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "View Project Atlas" }));
    expect(screen.getByRole("heading", { name: /Systems you can inspect, question, and operate/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Three systems\. Three kinds of leadership/ })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Open case" })).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "Harm risk" }));

    expect(await screen.findByRole("heading", { name: "Travel Marketplace Harm Risk" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What this evidence allows us to decide" })).toBeInTheDocument();
    expect(window.location.hash).toBe("#/projects/travel-marketplace-harm-risk");
  });

  it("shows the case-study hook, tradeoffs, and interactive architecture", async () => {
    window.location.hash = "#/projects";
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Open case Travel Marketplace Harm Risk" }));

    expect(await screen.findByText("Why this project is different")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Recruiter" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Engineer" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "18 sec guided tour" })).toBeInTheDocument();
    expect(screen.getByText("Who should receive limited review capacity?")).toBeInTheDocument();
    expect(screen.getByText("Business question")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What had to be balanced" })).toBeInTheDocument();
    expect(screen.getByText("Harm value captured versus incident recall")).toBeInTheDocument();

    expect(screen.getAllByText(/Compare a logistic baseline with tuned XGBoost/).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("tab", { name: "artifact" }));
    expect(await screen.findByText("Evidence record")).toBeInTheDocument();
    expect(await screen.findByText("final_test_metrics.json")).toBeInTheDocument();

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

  it("gives AI Quality Lab a complete production case brief", () => {
    const qualityLab = projectStories.find((project) => project.name === "ai-quality-lab");

    expect(qualityLab).toBeDefined();
    expect([qualityLab?.primaryUser, qualityLab?.businessValue, qualityLab?.architectureDetail, qualityLab?.evidenceDetail, qualityLab?.limitationDetail].every((value) => value && value.length > 60)).toBe(true);
  });

  it("offers a live path and example report from the AI Quality Lab case", async () => {
    window.location.hash = "#/projects/ai-quality-lab";
    render(<App />);

    expect(await screen.findByRole("button", { name: "Try the live lab" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Example decision report" })).toHaveAttribute("href", expect.stringContaining("ai-quality-lab-example-decision-report.json"));
    expect(screen.getByRole("heading", { name: "From business problem to production decision" })).toBeInTheDocument();
  });

});
