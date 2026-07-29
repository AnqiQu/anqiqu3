import type { Metadata } from "next";
import manifest from "../../../public/sandbox/asset-manifest.json";
import "../sandbox.css";
import "./review.css";

export const metadata: Metadata = {
  title: "Sandbox Asset Review | Anqi Intelligence",
  robots: { index: false, follow: false, nocache: true },
};

function formatBytes(bytes: number | null) {
  if (bytes === null) return "—";
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

export default function SandboxAssetReviewPage() {
  return (
    <main className="asset-review">
      <header className="asset-review-header">
        <p>Development review · noindex</p>
        <h1>Sandbox asset review</h1>
        <span>{manifest.filter((asset) => asset.status === "READY").length} ready · {manifest.filter((asset) => asset.status !== "READY").length} flagged</span>
      </header>
      <div className="asset-review-grid">
        {manifest.map((asset) => (
          <article className="asset-card" key={`${asset.category}-${asset.filename}`}>
            <div className="asset-backgrounds">
              {(["white", "black", "green", "checker"] as const).map((background) => (
                <div className={`asset-swatch asset-swatch-${background}`} key={background}>
                  {asset.webpPath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={asset.webpPath} alt={`${asset.filename} on ${background}`} loading="lazy" />
                  ) : (
                    <strong>NEEDS<br />REGENERATION</strong>
                  )}
                </div>
              ))}
            </div>
            <div className="asset-card-copy">
              <div><h2>{asset.filename}</h2><span className={`asset-status asset-status-${asset.status.toLowerCase().replaceAll("_", "-")}`}>{asset.status}</span></div>
              <dl>
                <div><dt>Category</dt><dd>{asset.category}</dd></div>
                <div><dt>Dimensions</dt><dd>{asset.width && asset.height ? `${asset.width} × ${asset.height}` : "—"}</dd></div>
                <div><dt>Files</dt><dd>PNG {formatBytes(asset.pngBytes)} · WebP {formatBytes(asset.webpBytes)}</dd></div>
                <div><dt>Anchor</dt><dd>{asset.anchor}</dd></div>
                <div><dt>PNG path</dt><dd>{asset.pngPath ?? "—"}</dd></div>
                <div><dt>WebP path</dt><dd>{asset.webpPath ?? "—"}</dd></div>
                <div><dt>Alternates</dt><dd>{asset.relatedAlternates.join(", ") || "—"}</dd></div>
                <div><dt>Issue</dt><dd>{asset.issue || "None detected"}</dd></div>
              </dl>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
