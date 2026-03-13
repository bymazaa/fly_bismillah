import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

interface TwoFactorStatusProps {
  userName: string;
  status: "enabled" | "disabled";
  location?: string;
  timestamp?: string;
}

export default function TwoFactorStatus({
  userName = "User",
  status = "disabled",
  location = "Unknown",
  timestamp = "Just now",
}: TwoFactorStatusProps) {
  const year = new Date().getFullYear();
  const isEnabled = status === "enabled";

  return (
    <Html>
      <Tailwind>
        <Head />
        <Preview>
          Security Update: 2FA has been {status}
        </Preview>

        <Body className="bg-white font-sans my-0 mx-auto p-0">
          <Container className="max-w-[560px] mx-auto px-4 py-6">
            {/* ───── Header ───── */}
            <Section className="text-center pb-5">
              <Text className="text-[11px] uppercase tracking-[0.25em] text-slate-400 m-0 mb-2">
                Fly Bismillah
              </Text>
              <Heading className="text-[22px] font-bold text-slate-900 m-0 leading-7">
                Two-Factor Authentication{" "}
                {isEnabled ? "Enabled ✅" : "Disabled ⚠️"}
              </Heading>
              <Text className="text-[13px] text-slate-500 mt-2 mb-0">
                A security change was made to your account.
              </Text>
            </Section>

            <Hr className="border-slate-200 my-0" />

            {/* ───── Status Icon ───── */}
            <Section className="text-center py-5">
              <div
                className="inline-block rounded-full"
                style={{
                  width: 64,
                  height: 64,
                  lineHeight: "64px",
                  backgroundColor: isEnabled ? "#ecfdf5" : "#fef2f2",
                  border: `2px solid ${isEnabled ? "#a7f3d0" : "#fecaca"}`,
                  textAlign: "center",
                }}
              >
                <Text
                  className="text-[32px] m-0 leading-none"
                  style={{ lineHeight: "64px" }}
                >
                  {isEnabled ? "🔒" : "🔓"}
                </Text>
              </div>
            </Section>

            {/* ───── Status Badge ───── */}
            <Section className="text-center mb-4">
              <span
                className="inline-block rounded-full text-[11px] font-bold uppercase px-4 py-2"
                style={{
                  letterSpacing: "0.12em",
                  backgroundColor: isEnabled ? "#ecfdf5" : "#fef2f2",
                  color: isEnabled ? "#065f46" : "#991b1b",
                  border: `1px solid ${isEnabled ? "#a7f3d0" : "#fecaca"}`,
                }}
              >
                2FA {status}
              </span>
            </Section>

            <Hr className="border-slate-200 my-0" />

            {/* ───── Greeting ───── */}
            <Section className="mt-5 mb-2">
              <Text className="text-[14px] text-slate-800 leading-[24px] m-0">
                Hello <span className="font-semibold">{userName}</span>,
              </Text>
              <Text className="text-[14px] text-slate-600 leading-[24px] mt-3 mb-0">
                Two-Factor Authentication (2FA) for your{" "}
                <span className="font-semibold text-slate-800">
                  Fly Bismillah Admin
                </span>{" "}
                account has been{" "}
                <span
                  className="font-bold"
                  style={{ color: isEnabled ? "#059669" : "#dc2626" }}
                >
                  {status}
                </span>
                .
              </Text>
            </Section>

            {/* ───── Activity Details ───── */}
            <Section
              className="rounded-xl px-4 py-4 my-5"
              style={{
                backgroundColor: "#f8fafb",
                border: "1px solid #e8ecf0",
              }}
            >
              <Text className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 m-0 mb-3">
                📍 Activity Details
              </Text>

              <table cellPadding={0} cellSpacing={0} width="100%">
                <tr>
                  <td style={{ padding: "6px 0" }}>
                    <Text className="text-[12px] text-slate-500 m-0">
                      Action
                    </Text>
                  </td>
                  <td style={{ padding: "6px 0", textAlign: "right" }}>
                    <Text
                      className="text-[12px] font-semibold m-0"
                      style={{
                        color: isEnabled ? "#065f46" : "#991b1b",
                      }}
                    >
                      2FA {status}
                    </Text>
                  </td>
                </tr>
                <tr
                  style={{
                    borderTop: "1px solid #f1f5f9",
                  }}
                >
                  <td style={{ padding: "6px 0" }}>
                    <Text className="text-[12px] text-slate-500 m-0">
                      Location
                    </Text>
                  </td>
                  <td style={{ padding: "6px 0", textAlign: "right" }}>
                    <Text className="text-[12px] font-semibold text-slate-800 m-0">
                      {location}
                    </Text>
                  </td>
                </tr>
                <tr
                  style={{
                    borderTop: "1px solid #f1f5f9",
                  }}
                >
                  <td style={{ padding: "6px 0" }}>
                    <Text className="text-[12px] text-slate-500 m-0">
                      Time
                    </Text>
                  </td>
                  <td style={{ padding: "6px 0", textAlign: "right" }}>
                    <Text className="text-[12px] font-semibold text-slate-800 m-0">
                      {timestamp}
                    </Text>
                  </td>
                </tr>
              </table>
            </Section>

            {/* ───── Conditional Info Box ───── */}
            {isEnabled ? (
              <Section
                className="rounded-xl px-4 py-4 mb-5"
                style={{
                  backgroundColor: "#ecfdf5",
                  borderLeft: "3px solid #10b981",
                }}
              >
                <Text
                  className="text-[10px] font-bold uppercase tracking-[0.2em] m-0 mb-2"
                  style={{ color: "#059669" }}
                >
                  ✅ Great choice!
                </Text>
                <Text
                  className="text-[12px] m-0 leading-[20px]"
                  style={{ color: "#065f46" }}
                >
                  Your account is now more secure. You'll be asked for a
                  verification code each time you sign in from a new device or
                  browser.
                </Text>
              </Section>
            ) : (
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
                  ⚠ Security Reduced
                </Text>
                <Text
                  className="text-[11px] m-0 leading-[18px]"
                  style={{ color: "#991b1b" }}
                >
                  • Your account is now{" "}
                  <span className="font-bold">less secure</span> without 2FA.
                </Text>
                <Text
                  className="text-[11px] m-0 mt-1 leading-[18px]"
                  style={{ color: "#991b1b" }}
                >
                  • We strongly recommend{" "}
                  <span className="font-bold">re-enabling</span> 2FA for
                  maximum protection.
                </Text>
                <Text
                  className="text-[11px] m-0 mt-1 leading-[18px]"
                  style={{ color: "#991b1b" }}
                >
                  • If you didn't make this change, secure your account{" "}
                  <span className="font-bold">immediately</span>.
                </Text>
              </Section>
            )}

            {/* ───── CTA Button ───── */}
            <Section className="text-center my-6">
              <Button
                href="https://flybismillah.com/admin/settings"
                className="rounded-full font-bold text-[14px] text-white px-10 py-4 no-underline inline-block"
                style={{
                  background: isEnabled
                    ? "linear-gradient(135deg, #059669 0%, #0d9488 100%)"
                    : "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
                }}
              >
                {isEnabled
                  ? "🔒 View Security Settings"
                  : "🔓 Re-enable 2FA Now"}
              </Button>
            </Section>

            {/* ───── Warning Box (if wasn't them) ───── */}
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
                🔔 Didn't make this change?
              </Text>
              <Text
                className="text-[11px] m-0 leading-[18px]"
                style={{ color: "#92400e" }}
              >
                Contact your{" "}
                <span className="font-bold">Workspace Administrator</span> or
                your company's{" "}
                <span className="font-bold">IT Security Team</span> immediately
                to secure your account.
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