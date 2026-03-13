'use client';

import { useState } from 'react';
import axios from 'axios';
import {
  Mail,
  Send,
  Phone,
  Loader2,
  Sparkles,
  Shield,
  MessageSquare,
  AtSign,
  FileText,
  AlignLeft,
  CheckCircle2,
  Zap,
  Headphones,
  Info,
  CreditCard,
  Ticket,
  Plane,
  PhoneCall,
  AlertCircle,
  Clock,
  Receipt,
  UserCheck,
  RefreshCcw,
  Ban,
  Star,
  Search,
  X,
  ChevronDown,
  Copy,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { websiteDetails } from '@/constant/data';

// ─── Template Data ───
const EMAIL_TEMPLATES = [
  {
    title: 'Booking Confirmed',
    icon: CheckCircle2,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    ring: 'ring-emerald-200',
    subject: 'Your Booking is Confirmed ✅',
    category: 'booking',
    body: `Dear Valued Customer,

We are pleased to inform you that your booking has been confirmed successfully.

Booking Details:
- Booking Reference: [REF_NUMBER]
- Date: [DATE]
- Status: Confirmed

Please keep this email for your records. If you have any questions, feel free to reach out.

Thank you for choosing our service.

Best regards,
Support Team`,
  },
  {
    title: 'Ticket Issued',
    icon: Ticket,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    ring: 'ring-blue-200',
    subject: 'Your E-Ticket Has Been Issued 🎫',
    category: 'ticket',
    body: `Dear Customer,

Great news! Your e-ticket has been issued successfully.

Ticket Details:
- Ticket Number: [TICKET_NUMBER]
- PNR: [PNR_CODE]
- Passenger Name: [PASSENGER_NAME]
- Route: [ORIGIN] → [DESTINATION]
- Travel Date: [DATE]

Please download your ticket from the attachment or your account dashboard.

Important: Please arrive at the airport at least 3 hours before departure for international flights.

Best regards,
Support Team`,
  },
  {
    title: 'Payment Received',
    icon: CreditCard,
    color: 'text-violet-500',
    bg: 'bg-violet-50',
    ring: 'ring-violet-200',
    subject: 'Payment Received Successfully 💳',
    category: 'payment',
    body: `Dear Customer,

We have successfully received your payment. Here are the details:

Payment Details:
- Amount: [AMOUNT]
- Transaction ID: [TXN_ID]
- Payment Method: [METHOD]
- Date: [DATE]

Your booking is now being processed. You will receive a confirmation shortly.

Thank you for your payment.

Best regards,
Finance Team`,
  },
  {
    title: 'Payment Reminder',
    icon: AlertCircle,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    ring: 'ring-amber-200',
    subject: 'Payment Reminder - Action Required ⚠️',
    category: 'payment',
    body: `Dear Customer,

This is a friendly reminder that your payment is still pending.

Booking Details:
- Booking Reference: [REF_NUMBER]
- Amount Due: [AMOUNT]
- Due Date: [DATE]

Please complete the payment at your earliest convenience to avoid cancellation.

If you have already made the payment, please disregard this message.

Best regards,
Support Team`,
  },
  {
    title: 'Flight Information',
    icon: Plane,
    color: 'text-sky-500',
    bg: 'bg-sky-50',
    ring: 'ring-sky-200',
    subject: 'Your Flight Information & Details ✈️',
    category: 'flight',
    body: `Dear Customer,

Here are your flight details:

Flight Information:
- Flight: [AIRLINE] [FLIGHT_NUMBER]
- Route: [ORIGIN] → [DESTINATION]
- Departure: [DATE] at [TIME]
- Arrival: [ARRIVAL_TIME]
- Terminal: [TERMINAL]
- Seat: [SEAT_NUMBER]
- Baggage: [BAGGAGE_INFO]

Important Reminders:
✅ Carry a valid photo ID / Passport
✅ Check-in opens 24 hours before departure
✅ Arrive at least 3 hours early for international flights

Have a safe journey!

Best regards,
Support Team`,
  },
  {
    title: 'Follow-up',
    icon: PhoneCall,
    color: 'text-teal-500',
    bg: 'bg-teal-50',
    ring: 'ring-teal-200',
    subject: 'Following Up on Your Recent Inquiry 📞',
    category: 'general',
    body: `Dear Customer,

Thank you for reaching out to us. We wanted to follow up on your recent inquiry.

We value your time and want to ensure all your questions are answered. Please let us know if you need any further assistance.

You can reach us via:
📞 Phone: [PHONE_NUMBER]
📧 Email: [EMAIL]
💬 WhatsApp: [WHATSAPP]

Our team is available 24/7 to help you.

Best regards,
Support Team`,
  },
  {
    title: 'Refund Processed',
    icon: RefreshCcw,
    color: 'text-green-500',
    bg: 'bg-green-50',
    ring: 'ring-green-200',
    subject: 'Your Refund Has Been Processed 💰',
    category: 'payment',
    body: `Dear Customer,

We are writing to confirm that your refund has been processed successfully.

Refund Details:
- Refund Amount: [AMOUNT]
- Original Booking: [REF_NUMBER]
- Refund Method: [METHOD]
- Expected Credit: 5-10 business days

Please note that the refund may take up to 10 business days to reflect in your account depending on your bank.

If you don't see the refund after 10 business days, please contact us.

Best regards,
Finance Team`,
  },
  {
    title: 'Booking Cancelled',
    icon: Ban,
    color: 'text-red-500',
    bg: 'bg-red-50',
    ring: 'ring-red-200',
    subject: 'Booking Cancellation Confirmation ❌',
    category: 'booking',
    body: `Dear Customer,

As per your request, your booking has been cancelled.

Cancellation Details:
- Booking Reference: [REF_NUMBER]
- Cancellation Date: [DATE]
- Refund Status: [REFUND_STATUS]

If a refund is applicable, it will be processed within 5-10 business days.

If this cancellation was made in error, please contact us immediately.

Best regards,
Support Team`,
  },
  {
    title: 'Invoice / Receipt',
    icon: Receipt,
    color: 'text-orange-500',
    bg: 'bg-orange-50',
    ring: 'ring-orange-200',
    subject: 'Your Invoice / Payment Receipt 🧾',
    category: 'payment',
    body: `Dear Customer,

Please find your invoice details below:

Invoice Details:
- Invoice Number: [INVOICE_NUMBER]
- Amount: [AMOUNT]
- Date: [DATE]
- Service: [SERVICE_DESCRIPTION]
- Payment Status: Paid ✅

For your records, a PDF copy is attached to this email.

Thank you for your business.

Best regards,
Finance Team`,
  },
  {
    title: 'Welcome',
    icon: UserCheck,
    color: 'text-indigo-500',
    bg: 'bg-indigo-50',
    ring: 'ring-indigo-200',
    subject: 'Welcome Aboard! 🎉',
    category: 'general',
    body: `Dear [CUSTOMER_NAME],

Welcome! We're thrilled to have you with us.

Your account has been created successfully. Here's how to get started:

1️⃣ Log in to your dashboard
2️⃣ Complete your profile
3️⃣ Explore our services

If you need any help, our support team is just a message away.

We look forward to serving you!

Warm regards,
The Team`,
  },
  {
    title: 'Feedback',
    icon: Star,
    color: 'text-yellow-500',
    bg: 'bg-yellow-50',
    ring: 'ring-yellow-200',
    subject: 'We Value Your Feedback ⭐',
    category: 'general',
    body: `Dear Customer,

We hope you had a great experience with our service. Your feedback means a lot to us!

Could you spare a moment to share your thoughts?

⭐ How was your overall experience?
⭐ Was our team helpful?
⭐ Any suggestions for improvement?

Simply reply to this email with your feedback, or click the link below:
[FEEDBACK_LINK]

Thank you for helping us improve!

Best regards,
Customer Experience Team`,
  },
  {
    title: 'Schedule Change',
    icon: Clock,
    color: 'text-pink-500',
    bg: 'bg-pink-50',
    ring: 'ring-pink-200',
    subject: 'Important: Flight Schedule Change ⏰',
    category: 'flight',
    body: `Dear Customer,

We regret to inform you that there has been a schedule change for your upcoming flight.

Updated Details:
- Flight: [AIRLINE] [FLIGHT_NUMBER]
- Original Departure: [OLD_TIME]
- New Departure: [NEW_TIME]
- Route: [ORIGIN] → [DESTINATION]

Please review the updated schedule. If this doesn't work for you, please contact us for alternatives.

We apologize for any inconvenience.

Best regards,
Support Team`,
  },
];

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'booking', label: 'Booking' },
  { key: 'payment', label: 'Payment' },
  { key: 'flight', label: 'Flight' },
  { key: 'ticket', label: 'Ticket' },
  { key: 'general', label: 'General' },
];

export default function SupportPage() {
  const [loading, setLoading] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showTemplates, setShowTemplates] = useState(true);

  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    message: '',
  });

  // ─── Filter templates ───
  const filteredTemplates = EMAIL_TEMPLATES.filter((t) => {
    const matchesCategory =
      activeCategory === 'all' || t.category === activeCategory;
    const matchesSearch =
      !templateSearch ||
      t.title.toLowerCase().includes(templateSearch.toLowerCase()) ||
      t.subject.toLowerCase().includes(templateSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // ─── Send email ───
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post('/api/dashboard/support', formData);
      if (data.success) {
        toast.success('Email sent successfully!');
        setFormData({ to: '', subject: '', message: '' });
      }
    } catch {
      toast.error('Failed to send email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Apply template ───
  const applyTemplate = (template: (typeof EMAIL_TEMPLATES)[0]) => {
    setFormData((prev) => ({
      ...prev,
      subject: template.subject,
      message: template.body,
    }));
    toast.success(`"${template.title}" template applied`);
  };

  // ─── Clear form ───
  const clearForm = () => {
    setFormData({ to: '', subject: '', message: '' });
    toast.success('Form cleared');
  };

  // ─── Copy to clipboard ───
  const copyMessage = () => {
    if (formData.message) {
      navigator.clipboard.writeText(formData.message);
      toast.success('Message copied to clipboard');
    }
  };

  const hasContent = formData.to || formData.subject || formData.message;

  // ─── Reusable classes ───
  const inputBase =
    'w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50/50 text-[13px] placeholder:text-gray-300 focus:bg-white focus:border-gray-300 focus:ring-2 focus:ring-gray-900/5 transition-all outline-none';
  const inputWithIcon = cn(inputBase, 'pl-10');

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {/* ═══════════════════ HEADER ═══════════════════ */}
        <header className="pt-8 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-2xl shadow-gray-100">
                  <Headphones className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                  Support Center
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-[26px]">
                Email Support
              </h1>
              <p className="text-[13px] text-gray-500">
                Compose and send emails to your customers with ready-made
                templates.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Quick contacts */}
              <a
                href={`tel:${websiteDetails.whatsappNumber}`}
                className="hidden md:inline-flex h-9 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 text-[12px] font-semibold text-gray-500 shadow-2xl shadow-gray-100 transition-all hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300"
              >
                <Phone className="h-3.5 w-3.5 text-gray-400" />
                <span className="hidden lg:inline">
                  {websiteDetails.whatsappNumber}
                </span>
                <span className="lg:hidden">Call</span>
              </a>
              <a
                href={`mailto:${websiteDetails.email || 'support@example.com'}`}
                className="hidden md:inline-flex h-9 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 text-[12px] font-semibold text-gray-500 shadow-2xl shadow-gray-100 transition-all hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300"
              >
                <Mail className="h-3.5 w-3.5 text-gray-400" />
                <span className="hidden lg:inline">
                  {websiteDetails.email || 'support@example.com'}
                </span>
                <span className="lg:hidden">Email</span>
              </a>
              {/* Status badge */}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600 ring-1 ring-emerald-200">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                ONLINE
              </span>
            </div>
          </div>
        </header>

        <div className="space-y-6">
          {/* ═══════════════════ QUICK STATS ═══════════════════ */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                icon: Mail,
                label: 'Compose',
                value: 'New Email',
                color: 'bg-blue-600',
              },
              {
                icon: Zap,
                label: 'Templates',
                value: `${EMAIL_TEMPLATES.length} Ready`,
                color: 'bg-amber-500',
              },
              {
                icon: Shield,
                label: 'Security',
                value: 'Encrypted',
                color: 'bg-emerald-600',
              },
              {
                icon: Headphones,
                label: 'Support',
                value: '24/7 Live',
                color: 'bg-violet-600',
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-2xl shadow-gray-100 transition-all hover:shadow-md"
              >
                <div className="flex items-center gap-3 p-4">
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-lg',
                      stat.color
                    )}
                  >
                    <stat.icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      {stat.label}
                    </p>
                    <p className="text-[13px] font-bold text-gray-900 truncate">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ═══════════════════ EMAIL COMPOSE ═══════════════════ */}
          <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-2xl shadow-gray-100">
            <div className="flex items-center justify-between border-b border-gray-50 bg-gray-50/40 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900 shadow-2xl shadow-gray-100">
                  <Mail className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-gray-900">
                    Compose Email
                  </h2>
                  <p className="text-[11px] text-gray-400">
                    Send personalized emails to your customers
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {hasContent && (
                  <button
                    type="button"
                    onClick={clearForm}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200/70 bg-gray-50/30 px-2.5 py-1.5 text-[10px] font-bold text-gray-500 transition-all hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Clear
                  </button>
                )}
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600 ring-1 ring-emerald-200">
                  <Shield className="h-3 w-3" />
                  Encrypted
                </span>
              </div>
            </div>

            <div className="p-6">
              <form onSubmit={handleSendEmail} className="space-y-5">
                {/* To + Subject */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {/* Recipient */}
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-semibold text-gray-700">
                      Recipient Email <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                      <input
                        placeholder="customer@example.com"
                        type="email"
                        required
                        className={inputWithIcon}
                        value={formData.to}
                        onChange={(e) =>
                          setFormData({ ...formData, to: e.target.value })
                        }
                      />
                      {formData.to && formData.to.includes('@') && (
                        <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" />
                      )}
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-semibold text-gray-700">
                      Subject Line <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                      <input
                        placeholder="Regarding your booking..."
                        required
                        className={inputWithIcon}
                        value={formData.subject}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            subject: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[13px] font-semibold text-gray-700">
                      Message Body <span className="text-rose-400">*</span>
                    </label>
                    {formData.message && (
                      <button
                        type="button"
                        onClick={copyMessage}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all cursor-pointer"
                      >
                        <Copy className="h-3 w-3" />
                        Copy
                      </button>
                    )}
                  </div>
                  <textarea
                    placeholder="Write your message here... Use templates below for quick start."
                    required
                    className="w-full min-h-[260px] rounded-xl border border-gray-200 bg-gray-50/50 p-4 text-[13px] leading-relaxed placeholder:text-gray-300 focus:bg-white focus:border-gray-300 focus:ring-2 focus:ring-gray-900/5 transition-all outline-none resize-none"
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        message: e.target.value,
                      })
                    }
                  />
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-1.5 text-[10px] text-gray-400">
                      <Info className="h-3 w-3" />
                      Replace{' '}
                      <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-gray-500">
                        [PLACEHOLDERS]
                      </code>{' '}
                      with actual data before sending
                    </p>
                    {formData.message.length > 0 && (
                      <span className="text-[10px] font-bold text-gray-400 tabular-nums">
                        {formData.message.length} chars
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-5">
                  <p className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    All emails are logged & encrypted
                  </p>
                  <div className="flex items-center gap-2.5">
                    {hasContent && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={clearForm}
                        className="h-10 cursor-pointer rounded-xl border-gray-200 px-5 text-[13px] font-semibold text-gray-500 shadow-2xl shadow-gray-100 transition-all hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300"
                      >
                        <X className="h-3.5 w-3.5 mr-1.5" />
                        Discard
                      </Button>
                    )}
                    <Button
                      type="submit"
                      disabled={loading}
                      className="h-10 cursor-pointer rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 px-6 text-[13px] font-bold text-white shadow-2xl shadow-gray-100 transition-all hover:from-gray-900 hover:to-gray-950 hover:shadow-md active:scale-[0.98] disabled:opacity-60"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Send className="h-3.5 w-3.5" />
                          Send Email
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* ═══════════════════ TEMPLATES ═══════════════════ */}
          <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-2xl shadow-gray-100">
            {/* Header */}
            <div className="border-b border-gray-50 bg-gray-50/40 px-6 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 shadow-2xl shadow-gray-100">
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[15px] font-bold text-gray-900">
                        Quick Templates
                      </h3>
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600 tabular-nums ring-1 ring-amber-200">
                        {filteredTemplates.length}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Click any template to auto-fill the compose form
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300" />
                    <input
                      type="text"
                      placeholder="Search templates..."
                      value={templateSearch}
                      onChange={(e) => setTemplateSearch(e.target.value)}
                      className="h-9 w-40 rounded-xl border border-gray-200 bg-gray-50/50 pl-9 pr-3 text-[12px] placeholder:text-gray-300 focus:bg-white focus:border-gray-300 focus:ring-2 focus:ring-gray-900/5 transition-all outline-none"
                    />
                    {templateSearch && (
                      <button
                        type="button"
                        onClick={() => setTemplateSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  {/* Collapse toggle */}
                  <button
                    type="button"
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 transition-all hover:bg-gray-50 hover:text-gray-600 cursor-pointer"
                  >
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform duration-300',
                        !showTemplates && '-rotate-90'
                      )}
                    />
                  </button>
                </div>
              </div>

              {/* Category Tabs */}
              {showTemplates && (
                <div className="flex items-center gap-1.5 mt-4 overflow-x-auto pb-0.5 scrollbar-none">
                  {CATEGORIES.map((cat) => {
                    const count =
                      cat.key === 'all'
                        ? EMAIL_TEMPLATES.length
                        : EMAIL_TEMPLATES.filter(
                            (t) => t.category === cat.key
                          ).length;

                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setActiveCategory(cat.key)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap',
                          activeCategory === cat.key
                            ? 'bg-gray-900 text-white shadow-sm'
                            : 'bg-white text-gray-500 border border-gray-200/70 hover:bg-gray-50 hover:text-gray-700'
                        )}
                      >
                        {cat.label}
                        <span
                          className={cn(
                            'rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums',
                            activeCategory === cat.key
                              ? 'bg-white/20 text-white'
                              : 'bg-gray-100 text-gray-400'
                          )}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Templates Grid */}
            {showTemplates && (
              <div className="p-6">
                {filteredTemplates.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {filteredTemplates.map((template, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => applyTemplate(template)}
                        className="group relative flex flex-col gap-3 rounded-xl border border-gray-200/70 bg-gray-50/30 p-4 text-left transition-all hover:border-gray-200 hover:bg-white hover:shadow-sm active:scale-[0.98] cursor-pointer overflow-hidden"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 transition-transform duration-300 group-hover:scale-110',
                              template.bg,
                              template.ring
                            )}
                          >
                            <template.icon
                              className={cn('h-4 w-4', template.color)}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-bold text-gray-700 group-hover:text-gray-900 truncate transition-colors">
                              {template.title}
                            </p>
                            <p className="text-[10px] text-gray-400 truncate mt-0.5 leading-relaxed">
                              {template.subject
                                .replace(
                                  /[✅🎫💳⚠️✈️📞💰❌🧾🎉⭐⏰]/g,
                                  ''
                                )
                                .trim()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1',
                              template.bg,
                              template.color,
                              template.ring
                            )}
                          >
                            {template.category}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-300 group-hover:text-gray-500 transition-colors">
                            <Sparkles className="h-3 w-3" />
                            Apply
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2.5 rounded-xl border-2 border-dashed border-gray-200/70 py-12 text-center">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-50">
                      <Search className="h-5 w-5 text-gray-300" />
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-gray-400">
                        No templates found
                      </p>
                      <p className="text-[10px] text-gray-300">
                        Try a different search or category
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setTemplateSearch('');
                        setActiveCategory('all');
                      }}
                      className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-[11px] font-bold text-gray-500 transition-all hover:bg-gray-50 hover:text-gray-700 cursor-pointer"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reset Filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ═══════════════════ ADMIN TIP ═══════════════════ */}
          <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-2xl shadow-gray-100">
            <div className="flex items-start gap-4 p-6">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 shadow-sm">
                <MessageSquare className="h-4 w-4 text-gray-500" />
              </div>
              <div className="space-y-1">
                <h4 className="text-[13px] font-bold text-gray-900">
                  Admin Tip
                </h4>
                <p className="text-[12px] leading-relaxed text-gray-500">
                  Replace placeholders like{' '}
                  <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-gray-600">
                    [REF_NUMBER]
                  </code>
                  ,{' '}
                  <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-gray-600">
                    [AMOUNT]
                  </code>
                  ,{' '}
                  <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-gray-600">
                    [DATE]
                  </code>{' '}
                  with actual booking data before sending. All emails are
                  automatically logged for your records.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}