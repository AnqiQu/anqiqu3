import Link from "next/link";
import Image from "next/image";
import { Footer, Header, SectionHeader } from "./components/site-shell";
import {
  changelog,
  companies,
  comparisons,
  compliance,
  knownIssues,
  specifications,
} from "./content";

function Result({ value }: { value: string }) {
  return <span className="result">{value}</span>;
}

export default function Home() {
  return (
    <div className="site-frame">
      <Header />
      <main>
        <section className="hero" id="overview">
          <div className="hero-technical" aria-hidden="true">
            <span className="orbit orbit-one" />
            <span className="orbit orbit-two" />
            <span className="orbit-node orbit-node-one" />
            <span className="orbit-node orbit-node-two" />
          </div>
          <div className="container hero-inner">
            <div className="hero-copy">
              <h1>
                Welcome to the new era of <span className="hero-initial">A</span>
                <span className="hero-parenthetical">nqi</span>{" "}
                <span className="hero-initial">I</span>
                <span className="hero-parenthetical">ntelligence</span>.
              </h1>
              <p className="hero-subtitle">
                Our most advanced multimodal human model yet.
              </p>
              <div className="hero-actions">
                <Link href="/contact" className="button">
                  Book a demo <span aria-hidden="true">↗</span>
                </Link>
                <Link href="#specs" className="button button-secondary">
                  View specifications <span aria-hidden="true">↓</span>
                </Link>
              </div>
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
                        className={`company-logo-item ${company.name === "NVIDIA" ? "company-logo-item-nvidia" : ""}`}
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
                      ) : "href" in row ? (
                        <Link href={row.href}>{row.value} ↗</Link>
                      ) : (
                        row.value
                      )}
                    </span>
                  </div>
                ))}
              </div>

              <aside className="known-issues" aria-labelledby="issues-title">
                <div className="panel-heading">
                  <p className="eyebrow" id="issues-title">
                    KNOWN ISSUES
                  </p>
                  <span>5 OPEN</span>
                </div>
                <div className="issue-list">
                  {knownIssues.map((issue) => (
                    <div className="issue" key={issue.id}>
                      <span>{issue.id}</span>
                      <p>{issue.text}</p>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="section reveal" id="changelog">
          <div className="container">
            <SectionHeader title="Changelog" />
            <div className="timeline">
              {changelog.map((entry) => (
                <article className="timeline-entry" key={entry.year}>
                  <span className="timeline-node" aria-hidden="true" />
                  <div className="timeline-content">
                    <div className="timeline-primary">
                      <time>{entry.year}</time>
                      <span className="timeline-divider" aria-hidden="true" />
                      <p>{entry.text}</p>
                    </div>
                    <p className="timeline-details">{entry.details}</p>
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
                  </article>
                ))}
              </div>
            </div>
            <p className="footnote">
              Benchmark results are self-reported and have not been independently
              reproduced.
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
                    <h3>{item.standard}</h3>
                    <span>{item.status}</span>
                  </div>
                  <p>{item.value}</p>
                </article>
              ))}
            </div>
            <p className="disclosure">
              No formal guarantees, service-level agreements, or emotional
              availability commitments are currently offered.
            </p>
          </div>
        </section>

        <section className="section final-section reveal">
          <div className="container">
            <div className="final-cta">
              <div>
                <h2>Book a demo</h2>
              </div>
              <div className="final-cta-copy">
                <p>
                  Available for coffee, collaborations, research, startup
                  conversations, and other unsupported use cases.
                </p>
                <Link href="/contact" className="button">
                  View contact options <span aria-hidden="true">↗</span>
                </Link>
                <span>Typical response latency: variable.</span>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
