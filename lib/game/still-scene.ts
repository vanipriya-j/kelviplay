export type StillMotif =
  | "ask"
  | "coffee"
  | "stage"
  | "gopuram"
  | "pot"
  | "anklet"
  | "silk"
  | "rain"
  | "drum"
  | "dance"
  | "hand"
  | "city"
  | "horn"
  | "lamp";

export type StillScene = {
  motif: StillMotif;
  from: string;
  to: string;
};

const RULES: Array<{ test: RegExp; motif: StillMotif; from: string; to: string }> = [
  { test: /davara|coffee|tumbler|filter/, motif: "coffee", from: "#2c1810", to: "#b5523a" },
  { test: /kapalee|gopuram|chidambaram|nataraja|temple/, motif: "gopuram", from: "#1a1612", to: "#8a6a48" },
  { test: /pongal|harvest/, motif: "pot", from: "#2a140c", to: "#c4a57a" },
  { test: /silappat|kannagi|anklet/, motif: "anklet", from: "#221c16", to: "#6a6358" },
  { test: /kanchipuram|silk|saree|sari/, motif: "silk", from: "#261810", to: "#3e5648" },
  { test: /kalakshetra|thiruvanmiyur|bharatanatyam|dance/, motif: "dance", from: "#2a1612", to: "#b5523a" },
  { test: /nadaswaram/, motif: "horn", from: "#24160f", to: "#c4a57a" },
  { test: /mridangam|thani|percussion/, motif: "drum", from: "#1c1915", to: "#8a6a48" },
  { test: /amritavarshini|rain/, motif: "rain", from: "#18201c", to: "#3e5648" },
  { test: /mudra|guruguha|padmanabha/, motif: "hand", from: "#24160f", to: "#c4a57a" },
  { test: /kutcheri|varnam|alapana|neraval|vatapi|ganapat|concert|raga|mayamalavagowla/, motif: "stage", from: "#24160f", to: "#c4a57a" },
  { test: /t\.?\s*nagar|chennai|december|margazhi|thiruvaiyaru/, motif: "city", from: "#1e2428", to: "#c4a57a" },
  { test: /kelvi|கேள்வி/, motif: "ask", from: "#1c1915", to: "#6a6358" },
  { test: /puthandu|new year/, motif: "lamp", from: "#2a140c", to: "#c4a57a" },
];

export function stillSceneFor(input: {
  title?: string | null;
  questionText: string;
  category?: string | null;
}): StillScene {
  const haystack = `${input.title ?? ""} ${input.questionText} ${input.category ?? ""}`.toLowerCase();
  const rule = RULES.find((item) => item.test.test(haystack));
  if (rule) {
    return { motif: rule.motif, from: rule.from, to: rule.to };
  }
  return { motif: "lamp", from: "#1c1915", to: "#c4a57a" };
}
