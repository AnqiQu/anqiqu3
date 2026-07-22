import type { Metadata } from "next";
import Link from "next/link";
import { Footer, Header } from "../components/site-shell";
import { contactLinks } from "../content";

export const metadata: Metadata = {
  title: "Book a Demo | Anqi Intelligence",
  description:
    "Contact Anqi Qu for coffee, collaborations, research, startup conversations, or sufficiently specific questions.",
};

export default function ContactPage() {
  return (
    <div className="site-frame contact-page">
      <Header />
      <main className="contact-main">
        <div className="contact-grid-bg" aria-hidden="true" />
        <div className="container contact-inner">
          <div className="contact-heading">
            <p className="eyebrow">BOOK A DEMO</p>
            <h1>Select a communication protocol.</h1>
            <p>
              For coffee, collaborations, research, startup conversations, or
              sufficiently specific questions.
            </p>
          </div>

          <div className="contact-options">
            {contactLinks.map((link, index) => (
              <a
                key={link.label}
                href={link.href}
                className="contact-option"
                target={link.href.startsWith("http") ? "_blank" : undefined}
                rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                aria-label={`${link.label}: ${link.value}`}
              >
                <span className="contact-index">0{index + 1}</span>
                <span className="contact-label">{link.label}</span>
                <span className="contact-value">{link.value}</span>
                <span className="contact-arrow" aria-hidden="true">
                  ↗
                </span>
              </a>
            ))}
          </div>

          <div className="contact-footer-note">
            <p>
              No sales team is currently available. You will be routed directly
              to the model.
            </p>
            <Link href="/">← Return to system overview</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
