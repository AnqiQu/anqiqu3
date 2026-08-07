// Renders the favicon <link> in JSX so the href stays origin-relative. Next's
// metadata.icons (and the app/icon.svg convention) resolve against metadataBase
// in this setup, which would point every environment at the production domain.
// React 19 hoists this <link> into <head>; scope it per page so /sandbox can
// swap in its own mark.
export function Favicon({ href }: { href: string }) {
  return <link rel="icon" type="image/svg+xml" href={href} />;
}
