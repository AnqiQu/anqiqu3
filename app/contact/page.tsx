import type { Metadata } from "next";
import Image from "next/image";
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
        <div className="container contact-inner">
          <div className="contact-options">
            {contactLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`contact-option contact-option-${link.label.toLowerCase()}`}
                target={link.href.startsWith("http") ? "_blank" : undefined}
                rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                aria-label={`${link.label}: ${link.value}`}
              >
                <Image
                  src={link.icon}
                  alt=""
                  width={72}
                  height={72}
                  unoptimized
                />
                <span className="contact-value">{link.value}</span>
              </a>
            ))}
          </div>

          <div className="contact-footer-note">
            <p>
              No sales team is currently available. You will be routed directly
              to the Anqi.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
