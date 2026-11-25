import { describe, expect, it } from "vitest";
import { stillSceneFor } from "@/lib/game/still-scene";

describe("question stills", () => {
  it("draws a person asking for the Kelvi question, not a Tamil letter", () => {
    const scene = stillSceneFor({
      title: "Kelvi",
      questionText: "In Tamil, what does கேள்வி / “Kelvi” most closely mean?",
      category: "Tamil",
    });
    expect(scene.motif).toBe("ask");
  });

  it("matches the still to the question, not a random category glyph", () => {
    expect(
      stillSceneFor({
        title: "Davara",
        questionText: "Chennai filter coffee is traditionally poured between a tumbler and a…",
        category: "Food",
      }).motif,
    ).toBe("coffee");
    expect(
      stillSceneFor({
        title: "Kapaleeswarar",
        questionText: "Kapaleeswarar Temple stands in which Chennai quarter?",
        category: "Temples",
      }).motif,
    ).toBe("gopuram");
    expect(
      stillSceneFor({
        title: "Kutcheri",
        questionText: "In Carnatic culture, a kutcheri is…",
        category: "Carnatic music",
      }).motif,
    ).toBe("stage");
  });

  it("does not fall back to a category letter when nothing specific matches", () => {
    expect(
      stillSceneFor({
        title: "Open",
        questionText: "Something unseen",
        category: "Tamil",
      }).motif,
    ).toBe("lamp");
  });
});
