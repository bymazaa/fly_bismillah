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

interface TeamInviteProps {
  invitedBy?: string;
  invitedName?: string;
  invitedRole?: string;
  inviteLink?: string;
}

export default function TeamInvite({
  invitedBy = "Asif",
  invitedName = "Rahim",
  invitedRole = "Admin",
  inviteLink = "https://flybismillah.com/admin",
}: TeamInviteProps) {
  const year = new Date().getFullYear();

  return (
    <Html>
      <Tailwind>
        <Head />
        <Preview>
          {invitedBy} invited you to join Fly Bismillah as {invitedRole}
        </Preview>

        <Body className="bg-white font-sans my-0 mx-auto p-0">
          <Container className="max-w-[560px] mx-auto px-4 py-6">
            {/* ───── Header ───── */}
            <Section className="text-center pb-5">
              <Text className="text-[11px] uppercase tracking-[0.25em] text-slate-400 m-0 mb-2">
                Fly Bismillah
              </Text>
              <Heading className="text-[22px] font-bold text-slate-900 m-0 leading-7">
                You're Invited! 🎉
              </Heading>
              <Text className="text-[13px] text-slate-500 mt-2 mb-0">
                Join the Fly Bismillah workspace.
              </Text>
            </Section>

            <Hr className="border-slate-200 my-0" />

            {/* ───── Invite Icon ───── */}
            <Section className="text-center py-5">
              <div
                className="inline-block rounded-full"
                style={{
                  width: 64,
                  height: 64,
                  lineHeight: "64px",
                  backgroundColor: "#eef2ff",
                  border: "2px solid #c7d2fe",
                  textAlign: "center",
                }}
              >
                <Text
                  className="text-[32px] m-0 leading-none"
                  style={{ lineHeight: "64px" }}
                >
                  🤝
                </Text>
              </div>
            </Section>

            {/* ───── Greeting ───── */}
            <Section className="mb-2">
              <Text className="text-[14px] text-slate-800 leading-[24px] m-0">
                Hello <span className="font-semibold">{invitedName}</span>,
              </Text>
              <Text className="text-[14px] text-slate-600 leading-[24px] mt-3 mb-0">
                <span className="font-semibold text-slate-800">
                  {invitedBy}
                </span>{" "}
                has invited you to join the{" "}
                <span className="font-semibold text-slate-800">
                  Fly Bismillah
                </span>{" "}
                team as a collaborator. Accept the invitation below to get
                started.
              </Text>
            </Section>

            {/* ───── Invite Details Card ───── */}
            <Section
              className="rounded-xl px-4 py-4 my-5"
              style={{
                backgroundColor: "#f8fafb",
                border: "1px solid #e8ecf0",
              }}
            >
              <Text className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 m-0 mb-3">
                📋 Invitation Details
              </Text>

              <table cellPadding={0} cellSpacing={0} width="100%">
                <tr>
                  <td style={{ padding: "6px 0" }}>
                    <Text className="text-[12px] text-slate-500 m-0">
                      Invited By
                    </Text>
                  </td>
                  <td style={{ padding: "6px 0", textAlign: "right" }}>
                    <Text className="text-[12px] font-semibold text-slate-800 m-0">
                      {invitedBy}
                    </Text>
                  </td>
                </tr>
                <tr style={{ borderTop: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "6px 0" }}>
                    <Text className="text-[12px] text-slate-500 m-0">
                      Workspace
                    </Text>
                  </td>
                  <td style={{ padding: "6px 0", textAlign: "right" }}>
                    <Text className="text-[12px] font-semibold text-slate-800 m-0">
                      Fly Bismillah
                    </Text>
                  </td>
                </tr>
                <tr style={{ borderTop: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "6px 0" }}>
                    <Text className="text-[12px] text-slate-500 m-0">
                      Your Role
                    </Text>
                  </td>
                  <td style={{ padding: "6px 0", textAlign: "right" }}>
                    <span
                      className="inline-block rounded-full text-[10px] font-bold uppercase px-3 py-1"
                      style={{
                        letterSpacing: "0.1em",
                        backgroundColor:
                          invitedRole === "Admin"
                            ? "#eef2ff"
                            : invitedRole === "Editor"
                            ? "#ecfdf5"
                            : "#f8fafb",
                        color:
                          invitedRole === "Admin"
                            ? "#4338ca"
                            : invitedRole === "Editor"
                            ? "#065f46"
                            : "#475569",
                        border: `1px solid ${
                          invitedRole === "Admin"
                            ? "#c7d2fe"
                            : invitedRole === "Editor"
                            ? "#a7f3d0"
                            : "#e2e8f0"
                        }`,
                      }}
                    >
                      {invitedRole}
                    </span>
                  </td>
                </tr>
              </table>
            </Section>

            {/* ───── What You'll Get ───── */}
            <Section
              className="rounded-xl px-4 py-4 mb-5"
              style={{
                backgroundColor: "#eef2ff",
                borderLeft: "3px solid #6366f1",
              }}
            >
              <Text
                className="text-[10px] font-bold uppercase tracking-[0.2em] m-0 mb-2"
                style={{ color: "#4f46e5" }}
              >
                🚀 What you'll get access to
              </Text>
              <Text
                className="text-[12px] m-0 leading-[20px]"
                style={{ color: "#312e81" }}
              >
                • Manage flight bookings &amp; ticketing.
              </Text>
              <Text
                className="text-[12px] m-0 mt-1 leading-[20px]"
                style={{ color: "#312e81" }}
              >
                • View customer records &amp; trip details.
              </Text>
              <Text
                className="text-[12px] m-0 mt-1 leading-[20px]"
                style={{ color: "#312e81" }}
              >
                • Collaborate with the team in real-time.
              </Text>
            </Section>

    

            {/* ───── Fallback Link ───── */}
            <Section
              className="rounded-xl px-4 py-3 mb-5"
              style={{
                backgroundColor: "#f8fafb",
                border: "1px solid #e8ecf0",
              }}
            >
              <Text className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 m-0 mb-2">
                🔗 Button not working?
              </Text>
              <Text className="text-[11px] text-slate-600 m-0 leading-[18px]">
                Copy and paste this URL into your browser:
              </Text>
              <Text className="m-0 mt-2">
                <Link
                  href={inviteLink}
                  className="text-[11px] no-underline break-all"
                  style={{ color: "#4f46e5" }}
                >
                  {inviteLink}
                </Link>
              </Text>
            </Section>

            {/* ───── Ignore Notice ───── */}
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
                💡 Not expecting this?
              </Text>
              <Text
                className="text-[11px] m-0 leading-[18px]"
                style={{ color: "#92400e" }}
              >
                If you weren't expecting this invitation, you can{" "}
                <span className="font-bold">safely ignore</span> this email. No
                action will be taken on your behalf.
              </Text>
            </Section>

            <Hr className="border-slate-200 my-0" />

            {/* ───── Footer ───── */}
            <Section className="text-center py-5">
              <Text className="text-[12px] text-slate-500 m-0">
                Have questions? Reply to this email or contact our{" "}
                <span
                  className="font-semibold"
                  style={{ color: "#4f46e5" }}
                >
                  support team
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