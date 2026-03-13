import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Heading,
  Tailwind,
  Link,
} from "@react-email/components";
import * as React from "react";

interface AdminMessageEmailProps {
  subject: string;
  message: string;
  recipientName?: string;
}

export default function AdminMessageEmail({
  subject,
  message,
  recipientName = "Valued Customer",
}: AdminMessageEmailProps) {
  const year = new Date().getFullYear();

  return (
    <Html>
      <Tailwind>
        <Head />
        <Preview>
          ✉️ {subject} — Fly Bismillah Travels
        </Preview>

        <Body className="bg-white font-sans my-0 mx-auto p-0">
          <Container className="max-w-[560px] mx-auto px-4 py-6">
            {/* ───── Header ───── */}
            <Section className="text-center pb-5">
              <Text className="text-[11px] uppercase tracking-[0.25em] text-slate-400 m-0 mb-2">
                Fly Bismillah
              </Text>
              <Heading className="text-[22px] font-bold text-slate-900 m-0 leading-7">
                Message from Support 💬
              </Heading>
              <Text className="text-[13px] text-slate-500 mt-2 mb-0">
                You have a new message from our team.
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

            <Hr className="border-slate-200 my-0" />

            {/* ───── Greeting ───── */}
            <Section className="mt-5 mb-2">
              <Text className="text-[14px] text-slate-800 leading-[24px] m-0">
                Dear{" "}
                <span className="font-semibold">{recipientName}</span>,
              </Text>
            </Section>

            {/* ───── Message Body ───── */}
            <Section
              className="rounded-xl px-5 py-4 my-4"
              style={{
                backgroundColor: "#f8fafb",
                border: "1px solid #e8ecf0",
                borderLeft: "4px solid #6366f1",
              }}
            >
              <Text
                className="text-[14px] text-slate-700 leading-[26px] m-0"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {message}
              </Text>
            </Section>

            {/* ───── Closing ───── */}
            <Section className="mt-5 mb-5">
              <Text className="text-[14px] text-slate-600 leading-[22px] m-0">
                Best regards,
              </Text>
              <Text className="text-[14px] font-semibold text-slate-900 m-0 mt-1">
                Support Team
              </Text>
              <Text className="text-[12px] text-slate-400 m-0 mt-0">
                Fly Bismillah Travels
              </Text>
            </Section>

            <Hr className="border-slate-200 my-0" />

            {/* ───── Reply Prompt ───── */}
            <Section
              className="rounded-xl px-4 py-3 my-5"
              style={{
                backgroundColor: "#eef2ff",
                borderLeft: "3px solid #6366f1",
              }}
            >
              <Text
                className="text-[10px] font-bold uppercase tracking-[0.2em] m-0 mb-2"
                style={{ color: "#4f46e5" }}
              >
                💡 Want to respond?
              </Text>
              <Text
                className="text-[12px] m-0 leading-[20px]"
                style={{ color: "#312e81" }}
              >
                You can reply directly to this email and our support team will
                get back to you shortly.
              </Text>
            </Section>

            {/* ───── Disclaimer ───── */}
            <Section
              className="rounded-xl px-4 py-3 mb-5"
              style={{
                backgroundColor: "#fffbeb",
                borderLeft: "3px solid #f59e0b",
              }}
            >
              <Text
                className="text-[10px] font-bold uppercase tracking-[0.2em] m-0 mb-2"
                style={{ color: "#d97706" }}
              >
                🛡️ Security Notice
              </Text>
              <Text
                className="text-[11px] m-0 leading-[18px]"
                style={{ color: "#92400e" }}
              >
                This message was sent from the Fly Bismillah admin dashboard.
                We will <span className="font-bold">never</span> ask for
                passwords or payment information via email.
              </Text>
            </Section>

            <Hr className="border-slate-200 my-0" />

            {/* ───── Footer ───── */}
            <Section className="text-center py-5">
              <Text className="text-[12px] text-slate-500 m-0">
                Need more help? Visit{" "}
                <Link
                  href="https://flybismillah.com"
                  className="font-semibold no-underline"
                  style={{ color: "#4f46e5" }}
                >
                  flybismillah.com
                </Link>
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