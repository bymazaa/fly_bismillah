// emails/PackageBookingEmail.tsx
import * as React from "react";
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Hr,
} from "@react-email/components";

type Guests = {
  adults: number;
  children: number;
};

export type PackageBookingEmailProps = {
  packageTitle: string;
  packagePrice: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  travelDate: string;
  returnDate: string;
  guests: Guests;
  notes?: string;
};

export const PackageBookingEmail = ({
  packageTitle,
  packagePrice,
  customerName,
  customerEmail,
  customerPhone,
  travelDate,
  returnDate,
  guests,
  notes,
}: PackageBookingEmailProps) => {
  const totalGuests = (guests?.adults || 0) + (guests?.children || 0);

  return (
    <Html>
      <Head />
      <Preview>New Package Booking Request from {customerName}</Preview>

      <Body
        style={{
          backgroundColor: "#f5f5f5",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <Container
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "24px 16px",
          }}
        >
          <Section
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              padding: "24px 20px",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.1)",
            }}
          >
            <Heading
              style={{
                fontSize: "22px",
                margin: "0 0 4px 0",
                color: "#111827",
              }}
            >
              New Package Booking Request
            </Heading>
            <Text
              style={{
                margin: "0 0 16px 0",
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              You have received a new booking request from{" "}
              <strong>{customerName}</strong>.
            </Text>

            <Hr
              style={{
                borderColor: "#e5e7eb",
                margin: "16px 0",
              }}
            />

            {/* Package Details */}
            <Heading
              as="h2"
              style={{
                fontSize: "16px",
                margin: "0 0 8px 0",
                color: "#111827",
              }}
            >
              Package Details
            </Heading>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginBottom: "16px",
                fontSize: "14px",
              }}
            >
              <tbody>
                <tr>
                  <td style={{ padding: "4px 0", color: "#6b7280" }}>
                    Package
                  </td>
                  <td style={{ padding: "4px 0", color: "#111827" }}>
                    <strong>{packageTitle || "N/A"}</strong>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "4px 0", color: "#6b7280" }}>
                    Price
                  </td>
                  <td style={{ padding: "4px 0", color: "#111827" }}>
                    {packagePrice
                      ? `$${packagePrice.toLocaleString()}`
                      : "Not specified"}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "4px 0", color: "#6b7280" }}>
                    Travel Date
                  </td>
                  <td style={{ padding: "4px 0", color: "#111827" }}>
                    {travelDate || "N/A"}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "4px 0", color: "#6b7280" }}>
                    Return Date
                  </td>
                  <td style={{ padding: "4px 0", color: "#111827" }}>
                    {returnDate || "N/A"}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "4px 0", color: "#6b7280" }}>
                    Guests
                  </td>
                  <td style={{ padding: "4px 0", color: "#111827" }}>
                    {guests?.adults ?? 0} Adult(s)
                    {typeof guests?.children === "number" &&
                      `, ${guests.children} Child(ren)`}{" "}
                    {totalGuests ? ` • Total: ${totalGuests}` : null}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Customer Details */}
            <Heading
              as="h2"
              style={{
                fontSize: "16px",
                margin: "0 0 8px 0",
                color: "#111827",
              }}
            >
              Customer Details
            </Heading>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginBottom: "16px",
                fontSize: "14px",
              }}
            >
              <tbody>
                <tr>
                  <td style={{ padding: "4px 0", color: "#6b7280" }}>
                    Name
                  </td>
                  <td style={{ padding: "4px 0", color: "#111827" }}>
                    {customerName}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "4px 0", color: "#6b7280" }}>
                    Email
                  </td>
                  <td style={{ padding: "4px 0", color: "#111827" }}>
                    {customerEmail}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "4px 0", color: "#6b7280" }}>
                    Phone
                  </td>
                  <td style={{ padding: "4px 0", color: "#111827" }}>
                    {customerPhone || "N/A"}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Notes */}
            {notes && notes.trim().length > 0 && (
              <>
                <Heading
                  as="h2"
                  style={{
                    fontSize: "16px",
                    margin: "0 0 8px 0",
                    color: "#111827",
                  }}
                >
                  Additional Notes
                </Heading>
                <Text
                  style={{
                    fontSize: "14px",
                    color: "#374151",
                    whiteSpace: "pre-wrap",
                    backgroundColor: "#f9fafb",
                    padding: "10px 12px",
                    borderRadius: "6px",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  {notes}
                </Text>
              </>
            )}

            <Hr
              style={{
                borderColor: "#e5e7eb",
                margin: "20px 0 12px 0",
              }}
            />

            <Text
              style={{
                fontSize: "12px",
                color: "#9ca3af",
              }}
            >
              This email was generated automatically from your website booking
              form.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default PackageBookingEmail;