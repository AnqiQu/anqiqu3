import Link from "next/link";
import Image from "next/image";
import { Benchmarks } from "./components/benchmarks";
import { HeroHype } from "./components/hero-hype";
import { HeroTechnical } from "./components/hero-technical";
import { Footer, Header, SectionHeader } from "./components/site-shell";
import {
  changelog,
  companies,
  comparisons,
  compliance,
  specifications,
} from "./content";

const CHANGELOG_TONES: Record<string, string> = {
  Added: "positive",
  Improved: "positive",
  Fixed: "positive",
  Changed: "warn",
  Deprecated: "warn",
  "Known issues": "warn",
  "Breaking changes": "negative",
  "Known regressions": "negative",
};

function Result({ value }: { value: string }) {
  return <span className="result">{value}</span>;
}

export default function Home() {
  return (
    <div className="site-frame">
      <Header />
      <main>
        <section className="hero" id="overview">
          <HeroTechnical />
          <HeroHype />
          <div className="container hero-inner">
            <div className="hero-copy">
              <h1>
                Welcome to the new era of <span className="hero-initial">A</span>
                <span className="hero-parenthetical">nqi</span>{" "}
                <span className="hero-initial">I</span>
                <span className="hero-parenthetical">ntelligence</span>
              </h1>
              <p className="hero-subtitle">
                Our most advanced multimodal human model yet.
              </p>
            </div>

          </div>
        </section>

        <section className="company-cloud" aria-labelledby="company-label">
          <div className="container">
            <p className="company-label" id="company-label">
              OBSERVED IN PROXIMITY TO PEOPLE AT
            </p>
            <div className="company-marquee">
              <div className="company-marquee-track">
                {[false, true].map((duplicate) => (
                  <div
                    className="company-marquee-group"
                    aria-hidden={duplicate || undefined}
                    key={duplicate ? "duplicate" : "original"}
                  >
                    {companies.map((company) => (
                      <span
                        className={`company-logo-item ${company.name === "NVIDIA" ? "company-logo-item-nvidia" : ""} ${company.name === "Apple" || company.name === "Meta" ? "company-logo-item-featured" : ""}`}
                        key={company.name}
                      >
                        <Image
                          src={company.logo}
                          alt={duplicate ? "" : company.name}
                          width={180}
                          height={48}
                          unoptimized
                        />
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="company-more-wrap">
              <p className="company-more">…and many more*</p>
              <p className="company-more-note">*there are no more.</p>
            </div>
          </div>
        </section>

        <section className="section reveal" id="specs">
          <div className="container">
            <SectionHeader title="Technical specifications" />

            <div className="spec-layout">
              <div className="spec-table" role="table" aria-label="Technical specifications">
                {specifications.map((row) => (
                  <div className="spec-row" role="row" key={row.label}>
                    <span role="cell" className="spec-label">
                      {row.label}
                    </span>
                    <span role="cell" className="spec-value">
                      {"dimensions" in row ? (
                        <span className="spec-dimensions">
                          {row.dimensions.map((dimension) => (
                            <strong key={dimension.label}>
                              {dimension.label}:{" "}
                              {"href" in dimension ? (
                                <Link href={dimension.href}>{dimension.value}</Link>
                              ) : (
                                dimension.value
                              )}
                            </strong>
                          ))}
                        </span>
                      ) : "href" in row && typeof row.href === "string" ? (
                        <Link href={row.href}>{row.value} ↗</Link>
                      ) : (
                        row.value
                      )}
                    </span>
                  </div>
                ))}
              </div>

              <Benchmarks />
            </div>
            <p className="footnote">
              AnqBench is an internal benchmark suite. Results are self-reported,
              unpublished, and not reproducible by design. Higher is better.
            </p>
          </div>
        </section>

        <section className="section reveal" id="changelog">
          <div className="container">
            <SectionHeader title="Changelog" />
            <div className="timeline">
              {changelog.map((entry) => (
                <article className="timeline-entry" key={entry.version}>
                  <span className="timeline-node" aria-hidden="true" />
                  <div className="timeline-content">
                    <time className="release-year">{entry.year}</time>
                    <div className="timeline-primary">
                      <span className="release-version">{entry.version}</span>
                      <p className="release-headline">{entry.headline}</p>
                    </div>
                    <ul className="release-notes">
                      {entry.notes.map((note) => (
                        <li key={note.label}>
                          <span
                            className={`release-tag release-tag-${
                              CHANGELOG_TONES[note.label] ?? "warn"
                            }`}
                          >
                            {note.label}
                          </span>
                          <span className="release-note-text">{note.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section reveal" id="comparison">
          <div className="container">
            <SectionHeader title="Compare adjacent solutions" />
            <div className="comparison-table-wrap">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th scope="col">Capability</th>
                    <th scope="col" className="anqi-column">
                      <span className="model-column-name">Anqi</span>
                    </th>
                    <th scope="col">ChatGPT</th>
                    <th scope="col">Claude</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisons.map((row) => (
                    <tr key={row.capability}>
                      <th scope="row">{row.capability}</th>
                      <td className="anqi-column">
                        <Result value={row.anqi} />
                      </td>
                      <td>
                        <Result value={row.chatgpt} />
                      </td>
                      <td>
                        <Result value={row.claude} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="comparison-cards" aria-label="Model comparison">
                {comparisons.map((row) => (
                  <article className="comparison-card" key={row.capability}>
                    <h3>{row.capability}</h3>
                    <div>
                      <span>Anqi</span>
                      <Result value={row.anqi} />
                    </div>
                    <div>
                      <span>ChatGPT</span>
                      <Result value={row.chatgpt} />
                    </div>
                    <div>
                      <span>Claude</span>
                      <Result value={row.claude} />
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <p className="footnote">
              Benchmark results are self-reported and have not been independently
              reproduced. Neither OpenAI nor Anthropic authorised this comparison.
            </p>
          </div>
        </section>

        <section className="section reveal" id="compliance">
          <div className="container">
            <SectionHeader title="Security & compliance" />
            <div className="compliance-grid">
              {compliance.map((item, index) => (
                <article
                  className={`compliance-card ${index === 2 ? "compliance-card-wide" : ""}`}
                  key={item.standard}
                >
                  <div className="compliance-card-header">
                    <span>{item.status}</span>
                    <h3>{item.standard}</h3>
                  </div>
                  <p>{item.value}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
