import { Schema, model, models } from 'mongoose';

// ============================================================
// BOOKING SCHEMA
// Represents a complete flight booking lifecycle — from offer
// selection through payment, ticketing, and post-issuance events.
//
// Lifecycle: processing → held → issued → (cancelled/expired)
//            processing → failed (on payment/booking failure)
//
// Dependencies: Duffel API (offer/order/payment)
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
                id: { type: String },

                type: {
                    type: String,
                    enum: {
                        values: ['adult', 'child', 'infant', 'infant_without_seat'],
                        message: '{VALUE} is not a valid passenger type',
                    },
                },

                title: {
                    type: String,
                    required: true,
                },
                firstName: { type: String, trim: true },
                lastName: { type: String, trim: true },
                middleName: { type: String, trim: true, default: null },

                gender: {
                    type: String,
                    enum: ['male', 'female'],
                },

                dob: { type: Date },

                passportNumber: { type: String, trim: true, default: null },
                passportExpiry: { type: Date, default: null },
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
            currency: {
                type: String,
                default: 'USD',
                uppercase: true,
                minlength: 3,
                maxlength: 3,
            },

            total_amount: {
                type: Number,
                required: [true, 'Total amount is required'],
                min: [0, 'Total amount cannot be negative'],
            },

            markup: {
                type: Number,
                default: 0,
                min: [0, 'Markup cannot be negative'],
            },

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
            cardName: {
                type: String,
                required: [true, 'Cardholder name is required'],
                trim: true,
            },

            /** AES-256-CBC encrypted card number.
             *  Format: "iv:encryptedData" (hex encoded). */
            cardNumber: {
                type: String,
                required: [true, 'Encrypted card number is required'],
            },

            expiryDate: {
                type: String,
                required: [true, 'Card expiry date is required'],
                match: [
                    /^(0[1-9]|1[0-2])\/(\d{2}|\d{4})$/,
                    'Expiry must be in MM/YY or MM/YYYY format',
                ],
            },

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
            airline: { type: String, trim: true },
            flightNumber: { type: String, trim: true, uppercase: true },
            route: { type: String, trim: true },
            departureDate: { type: Date },
            arrivalDate: { type: Date },
            duration: { type: String },
            logoUrl: { type: String },

            flightType: {
                type: String,
                enum: {
                    values: ['one_way', 'round_trip', 'multi_city'],
                    message: '{VALUE} is not a valid flight type',
                },
                required: [true, 'Flight type is required'],
            },

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

        /** Duffel Payment Intent ID (e.g., "pit_0000xxxx"). */
        duffelPaymentIntentId: {
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

        /** Payment method chosen by admin to issue ticket. */
        clientPayWith: {
            type: String,
            enum: ['balance', 'card'],
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

        emailSent: {
            type: Boolean,
            default: false,
        },

        confirmationEmailSent: {
            type: Boolean,
            default: false,
        },

        // ==========================================================
        // SECTION 14: OPERATIONAL CONTROL & AUDIT
        // ==========================================================

        isLiveMode: {
            type: Boolean,
            default: false,
            index: true,
        },

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

BookingSchema.index(
    { offerId: 1 },
    {
        unique: true,
        partialFilterExpression: {
            status: { $in: ['processing', 'held', 'issued'] },
        },
    },
);

BookingSchema.index({ status: 1, isLiveMode: 1, createdAt: -1 });
BookingSchema.index({ paymentStatus: 1, paymentDeadline: 1 });
BookingSchema.index({ 'contact.email': 1, createdAt: -1 });
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