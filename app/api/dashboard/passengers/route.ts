// app/api/passengers/route.ts

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/connection/db';
import Booking from '@/models/Booking.model';
import { decrypt } from '../../duffel/booking/utils';

// =============================================
// ✅ Helper: Build the $match stage for search
// =============================================
function buildSearchStage(search: string) {
  if (!search || search.trim() === '') return null;

  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = { $regex: escaped, $options: 'i' };

  return {
    $match: {
      $or: [
        { 'passengers.firstName': regex },
        { 'passengers.lastName': regex },
        { 'passengers.email': regex },
        { 'passengers.phone': regex },
        { 'passengers.passportNumber': regex },
        { 'contact.email': regex },
        { 'contact.phone': regex },
        { pnr: regex },
        { bookingReference: regex },
      ],
    },
  };
}

// =============================================
// ✅ Helper: Build the $match stage for filters
// =============================================
function buildFilterStage(params: URLSearchParams) {
  const conditions: Record<string, any>[] = [];

  // --- Passenger Type Filter (adult / child / infant) ---
  const type = params.get('type');
  if (type) {
    conditions.push({ 'passengers.type': type });
  }

  // --- Gender Filter ---
  const gender = params.get('gender');
  if (gender) {
    conditions.push({ 'passengers.gender': gender });
  }

  // --- Passport Country Filter ---
  const country = params.get('passportCountry');
  if (country) {
    conditions.push({
      'passengers.passportCountry': { $regex: `^${country}$`, $options: 'i' },
    });
  }

  // --- Booking Date Range Filter ---
  const dateFrom = params.get('dateFrom');
  const dateTo = params.get('dateTo');
  if (dateFrom || dateTo) {
    const dateCondition: Record<string, any> = {};
    if (dateFrom) dateCondition.$gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      dateCondition.$lte = end;
    }
    conditions.push({ createdAt: dateCondition });
  }

  // --- DOB Range Filter (age range approximation) ---
  const dobFrom = params.get('dobFrom');
  const dobTo = params.get('dobTo');
  if (dobFrom || dobTo) {
    const dobCondition: Record<string, any> = {};
    if (dobFrom) dobCondition.$gte = new Date(dobFrom);
    if (dobTo) dobCondition.$lte = new Date(dobTo);
    conditions.push({ 'passengers.dob': dobCondition });
  }

  if (conditions.length === 0) return null;

  return { $match: { $and: conditions } };
}

// =============================================
// ✅ Helper: Build the $sort stage
// =============================================
function buildSortStage(sortBy: string, sortOrder: string) {
  const allowedFields: Record<string, string> = {
    firstName: 'firstName',
    lastName: 'lastName',
    email: 'email',
    phone: 'phone',
    dob: 'dob',
    type: 'type',
    gender: 'gender',
    passportNumber: 'passportNumber',
    passportCountry: 'passportCountry',
    lastTravelDate: 'lastTravelDate',
    lastPnr: 'lastPnr',
    lastBookingRef: 'lastBookingRef',
    cardHolderName: 'cardHolderName',
  };

  const field = allowedFields[sortBy] || 'lastTravelDate';
  const order = sortOrder === 'asc' ? 1 : -1;

  return { $sort: { [field]: order } as Record<string, 1 | -1> };
}

// =============================================
// ✅ Main GET Handler
// =============================================
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // ─── Extract Query Params ─────────────────────
    const { searchParams } = new URL(request.url);

    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get('limit') || '10', 10), 1),
      100 // max 100 per page
    );
    const skip = (page - 1) * limit;

    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'lastTravelDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // ─── Build Pipeline ───────────────────────────
    const pipeline: any[] = [
      // 1️⃣ Initial sort by createdAt
      { $sort: { createdAt: -1 } },

      // 2️⃣ Unwind passengers
      {
        $unwind: {
          path: '$passengers',
          preserveNullAndEmptyArrays: false,
        },
      },
    ];

    // 3️⃣ Search (before grouping — works on raw fields)
    const searchStage = buildSearchStage(search);
    if (searchStage) pipeline.push(searchStage);

    // 4️⃣ Filters (before grouping)
    const filterStage = buildFilterStage(searchParams);
    if (filterStage) pipeline.push(filterStage);

    // 5️⃣ Unique Key generation + computed fields
    pipeline.push({
      $addFields: {
        uniqueKey: {
          $cond: {
            if: {
              $and: [
                { $ne: ['$passengers.passportNumber', null] },
                { $ne: ['$passengers.passportNumber', ''] },
              ],
            },
            then: '$passengers.passportNumber',
            else: {
              $concat: [
                { $ifNull: ['$passengers.firstName', ''] },
                '-',
                { $ifNull: ['$passengers.lastName', ''] },
                '-',
                { $ifNull: [{ $toString: '$passengers.dob' }, ''] },
              ],
            },
          },
        },
        finalEmail: {
          $ifNull: [
            {
              $cond: [
                { $ne: ['$passengers.email', ''] },
                '$passengers.email',
                null,
              ],
            },
            '$contact.email',
            'N/A',
          ],
        },
        finalPhone: {
          $ifNull: [
            {
              $cond: [
                { $ne: ['$passengers.phone', ''] },
                '$passengers.phone',
                null,
              ],
            },
            '$contact.phone',
            'N/A',
          ],
        },
      },
    });

    // 6️⃣ Group by unique passenger
    pipeline.push({
      $group: {
        _id: '$uniqueKey',
        passengerId: { $first: '$passengers._id' },
        firstName: { $first: '$passengers.firstName' },
        lastName: { $first: '$passengers.lastName' },
        type: { $first: '$passengers.type' },
        gender: { $first: '$passengers.gender' },
        dob: { $first: '$passengers.dob' },
        passportNumber: {
          $first: { $ifNull: ['$passengers.passportNumber', 'N/A'] },
        },
        passportExpiry: {
          $first: { $ifNull: ['$passengers.passportExpiry', 'N/A'] },
        },
        passportCountry: {
          $first: { $ifNull: ['$passengers.passportCountry', 'BD'] },
        },
        email: { $first: '$finalEmail' },
        phone: { $first: '$finalPhone' },
        lastPnr: { $first: '$pnr' },
        lastBookingRef: { $first: '$bookingReference' },
        lastTravelDate: { $first: '$createdAt' },
        totalBookings: { $sum: 1 }, // ✅ bonus: count of bookings

        encryptedCardNumber: { $first: '$paymentInfo.cardNumber' },
        cardHolderName: { $first: '$paymentInfo.cardName' },
        cardExpiry: { $first: '$paymentInfo.expiryDate' },

        billingStreet: {
          $first: '$paymentInfo.billingAddress.street',
        },
        billingCity: { $first: '$paymentInfo.billingAddress.city' },
        billingZip: {
          $first: '$paymentInfo.billingAddress.zipCode',
        },
        billingCountry: {
          $first: '$paymentInfo.billingAddress.country',
        },
        billingState: {
          $first: '$paymentInfo.billingAddress.state',
        },
      },
    });

    // 7️⃣ Project final shape
    pipeline.push({
      $project: {
        _id: 0,
        id: {
          $ifNull: ['$passengerId', { $toString: '$_id' }],
        },
        firstName: 1,
        lastName: 1,
        type: 1,
        gender: 1,
        dob: 1,
        passportNumber: 1,
        passportExpiry: 1,
        passportCountry: 1,
        email: 1,
        phone: 1,
        lastPnr: 1,
        lastBookingRef: 1,
        lastTravelDate: 1,
        totalBookings: 1,

        encryptedCardNumber: 1,
        cardHolderName: { $ifNull: ['$cardHolderName', 'N/A'] },
        cardExpiry: { $ifNull: ['$cardExpiry', 'N/A'] },

        fullBillingAddress: {
          $concat: [
            { $ifNull: ['$billingStreet', ''] },
            ', ',
            { $ifNull: ['$billingCity', ''] },
            ', ',
            { $ifNull: ['$billingState', ''] },
            ' ',
            { $ifNull: ['$billingZip', ''] },
            ', ',
            { $ifNull: ['$billingCountry', ''] },
          ],
        },
      },
    });

    // ─── 8️⃣ Use $facet for count + paginated data ───
    pipeline.push({
      $facet: {
        // Total count (before pagination)
        metadata: [{ $count: 'total' }],

        // Paginated + sorted data
        data: [
          buildSortStage(sortBy, sortOrder),
          { $skip: skip },
          { $limit: limit },
        ],
      },
    });

    // ─── Execute ──────────────────────────────────
    const [result] = await Booking.aggregate(pipeline);

    const total = result.metadata[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // ─── Decrypt card numbers ─────────────────────
    const finalData = result.data.map((p: any) => {
      let cardNumber = 'N/A';
      try {
        if (p.encryptedCardNumber) {
          cardNumber = decrypt(p.encryptedCardNumber);
        }
      } catch {
        cardNumber = 'Decryption Failed';
      }

      return {
        ...p,
        cardNumber,
        encryptedCardNumber: undefined,
      };
    });

    // ─── Response ─────────────────────────────────
    return NextResponse.json({
      success: true,
      data: finalData,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      appliedFilters: {
        search: search || null,
        type: searchParams.get('type') || null,
        gender: searchParams.get('gender') || null,
        passportCountry: searchParams.get('passportCountry') || null,
        dateFrom: searchParams.get('dateFrom') || null,
        dateTo: searchParams.get('dateTo') || null,
        sortBy,
        sortOrder,
      },
    });
  } catch (error: any) {
    console.error('Passenger List API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server Error' },
      { status: 500 }
    );
  }
}