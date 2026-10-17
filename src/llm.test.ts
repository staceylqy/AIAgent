import { describe, expect, it } from "vitest";
import { programs } from "./data/programs";
import { personas } from "./data/personas";
import { getProvider } from "./llm";

describe("mock LLM provider", () => {
  it("fills patient attributes into the reason text", async () => {
    const target = programs.filter((p) => p.id === "high_cost_medical");
    const generated = await getProvider().generate(
      personas[0].patient,
      target,
    );
    expect(generated[0].reasonJa).toContain("52");
    expect(generated[0].reasonJa).toContain("職場の健康保険");
  });

  it("leaves no unfilled placeholders in any generated text", async () => {
    const generated = await getProvider().generate(
      personas[1].patient,
      programs,
    );
    for (const item of generated) {
      expect(item.reasonJa).not.toMatch(/\{\w+\}/);
      expect(item.reasonEn).not.toMatch(/\{\w+\}/);
      expect(item.plainJa).not.toMatch(/\{\w+\}/);
      expect(item.plainEn).not.toMatch(/\{\w+\}/);
    }
  });
});
