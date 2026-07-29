import Link from "next/link";
import type { CSSProperties } from "react";
import { sandboxDecorations, sandboxLocations } from "../config";

type SceneStyle = CSSProperties & Record<`--${string}`, string | number>;

function PaintedAsset({ src, alt = "" }: { src: string; alt?: string }) {
  const png = src.replace(/\.webp$/, ".png");
  return (
    <picture>
      <source srcSet={src} type="image/webp" />
      <img src={png} alt={alt} draggable={false} />
    </picture>
  );
}

export function SandboxScene() {
  return (
    <main className="sandbox-world">
      <h1 className="sandbox-sr-only">Anqi Intelligence Sandbox</h1>
      <div className="sandbox-scene" aria-label="A floating solarpunk island above the clouds">
        <picture className="sandbox-sky">
          <source media="(max-width: 720px)" srcSet="/sandbox/scenes/sandbox-mobile-sky.webp" />
          <img src="/sandbox/scenes/sandbox-desktop-sky.webp" alt="" />
        </picture>
        <picture className="sandbox-terrain">
          <source media="(max-width: 720px)" srcSet="/sandbox/scenes/sandbox-mobile-terrain-transparent.webp" />
          <img src="/sandbox/scenes/sandbox-desktop-terrain-transparent.webp" alt="" />
        </picture>

        {sandboxDecorations.map((item) => (
          <div
            className={`sandbox-decoration sandbox-decoration-${item.id}`}
            key={item.id}
            aria-hidden="true"
            style={{
              "--desktop-left": item.desktop[0],
              "--desktop-top": item.desktop[1],
              "--desktop-width": item.desktop[2],
              "--mobile-left": item.mobile[0],
              "--mobile-top": item.mobile[1],
              "--mobile-width": item.mobile[2],
              "--layer": item.zIndex,
            } as SceneStyle}
          >
            <PaintedAsset src={item.asset} />
          </div>
        ))}

        {sandboxLocations.map((location) => {
          const style = {
            "--desktop-left": location.desktop.left,
            "--desktop-top": location.desktop.top,
            "--desktop-width": location.desktop.width,
            "--mobile-left": location.mobile.left,
            "--mobile-top": location.mobile.top,
            "--mobile-width": location.mobile.width,
            "--layer": location.desktop.zIndex,
          } as SceneStyle;
          const content = (
            <>
              <span className="sandbox-location-art" aria-hidden="true">
                <PaintedAsset src={location.asset} />
              </span>
              {location.id !== "return-sign" && (
                <span className="sandbox-label">
                  <strong>{location.label}</strong>
                  <small>{location.description}</small>
                </span>
              )}
            </>
          );

          if (location.id === "return-sign") {
            return (
              <Link
                href="/"
                className="sandbox-location sandbox-return-sign"
                style={style}
                key={location.id}
                aria-label="Return to the server room and go back to the main website"
              >
                {content}
              </Link>
            );
          }

          return (
            <div className={`sandbox-location sandbox-location-${location.id}`} style={style} key={location.id}>
              {content}
            </div>
          );
        })}

        <p className="sandbox-review-note">Static world · first review</p>
      </div>
    </main>
  );
}
