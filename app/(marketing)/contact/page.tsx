"use client";

import { useState } from "react";

const faqs = [
  {
    question: "How do subscriptions work?",
    answer: "CostPilot AI offers flexible monthly subscriptions. When you subscribe, you receive a set number of AI blueprint estimates per month. You can upgrade, downgrade, or cancel your subscription at any time from your billing settings."
  },
  {
    question: "How many free analyses are included?",
    answer: "Our Free plan includes 2 free blueprint analyses per month. This allows you to test the accuracy and capabilities of our AI before choosing a paid plan."
  },
  {
    question: "Which payment methods are accepted?",
    answer: "We accept all major credit and debit cards (Visa, Mastercard, American Express, Discover) as well as mobile wallets via Stripe. All transactions are secure and encrypted."
  },
  {
    question: "How do I upgrade my plan?",
    answer: "You can upgrade your plan at any time by navigating to your Account Settings and selecting the Subscription tab. The new limits and features will be applied immediately."
  },
  {
    question: "How can I contact support?",
    answer: "You can contact our support team directly via email at support@costpilotsai.com or by filling out the contact form on this page. We typically respond within 24–48 hours."
  }
];

export default function ContactPage() {
  const [formStatus, setFormStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormStatus("submitting");
    // Simulate API request
    setTimeout(() => {
      setFormStatus("success");
    }, 800);
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="flex-1 bg-zinc-50/50 pb-20">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-orange-50 to-white px-6 py-20 border-b border-zinc-200">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-orange-600">
            Get in touch
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-zinc-900 md:text-5xl">
            Contact Us
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600 leading-relaxed">
            We&apos;re here to help. Whether you have questions, need technical support, or want to discuss partnerships, our team is ready to assist.
          </p>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-5">
          {/* Contact Info Cards */}
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-zinc-900">General Support</h3>
              </div>
              <p className="mt-3 text-sm text-zinc-600">
                For technical issues, billing questions, or general product feedback.
              </p>
              <p className="mt-4 text-sm font-medium text-orange-600">
                <a href="mailto:support@costpilotsai.com" className="hover:underline">
                  support@costpilotsai.com
                </a>
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-zinc-900">Business &amp; Partnerships</h3>
              </div>
              <p className="mt-3 text-sm text-zinc-600">
                For custom enterprise inquiries, integrations, or partner programs.
              </p>
              <p className="mt-4 text-sm font-medium text-orange-600">
                <a href="mailto:business@costpilotsai.com" className="hover:underline">
                  business@costpilotsai.com
                </a>
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-zinc-900">Response Time</h3>
              </div>
              <p className="mt-3 text-sm text-zinc-600">
                Our support team reviews messages constantly to help you stay on track.
              </p>
              <p className="mt-4 text-sm font-semibold text-zinc-800">
                Within 24–48 hours
              </p>
            </div>
          </div>

          {/* Contact Form Card */}
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
              {formStatus === "success" ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 animate-bounce">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-zinc-900">Message Sent Successfully!</h3>
                  <p className="mt-3 max-w-md text-sm text-zinc-600">
                    Thank you for contacting us. Your message has been received. Our team will get back to you at the email address provided within 24–48 hours.
                  </p>
                  <button
                    onClick={() => setFormStatus("idle")}
                    className="mt-8 rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition cursor-pointer"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900">Send us a message</h3>
                    <p className="mt-1 text-sm text-zinc-500">
                      Fill out the form below and we will get back to you as soon as possible.
                    </p>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="name" className="mb-1.5 block text-sm font-semibold text-zinc-700">
                        Full Name
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        placeholder="John Doe"
                        className="w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm outline-none transition duration-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-zinc-700">
                        Email Address
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="john@example.com"
                        className="w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm outline-none transition duration-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="mb-1.5 block text-sm font-semibold text-zinc-700">
                      Subject
                    </label>
                    <input
                      id="subject"
                      name="subject"
                      type="text"
                      required
                      placeholder="How can we help you?"
                      className="w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm outline-none transition duration-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="mb-1.5 block text-sm font-semibold text-zinc-700">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      required
                      placeholder="Your message details here..."
                      className="w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm outline-none transition duration-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={formStatus === "submitting"}
                    className="w-full rounded-lg bg-orange-600 py-3 text-sm font-medium text-white shadow-sm hover:bg-orange-700 transition disabled:opacity-60 active:scale-[0.99] cursor-pointer"
                  >
                    {formStatus === "submitting" ? "Sending..." : "Send Message"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions Section */}
      <section className="mx-auto max-w-4xl px-6 py-12 border-t border-zinc-200">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-sm text-zinc-500">
            Quick answers to common questions about CostPilot AI.
          </p>
        </div>

        <div className="mt-10 space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="overflow-hidden rounded-xl border border-zinc-200 bg-white transition"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left font-semibold text-zinc-800 hover:text-zinc-950 cursor-pointer"
                >
                  <span>{faq.question}</span>
                  <span className="ml-4 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-50 text-zinc-400">
                    <svg
                      className={`h-4 w-4 transform transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>
                <div
                  className={`transition-all duration-300 ease-in-out ${isOpen ? "max-h-48 border-t border-zinc-100" : "max-h-0"}`}
                >
                  <div className="px-6 py-5 text-sm leading-relaxed text-zinc-600">
                    {faq.answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
