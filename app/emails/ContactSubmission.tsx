import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

interface ContactEmailProps {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export default function ContactSubmission({
  name = "John Doe",
  email = "john@example.com",
  phone = "+8801712345678",
  subject = "Need help with Umrah Package",
  message = "Hello, I am interested in the premium package for next month. Can you please share the details and pricing?",
}: ContactEmailProps) {
  const year = new Date().getFullYear();

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Html>
      <Tailwind>
        <Head />
        <Preview>
          ✉️ New message from {name}: {subject}
        </Preview>

        <Body className="bg-white font-sans my-0 mx-auto p-0">
          <Container className="max-w-[560px] mx-auto px-4 py-6">
            {/* ───── Header ───── */}
            <Section className="text-center pb-5">
              <Text className="text-[11px] uppercase tracking-[0.25em] text-slate-400 m-0 mb-2">
                Fly Bismillah
              </Text>
              <Heading className="text-[22px] font-bold text-slate-900 m-0 leading-7">
                New Contact Message 📬
              </Heading>
              <Text className="text-[13px] text-slate-500 mt-2 mb-0">
                Someone reached out through the website.
              </Text>
            </Section>

            <Hr className="border-slate-200 my-0" />

            {/* ───── Subject ───── */}
            <Section className="text-center py-4">
              <Text className="text-[10px] uppercase tracking-[0.2em] text-slate-400 m-0 mb-1">
                Subject
              </Text>
              <Text className="text-[18px] font-bold text-slate-900 m-0 leading-6">
                {subject}
              </Text>
            </Section>

            {/* ───── Timestamp ───── */}
            <Section className="text-center mb-4">
              <span
                className="inline-block rounded-full px-4 py-1 text-[11px] font-semibold"
                style={{ backgroundColor: "#f1f5f9", color: "#64748b" }}
              >
                📅 {currentDate} · 🕐 {currentTime}
              </span>
            </Section>

            <Hr className="border-slate-200 my-0" />

            {/* ───── Sender Info Card ───── */}
            <Section
              className="rounded-xl px-4 py-4 my-5"
              style={{
                backgroundColor: "#f8fafb",
                border: "1px solid #e8ecf0",
              }}
            >
              <Text className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 m-0 mb-3">
                👤 Contact Information
              </Text>

              <table cellPadding={0} cellSpacing={0} width="100%">
                <tr>
                  <td style={{ padding: "8px 0" }}>
                    <Text className="text-[11px] text-slate-400 m-0 mb-1">
                      Full Name
                    </Text>
                    <Text className="text-[14px] font-semibold text-slate-800 m-0">
                      {name}
                    </Text>
                  </td>
                </tr>
                <tr style={{ borderTop: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "8px 0" }}>
                    <Text className="text-[11px] text-slate-400 m-0 mb-1">
                      Email Address
                    </Text>
                    <Text className="m-0">
                      <Link
                        href={`mailto:${email}`}
                        className="text-[14px] font-semibold no-underline"
                        style={{ color: "#4f46e5" }}
                      >
                        {email}
                      </Link>
                    </Text>
                  </td>
                </tr>
                <tr style={{ borderTop: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "8px 0" }}>
                    <Text className="text-[11px] text-slate-400 m-0 mb-1">
                      Phone Number
                    </Text>
                    <Text className="m-0">
                      <Link
                        href={`tel:${phone}`}
                        className="text-[14px] font-semibold no-underline"
                        style={{ color: "#059669" }}
                      >
                        {phone || "Not provided"}
                      </Link>
                    </Text>
                  </td>
                </tr>
              </table>
            </Section>

            {/* ───── Message Content ───── */}
            <Section
              className="rounded-xl px-5 py-5 mb-5"
              style={{
                backgroundColor: "#f8fafb",
                border: "1px solid #e8ecf0",
                borderLeft: "4px solid #3b82f6",
              }}
            >
              <Text className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 m-0 mb-3">
                💬 Message
              </Text>
              <Text className="text-[14px] text-slate-700 leading-[26px] m-0 whitespace-pre-wrap">
                {message}
              </Text>
            </Section>

            {/* ───── Quick Actions ───── */}
            <Section className="text-center my-6">
              <Button
                href={`mailto:${email}?subject=Re: ${encodeURIComponent(subject)}`}
                className="rounded-full font-bold text-[14px] text-white px-10 py-4 no-underline inline-block"
                style={{
                  background:
                    "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                }}
              >
                ✉️ Reply to {name}
              </Button>

              <Section className="mt-3">
                <Button
                  href={`tel:${phone}`}
                  className="rounded-full font-semibold text-[13px] px-8 py-3 no-underline inline-block"
                  style={{
                    background: "transparent",
                    color: "#059669",
                    border: "2px solid #059669",
                  }}
                >
                  📞 Call {phone}
                </Button>
              </Section>

              <Text className="text-[11px] text-slate-400 mt-3 mb-0">
                Respond directly using the buttons above.
              </Text>
            </Section>

            <Hr className="border-slate-200 my-0" />

            {/* ───── Priority Note ───── */}
            <Section
              className="rounded-xl px-4 py-3 my-5"
              style={{
                backgroundColor: "#fffbeb",
                borderLeft: "3px solid #f59e0b",
              }}
            >
              <Text
                className="text-[10px] font-bold uppercase tracking-[0.2em] m-0 mb-2"
                style={{ color: "#d97706" }}
              >
                ⏰ Response Reminder
              </Text>
              <Text
                className="text-[11px] m-0 leading-[18px]"
                style={{ color: "#92400e" }}
              >
                • Try to respond within{" "}
                <span className="font-bold">1-2 hours</span> during business
                hours.
              </Text>
              <Text
                className="text-[11px] m-0 mt-1 leading-[18px]"
                style={{ color: "#92400e" }}
              >
                • This customer may also be waiting on{" "}
                <span className="font-bold">WhatsApp</span> or{" "}
                <span className="font-bold">phone</span>.
              </Text>
            </Section>

            <Hr className="border-slate-200 my-0" />

            {/* ───── Footer ───── */}
            <Section className="text-center py-5">
              <Text className="text-[12px] text-slate-500 m-0">
                Auto-generated from the Fly Bismillah contact form.
              </Text>
              <Text className="text-[10px] text-slate-400 mt-4 mb-0">
                © {year} Fly Bismillah · All rights reserved
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}