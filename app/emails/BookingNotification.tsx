import {
  Body,
  Button,
  Container,
  Column,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

interface BookingEmailProps {
  packageTitle: string;
  packagePrice: string | number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  travelDate: string;
  returnDate: string;
  guests: {
    adults: number;
    children: number;
  };
  notes?: string;
}

export default function BookingNotification({
  packageTitle = "Premium Umrah Package 2026",
  packagePrice = "150,000 BDT",
  customerName = "Rahim Uddin",
  customerEmail = "rahim@example.com",
  customerPhone = "01712345678",
  travelDate = "2026-03-10",
  returnDate = "2026-03-25",
  guests = { adults: 2, children: 1 },
  notes = "Need wheelchair assistance for one adult.",
}: BookingEmailProps) {
  return (
    <Html>
      <Tailwind>
        <Head />
        <Preview>New Booking Request: {packageTitle}</Preview>
        <Body className="bg-white my-auto mx-auto font-sans px-2 py-10">
          <Container className="border border-solid border-[#eaeaea] rounded-[24px] mx-auto p-[40px] max-w-[465px] bg-white shadow-sm">
            
            {/* 1. Header Icon */}
            <Section className="text-center mb-6">
               <div style={{ 
                   display: 'inline-flex', 
                   alignItems: 'center', 
                   justifyContent: 'center', 
                   width: '40px', 
                   height: '40px', 
                   backgroundColor: '#000', 
                   borderRadius: '50%' 
               }}>
                  <Img 
                    src="https://img.icons8.com/ios-filled/50/ffffff/airplane-mode-on.png"
                    width="24"
                    height="24"
                    alt="Logo"
                    style={{ transform: "rotate(-45deg)" }} 
                  />
               </div>
            </Section>

            {/* 2. Title & Status */}
            <Heading className="text-black text-[24px] font-bold text-center p-0 m-0 tracking-tight">
              Booking Request
            </Heading>
            <Section className="text-center mt-4 mb-8">
               <span className="bg-amber-100 text-amber-800 text-[12px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                  Pending Review
               </span>
            </Section>

            {/* 3. Package Summary Card */}
            <Section className="bg-[#fafafa] border border-solid border-[#eaeaea] rounded-[16px] p-6 mb-8">
                <Text className="text-[#666] text-[11px] font-bold uppercase tracking-widest mb-4 mt-0">
                    Package Details
                </Text>
                
                <Row className="mb-2">
                    <Column className="text-[14px] text-slate-900 font-bold">{packageTitle}</Column>
                </Row>
                <Row>
                    <Column className="text-[13px] text-slate-500 font-medium">Estimated Price</Column>
                    <Column className="text-[16px] text-emerald-600 font-bold text-right">${packagePrice}</Column>
                </Row>
            </Section>

            {/* 4. Customer & Trip Info */}
            <Section className="mb-8">
               <Text className="text-[#666] text-[11px] font-bold uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">
                    Traveller Information
                </Text>

               <Row className="mb-3">
                 <Column className="text-[13px] text-gray-500 w-[100px]">Name</Column>
                 <Column className="text-[13px] text-gray-900 font-semibold text-right">{customerName}</Column>
               </Row>
               <Row className="mb-3">
                 <Column className="text-[13px] text-gray-500">Phone</Column>
                 <Column className="text-[13px] text-gray-900 font-semibold text-right">{customerPhone}</Column>
               </Row>
               <Row className="mb-3">
                 <Column className="text-[13px] text-gray-500">Email</Column>
                 <Column className="text-[13px] text-blue-600 font-semibold text-right no-underline">{customerEmail}</Column>
               </Row>
               
               <Hr className="border-gray-100 my-4"/>

               <Row className="mb-3">
                 <Column className="text-[13px] text-gray-500">Travel Date</Column>
                 <Column className="text-[13px] text-gray-900 font-semibold text-right">{travelDate}</Column>
               </Row>
               <Row className="mb-3">
                 <Column className="text-[13px] text-gray-500">Return Date</Column>
                 <Column className="text-[13px] text-gray-900 font-semibold text-right">{returnDate}</Column>
               </Row>
               <Row className="mb-3">
                 <Column className="text-[13px] text-gray-500">Guests</Column>
                 <Column className="text-[13px] text-gray-900 font-semibold text-right">
                    {guests.adults} Adults, {guests.children} Kids
                 </Column>
               </Row>
            </Section>

            {/* 5. Notes Section (Optional) */}
            {notes && (
                <Section className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-8">
                    <Text className="text-yellow-800 text-[12px] font-bold uppercase m-0 mb-1">
                        Special Notes:
                    </Text>
                    <Text className="text-gray-800 text-[14px] m-0 leading-relaxed">
                        "{notes}"
                    </Text>
                </Section>
            )}

            {/* 6. CTA Button */}
            <Section className="text-center">
              <Button
                href={`mailto:${customerEmail}`}
                style={{
                    backgroundColor: "#000",
                    color: "#fff",
                    borderRadius: "50px",
                    fontSize: "14px",
                    fontWeight: "600",
                    textDecoration: "none",
                    textAlign: "center",
                    display: "inline-block",
                    width: "100%",
                    padding: "14px 0px",
                }}
              >
                Reply to Customer
              </Button>
            </Section>

            <Text className="text-[#999] text-[11px] text-center mt-8 leading-[18px]">
              This is an automated notification from Fly Bismillah Booking System.
              <br />
              © 2026 Fly Bismillah Inc.
            </Text>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}