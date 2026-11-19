import { ImageResponse } from "next/og";
import { buildCatalogPoster, type CatalogPoster } from "./poster";
import type { CatalogRow } from "./rows";

export function CatalogPosterImage({ poster }: { poster: CatalogPoster }) {
  return (
    <div
      style={{
        width: 1080,
        height: 1920,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#f3ede2",
        color: "#1c1915",
        padding: "120px 88px 100px",
        fontFamily: "Georgia, Times New Roman, serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 22, letterSpacing: 12, color: "#6a6358" }}>{poster.brand}</div>
        <div style={{ marginTop: 18, fontSize: 28, letterSpacing: 8 }}>{`KELVI #${poster.number}`}</div>
        <div style={{ marginTop: 48, fontSize: 22, letterSpacing: 8, color: "#6a6358" }}>
          {poster.category.toUpperCase()}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 40, letterSpacing: 2, color: "#6a6358" }}>{poster.title}</div>
        <div style={{ marginTop: 28, fontSize: 64, lineHeight: 1.15 }}>{poster.prompt}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 34, letterSpacing: 4 }}>KELVI CATALOG</div>
        <div style={{ marginTop: 18, fontSize: 22, letterSpacing: 6 }}>{poster.handle}</div>
      </div>
    </div>
  );
}

export async function renderCatalogPosterPng(row: CatalogRow) {
  const poster = buildCatalogPoster({
    number: row.number,
    title: row.title,
    question: row.question,
    category: row.category,
  });
  const image = new ImageResponse(<CatalogPosterImage poster={poster} />, {
    width: 1080,
    height: 1920,
  });
  return new Uint8Array(await image.arrayBuffer());
}
