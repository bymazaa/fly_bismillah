// lib/apiResponse.ts

import { NextResponse } from 'next/server';
import { IApiResponse } from '@/types/admin';

export function successResponse<T>(
  message: string,
  data?: T,
  statusCode: number = 200
): NextResponse<IApiResponse<T>> {
  const response: IApiResponse<T> = {
    success: true,
    message,
  };

  if (data !== undefined) {
    response.data = data;
  }

  return NextResponse.json(response, { status: statusCode });
}

export function errorResponse(
  message: string,
  statusCode: number = 400
): NextResponse<IApiResponse> {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status: statusCode }
  );
}