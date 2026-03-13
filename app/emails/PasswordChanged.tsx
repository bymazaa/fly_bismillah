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

export default function PasswordChanged({
  userName = "Asif",
}: {
  userName: string;
}) {
  const year = new Date().getFullYear();

  return (
    <Html>
      <Tailwind>
        <Head />
        <Preview>Your Fly Bismillah password has been changed</Preview>

        <Body className="bg-white font-sans my-0 mx-auto p-0">
          <Container className="max-w-[560px] mx-auto px-4 py-6">
            {/* ───── Header ───── */}
            <Section className="text-center pb-5">
              <Text className="text-[11px] uppercase tracking-[0.25em] text-slate-400 m-0 mb-2">
                Fly Bismillah
              </Text>
              <Heading className="text-[22px] font-bold text-slate-900 m-0 leading-7">
                Password Changed ✓
              </Heading>
              <Text className="text-[13px] text-slate-500 mt-2 mb-0">
                Your account security has been updated.
              </Text>
            </Section>

            <Hr className="border-slate-200 my-0" />

            {/* ───── Success Icon ───── */}
            <Section className="text-center py-5">
              <div
                className="inline-block rounded-full"
                style={{
                  width: 64,
                  height: 64,
                  lineHeight: "64px",
                  backgroundColor: "#ecfdf5",
                  border: "2px solid #a7f3d0",
                  textAlign: "center",
                }}
              >
                <Text
                  className="text-[32px] m-0 leading-none"
                  style={{ lineHeight: "64px" }}
                >
                  🛡️
                </Text>
              </div>
            </Section>

            {/* ───── Greeting ───── */}
            <Section className="mb-2">
              <Text className="text-[14px] text-slate-800 leading-[24px] m-0">
                Hello <span className="font-semibold">{userName}</span>,
              </Text>
              <Text className="text-[14px] text-slate-600 leading-[24px] mt-3 mb-0">
                This is to confirm that the password for your{" "}
                <span className="font-semibold text-slate-800">
                  Fly Bismillah Admin
                </span>{" "}
                account has been{" "}
                <span
                  className="font-bold"
                  style={{ color: "#059669" }}
                >
                  successfully updated
                </span>
                .
              </Text>
            </Section>

            {/* ───── Change Details ───── */}
            <Section
              className="rounded-xl px-4 py-4 my-5"
              style={{
                backgroundColor: "#ecfdf5",
                borderLeft: "3px solid #10b981",
              }}
            >
              <Text
                className="text-[10px] font-bold uppercase tracking-[0.2em] m-0 mb-2"
                style={{ color: "#059669" }}
              >
                ✅ Confirmation
              </Text>
              <Text
                className="text-[12px] m-0 leading-[20px]"
                style={{ color: "#065f46" }}
              >
                • Password was changed{" "}
                <span className="font-bold">just now</span>.
              </Text>
              <Text
                className="text-[12px] m-0 mt-1 leading-[20px]"
                style={{ color: "#065f46" }}
              >
                • All other active sessions remain logged in.
              </Text>
              <Text
                className="text-[12px] m-0 mt-1 leading-[20px]"
                style={{ color: "#065f46" }}
              >
                • Use your new password for your next login.
              </Text>
            </Section>

            {/* ───── Warning ───── */}
            <Section
              className="rounded-xl px-4 py-3 mb-5"
              style={{
                backgroundColor: "#fef2f2",
                borderLeft: "3px solid #ef4444",
              }}
            >
              <Text
                className="text-[10px] font-bold uppercase tracking-[0.2em] m-0 mb-2"
                style={{ color: "#dc2626" }}
              >
                ⚠ Didn't do this?
              </Text>
              <Text
                className="text-[11px] m-0 leading-[18px]"
                style={{ color: "#991b1b" }}
              >
                If you did not make this change, your account may be
                compromised. Use{" "}
                <span className="font-bold">Forgot Password</span> immediately
                to secure your account and contact our support team.
              </Text>
            </Section>

            {/* ───── CTA Button ───── */}
            <Section className="text-center my-6">
              <Button
                href="https://flybismillah.com/access"
                className="rounded-full font-bold text-[14px] text-white px-10 py-4 no-underline inline-block"
                style={{
                  background:
                    "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
                }}
              >
                🔒 Go to Dashboard
              </Button>
            </Section>

            {/* ───── Security Tips ───── */}
            <Section
              className="rounded-xl px-4 py-4 mb-5"
              style={{
                backgroundColor: "#f8fafb",
                border: "1px solid #e8ecf0",
              }}
            >
              <Text className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 m-0 mb-2">
                🛡 Security Reminders
              </Text>
              <Text className="text-[12px] text-slate-600 m-0 leading-[20px]">
                • Never share your password with anyone.
              </Text>
              <Text className="text-[12px] text-slate-600 m-0 mt-1 leading-[20px]">
                • Use a{" "}
                <span className="font-semibold text-slate-700">
                  unique, strong password
                </span>{" "}
                for each account.
              </Text>
              <Text className="text-[12px] text-slate-600 m-0 mt-1 leading-[20px]">
                • Enable{" "}
                <span className="font-semibold text-slate-700">
                  two-factor authentication
                </span>{" "}
                when available.
              </Text>
              <Text className="text-[12px] text-slate-600 m-0 mt-1 leading-[20px]">
                • Log out of shared or public devices after use.
              </Text>
            </Section>

            <Hr className="border-slate-200 my-0" />

            {/* ───── Footer ───── */}
            <Section className="text-center py-5">
              <Text className="text-[12px] text-slate-500 m-0">
                This is an automated security notification. Need help?{" "}
                <span
                  className="font-semibold"
                  style={{ color: "#4f46e5" }}
                >
                  Reply to this email
                </span>
                .
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