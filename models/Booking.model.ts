import { Schema, model, models } from 'mongoose';

// ============================================================
// BOOKING SCHEMA
// Represents a complete flight booking lifecycle — from offer
// selection through payment, ticketing, and post-issuance events.
//
// Lifecycle: processing → held → issued → (cancelled/expired)
//            processing → failed (on payment/booking failure)
//
// Dependencies: Duffel API (offer/order), Stripe (payment)
// ============================================================

const BookingSchema = new Schema(
    {
        // ==========================================================
        // SECTION 1: IDENTIFIERS
        // ==========================================================

        /** Internal unique booking reference (e.g., "BK-2024-ABC123"). */
        bookingReference: {
            type: String,
            required: [true, 'Booking reference is required'],
            unique: true,
            index: true,
            trim: true,
        },

        /** Duffel Order ID returned after successful order creation. */
        duffelOrderId: {
            type: String,
            default: null,
            index: true,
            sparse: true,
            unique: true,
        },

        /** Duffel Offer ID used to create this booking. */
        offerId: {
            type: String,
            required: [true, 'Offer ID is required'],
            trim: true,
            // ⚠ Unique partial index defined below in INDEXES section
            // prevents duplicate active bookings for the same offer
        },

        /** Airline PNR / Confirmation Code. */
        pnr: {
            type: String,
            default: null,
            uppercase: true,
            trim: true,
        },

        // ==========================================================
        // SECTION 2: TIME MANAGEMENT
        // ==========================================================

        /** Deadline by which payment must be completed. */
        paymentDeadline: { type: Date, default: null },

        /** Timestamp until which the quoted price remains guaranteed. */
        priceExpiry: { type: Date, default: null },

        // ==========================================================
        // SECTION 3: CONTACT DETAILS
        // ==========================================================
        contact: {
            email: {
                type: String,
                required: [true, 'Contact email is required'],
                lowercase: true,
                trim: true,
                match: [
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    'Please provide a valid email address',
                ],
            },
            /** E.164 format phone number — always starts with "+".
             *  The booking API auto-prepends "+" if the user omits it. */
            phone: {
                type: String,
                required: [true, 'Contact phone number is required'],
                trim: true,
                match: [
                    /^\+[1-9]\d{6,14}$/,
                    'Phone number must be in E.164 format (e.g. +8801XXXXXXXXX)',
                ],
            },
        },

        // ==========================================================
        // SECTION 4: PASSENGERS
        // ==========================================================
        passengers: [
            {
                /** Duffel-assigned passenger ID (e.g., "pas_xxxx"). */
                id: { type: String },

                /** Passenger category — determines pricing tier. */
                type: {
                    type: String,
                    enum: {
                        values: ['adult', 'child', 'infant', 'infant_without_seat'],
                        message: '{VALUE} is not a valid passenger type',
                    },
                },

                title: {
                    type: String,
                    enum: ['mr', 'ms', 'mrs', 'miss', 'dr'],
                },
                firstName: { type: String, trim: true },
                lastName: { type: String, trim: true },
                middleName: { type: String, trim: true, default: null },

                gender: {
                    type: String,
                    enum: ['male', 'female'],
                },

                /** Date of birth — required for all passengers. */
                dob: { type: Date },

                /** Passport / travel document number. */
                passportNumber: { type: String, trim: true, default: null },

                /** Passport expiration date. */
                passportExpiry: { type: Date, default: null },

                /** ISO 3166-1 alpha-2 country code (e.g., "BD"). */
                passportCountry: {
                    type: String,
                    default: 'BD',
                    uppercase: true,
                    minlength: 2,
                    maxlength: 2,
                },
            },
        ],

        // ==========================================================
        // SECTION 5: PRICING
        //
        // Formula: total_amount = base_amount + markup
        // ==========================================================
        pricing: {
            /** ISO 4217 currency code (e.g., "USD"). */
            currency: {
                type: String,
                default: 'USD',
                uppercase: true,
                minlength: 3,
                maxlength: 3,
            },

            /** Total amount charged to the customer (base + markup). */
            total_amount: {
                type: Number,
                required: [true, 'Total amount is required'],
                min: [0, 'Total amount cannot be negative'],
            },

            /** Platform markup / service fee. */
            markup: {
                type: Number,
                default: 0,
                min: [0, 'Markup cannot be negative'],
            },

            /** Airline base fare (Duffel total_amount before markup). */
            base_amount: {
                type: Number,
                default: 0,
                min: [0, 'Base amount cannot be negative'],
            },
        },

        // ==========================================================
        // SECTION 6: PAYMENT INFORMATION
        //
        // ⚠️ cardNumber is stored AES-256-CBC ENCRYPTED, not plain text.
        //    Decryption requires ENCRYPTION_KEY env variable.
        //    Never log or expose the decrypted value.
        // ==========================================================
        paymentInfo: {
            /** Cardholder name exactly as printed on the card. */
            cardName: {
                type: String,
                required: [true, 'Cardholder name is required'],
                trim: true,
            },

            /** AES-256-CBC encrypted card number.
             *  Format: "iv:encryptedData" (hex encoded).
             *  ⚠️ Requires ENCRYPTION_KEY to decrypt. */
            cardNumber: {
                type: String,
                required: [true, 'Encrypted card number is required'],
            },

            /** Card expiration — accepts MM/YY or MM/YYYY.
             *  Booking API validates before save; this regex
             *  matches both formats for flexibility. */
            expiryDate: {
                type: String,
                required: [true, 'Card expiry date is required'],
                match: [
                    /^(0[1-9]|1[0-2])\/(\d{2}|\d{4})$/,
                    'Expiry must be in MM/YY or MM/YYYY format',
                ],
            },

            /** Billing address for AVS fraud checks. */
            billingAddress: {
                street: { type: String, trim: true },
                city: { type: String, trim: true },
                state: { type: String, trim: true },
                zipCode: { type: String, trim: true },
                country: { type: String, trim: true },
            },

            /** 3D Secure session ID for SCA-compliant payments. */
            threeDSecureSessionId: { type: String, default: null },
        },

        // ==========================================================
        // SECTION 7: FLIGHT DETAILS (SNAPSHOT)
        // ==========================================================
        flightDetails: {
            /** Marketing airline name (e.g., "Emirates"). */
            airline: { type: String, trim: true },

            /** Primary flight number (e.g., "EK585"). */
            flightNumber: { type: String, trim: true, uppercase: true },

            /** Human-readable route (e.g., "DAC → DXB → JFK"). */
            route: { type: String, trim: true },

            /** Departure time (UTC) of the first segment. */
            departureDate: { type: Date },

            /** Arrival time (UTC) of the last segment. */
            arrivalDate: { type: Date },

            /** Total journey duration (e.g., "14h 30m"). */
            duration: { type: String },

            /** Airline logo URL. */
            logoUrl: { type: String },

            /** Journey type. */
            flightType: {
                type: String,
                enum: {
                    values: ['one_way', 'round_trip', 'multi_city'],
                    message: '{VALUE} is not a valid flight type',
                },
                required: [true, 'Flight type is required'],
            },

            /** Individual flight segments. */
            segments: [
                {
                    segmentId: String,
                    carrier: String,
                    flightNumber: String,
                    origin: String,
                    destination: String,
                    departureAt: Date,
                    arrivingAt: Date,
                    duration: String,
                    cabin: String,
                },
            ],
        },

        // ==========================================================
        // SECTION 8: TICKETING DOCUMENTS
        // ==========================================================
        documents: [
            {
                unique_identifier: { type: String },
                docType: { type: String },
                url: { type: String },
            },
        ],

        // ==========================================================
        // SECTION 9: AIRLINE-INITIATED CHANGES
        // ==========================================================
        airlineInitiatedChanges: {
            type: Schema.Types.Mixed,
            default: null,
        },

        // ==========================================================
        // SECTION 10: BOOKING STATUS & LIFECYCLE
        //
        //   processing ──→ held ──→ issued
        //       │            │         │
        //       ▼            ▼         ▼
        //     failed      expired   cancelled
        // ==========================================================
        status: {
            type: String,
            enum: {
                values: ['held', 'processing', 'issued', 'cancelled', 'failed', 'expired'],
                message: '{VALUE} is not a valid booking status',
            },
            default: 'processing',
            index: true,
        },

        // ==========================================================
        // SECTION 11: PAYMENT STATUS & TRACKING
        //
        // Flow: pending → requires_action → authorized → captured
        //       pending → failed
        //       captured → refunded
        // ==========================================================
        paymentStatus: {
            type: String,
            enum: {
                values: [
                    'pending',
                    'requires_action',
                    'authorized',
                    'captured',
                    'failed',
                    'refunded',
                ],
                message: '{VALUE} is not a valid payment status',
            },
            default: 'pending',
            index: true,
        },

        /** Stripe PaymentIntent ID (e.g., "pi_xxxxxxxx"). */
        stripePaymentIntentId: {
            type: String,
            default: null,
            sparse: true,
            index: true,
        },

        /** Legacy/internal payment ID. */
        payment_id: {
            type: String,
            default: null,
        },

        /** Payment method chosen by customer. */
        clientPayWith: {
            type: String,
            enum: ['balance', 'stripe'],
            default: 'balance',
        },

        // ==========================================================
        // SECTION 12: RETRY MECHANISM
        // ==========================================================

        retryCount: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },

        lastRetryAt: {
            type: Date,
            default: null,
        },

        // ==========================================================
        // SECTION 13: NOTIFICATIONS
        // ==========================================================

        /** Whether the e-ticket email has been sent. */
        emailSent: {
            type: Boolean,
            default: false,
        },

        /** Whether the booking confirmation email has been sent. */
        confirmationEmailSent: {
            type: Boolean,
            default: false,
        },

        // ==========================================================
        // SECTION 14: OPERATIONAL CONTROL & AUDIT
        // ==========================================================

        /** Environment flag — test vs production. */
        isLiveMode: {
            type: Boolean,
            default: false,
            index: true,
        },

        /** Internal admin/support notes. */
        adminNotes: [
            {
                note: { type: String, trim: true },
                addedBy: { type: String, default: 'system' },
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

// ============================================================
// INDEXES
// ============================================================

// 🔴 CRITICAL: Atomic duplicate booking guard
// Prevents two concurrent requests from booking the same offer.
// The booking route catches E11000 on create() to reject duplicates.
// Only active bookings (processing/held/issued) are constrained —
// failed/expired/cancelled bookings for the same offer are allowed.
BookingSchema.index(
    { offerId: 1 },
    {
        unique: true,
        partialFilterExpression: {
            status: { $in: ['processing', 'held', 'issued'] },
        },
    },
);

// Admin dashboard: filter by status + environment + date
BookingSchema.index({ status: 1, isLiveMode: 1, createdAt: -1 });

// Payment reconciliation: find unpaid bookings nearing deadline
BookingSchema.index({ paymentStatus: 1, paymentDeadline: 1 });

// Customer lookup: find all bookings by email
BookingSchema.index({ 'contact.email': 1, createdAt: -1 });

// Expiry cron job: find held bookings past their deadline
BookingSchema.index({ status: 1, paymentDeadline: 1 });

// ============================================================
// VIRTUALS
// ============================================================

BookingSchema.virtual('isPaymentWindowOpen').get(function () {
    if (!this.paymentDeadline) return false;
    return new Date() < this.paymentDeadline;
});

BookingSchema.virtual('isPriceValid').get(function () {
    if (!this.priceExpiry) return false;
    return new Date() < this.priceExpiry;
});

BookingSchema.virtual('canRetry').get(function () {
    return this.retryCount < 5;
});

// ============================================================
// STATIC METHODS
// ============================================================

BookingSchema.statics.findExpiredHolds = function () {
    return this.find({
        status: 'held',
        paymentDeadline: { $lt: new Date() },
    });
};

BookingSchema.statics.findPendingPayments = function () {
    return this.find({
        paymentStatus: { $in: ['pending', 'requires_action', 'authorized'] },
        status: { $nin: ['cancelled', 'expired', 'failed'] },
    });
};

const Booking = models.Booking || model('Booking', BookingSchema);
export default Booking;