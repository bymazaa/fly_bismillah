'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';

import { contactPageData } from '@/constant/data';
import { appTheme } from '@/constant/theme/global';
import { Button } from '@/components/ui/button';

import {
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaPaperPlane,
  FaArrowRight,
} from 'react-icons/fa';
import { HiOutlineSparkles } from 'react-icons/hi2';
import { contactFormSchema, ContactFormValues } from '@/validation/zod';
import { toast } from 'sonner';

const ContactPage = () => {
  const { colors, layout, typography, button } = appTheme;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
  });

  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await axios.post('/api/general/contact', {
        name: data.name,
        email: data.email,
        phone: data.phone,
        subject: data.subject,
        message: data.message,
      });

      if (response.data.success) {
        toast.success('Message sent successfully! 🚀');
        reset();
      } else {
        toast.error(
          response.data.message || 'Failed to send message. Please try again.'
        );
      }
    } catch (error: any) {
      console.error('Contact Form Error:', error);
      const errorMessage =
        error.response?.data?.message ||
        'Something went wrong. Please try again later.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIcon = (icon: string) => {
    switch (icon) {
      case 'map':
        return <FaMapMarkerAlt />;
      case 'phone':
        return <FaPhoneAlt />;
      default:
        return <FaEnvelope />;
    }
  };

  const inputBase =
    'w-full px-4 py-3.5 rounded-xl border bg-white text-gray-900 placeholder:text-gray-400 transition-all duration-300 outline-none text-[15px]';
  const inputNormal =
    'border-gray-200 hover:border-gray-300 focus:border-gray-900 focus:ring-[3px] focus:ring-gray-900/5';
  const inputError =
    'border-red-400 focus:border-red-500 focus:ring-[3px] focus:ring-red-500/10';

  return (
    <main className="min-h-screen bg-white">
      {/* ═══════════ Hero Section ═══════════ */}
      <section className="relative overflow-hidden bg-gray-950 text-white">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />

        <div className={`${layout.container} relative z-10 py-20 lg:py-28`}>
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 mb-6">
              <HiOutlineSparkles className="text-rose-400 text-sm" />
              <span className="text-[13px] font-medium text-gray-300 tracking-wide">
                Get in Touch
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-5">
              {contactPageData.header.title}
            </h1>

            <p className="text-gray-400 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
              {contactPageData.header.subtitle}
            </p>

            {/* Quick stats */}
            <div className="flex items-center justify-center gap-8 mt-10 pt-10 border-t border-white/10">
              {[
                { label: 'Response Time', value: '< 2 hrs' },
                { label: 'Locations', value: '2+' },
                { label: 'Support', value: '24/7' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ Main Content ═══════════ */}
      <section className={`${layout.container} py-16 lg:py-24`}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">
          {/* ═══════════ Left Column: Info (2/5) ═══════════ */}
          <div className="lg:col-span-2 space-y-10">
            {/* Locations */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
                  <FaMapMarkerAlt className="text-white text-xs" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  Our Locations
                </h3>
              </div>

              <div className="space-y-3">
                {contactPageData.info.locations.map((loc) => (
                  <div
                    key={loc.id}
                    className="group relative p-5 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                        <FaMapMarkerAlt className="text-white text-sm" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 mb-1">
                          {loc.city}
                        </h4>
                        <p className="text-sm text-gray-500 leading-relaxed">
                          {loc.address}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Methods */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
                  <FaPhoneAlt className="text-white text-xs" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  Contact Info
                </h3>
              </div>

              <div className="space-y-3">
                {contactPageData.info.contacts.map((contact) => (
                  <a
                    key={contact.id}
                    href={contact.link}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center gap-4 p-5 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 group-hover:from-rose-600 group-hover:to-rose-500 flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-105">
                      <span className="text-white text-sm">
                        {getIcon(contact.icon)}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                        {contact.label}
                      </p>
                      <p className="text-[15px] font-bold text-gray-900 group-hover:text-rose-600 transition-colors truncate">
                        {contact.value}
                      </p>
                    </div>

                    <FaArrowRight className="text-gray-300 text-xs group-hover:text-rose-500 group-hover:translate-x-1 transition-all duration-300" />
                  </a>
                ))}
              </div>
            </div>

           

          </div>

          {/* ═══════════ Right Column: Form (3/5) ═══════════ */}
          <div className="lg:col-span-3">
            <div className="sticky top-8">
              <div className="p-8 md:p-10 rounded-3xl border border-gray-200 bg-white shadow-xl shadow-gray-100/30">
                {/* Form Header */}
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Send us a Message
                  </h3>
                  <p className="text-sm text-gray-500">
                    Fill out the form and we'll get back to you within 2 hours.
                  </p>
                </div>

                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-5"
                >
                  {/* Name & Phone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[13px] font-semibold text-gray-700 flex items-center gap-1">
                        Full Name
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        {...register('name')}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                        className={`${inputBase} capitalize ${
                          errors.name ? inputError : inputNormal
                        }`}
                        placeholder="John Doe"
                      />
                      {errors.name && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <span>⚠</span> {errors.name.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[13px] font-semibold text-gray-700 flex items-center gap-1">
                        Phone Number
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        {...register('phone')}
                        onFocus={() => setFocusedField('phone')}
                        onBlur={() => setFocusedField(null)}
                        className={`${inputBase} ${
                          errors.phone ? inputError : inputNormal
                        }`}
                        placeholder="+1 213..."
                      />
                      {errors.phone && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <span>⚠</span> {errors.phone.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-[13px] font-semibold text-gray-700 flex items-center gap-1">
                      Email Address
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      {...register('email')}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      className={`${inputBase} lowercase ${
                        errors.email ? inputError : inputNormal
                      }`}
                      placeholder="you@example.com"
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <span>⚠</span> {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Subject */}
                  <div className="space-y-2">
                    <label className="text-[13px] font-semibold text-gray-700 flex items-center gap-1">
                      Subject
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      {...register('subject')}
                      onFocus={() => setFocusedField('subject')}
                      onBlur={() => setFocusedField(null)}
                      className={`${inputBase} capitalize ${
                        errors.subject ? inputError : inputNormal
                      }`}
                      placeholder="Package Inquiry"
                    />
                    {errors.subject && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <span>⚠</span> {errors.subject.message}
                      </p>
                    )}
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <label className="text-[13px] font-semibold text-gray-700 flex items-center gap-1">
                      Message
                      <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      {...register('message')}
                      rows={5}
                      onFocus={() => setFocusedField('message')}
                      onBlur={() => setFocusedField(null)}
                      className={`${inputBase} resize-none ${
                        errors.message ? inputError : inputNormal
                      }`}
                      placeholder="Tell us about your travel plans..."
                    />
                    {errors.message && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <span>⚠</span> {errors.message.message}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full h-13 cursor-pointer text-[15px] font-semibold rounded-xl ${button.primary} transition-all duration-300 ${
                      isSubmitting ? 'opacity-70' : 'hover:shadow-lg hover:shadow-rose-500/20 hover:-translate-y-0.5'
                    }`}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="animate-spin h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Send Message
                        <FaPaperPlane className="text-sm" />
                      </span>
                    )}
                  </Button>

                  {/* Form footer note */}
                  <p className="text-center text-xs text-gray-400 pt-2">
                    🔒 Your information is secure and will never be shared.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ContactPage;