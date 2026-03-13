// types/flight.ts

export interface FlightDepartureArrival {
  airport: string | null;
  code: string | null;
  city: string | null;
  terminal: string | null;
  time: string;
}

export interface FlightSegment {
  id: string;
  airline: string | null;
  logo: string | null;
  flightNumber: string | null;
  aircraft: string | null;
  classType: string;
  departure: FlightDepartureArrival;
  arrival: FlightDepartureArrival;
  duration: string;
  layoverToNext: string | null;
  amenities: string[];
}

export interface FlightLeg {
  id: string;
  direction: string;
  totalDuration: string;
  stops: number;
  segments: FlightSegment[];
  mainDeparture: FlightDepartureArrival | null;
  mainArrival: FlightDepartureArrival | null;
  mainAirline: string | null;
  mainLogo: string | null;
}

export interface BaggageDetail {
  type: string;
  label: string;
  icon: string;
  quantity: number;
  weightPerBag: number;
  totalWeight: number;
  weightUnit: string;
  isApprox: boolean;
  hasExplicitWeight: boolean;
  isIncluded: boolean;
  displayText: string;
}

export interface BaggageInfo {
  summary: string;
  details: BaggageDetail[];
  hasChecked: boolean;
  hasCarryOn: boolean;
  hasPersonalItem: boolean;
  totalWeight: number;
  totalWeightDisplay: string;
  includedCount: number;
}

export interface FlightPassengerId {
  id: string;
  type: string | null;
  age: number | null;
}

export interface FlightOffer {
  id: string;
  carrier: {
    name: string | null;
    logo: string | null;
    code: string | null;
  };
  itinerary: FlightLeg[];
  price: {
    currency: string;
    basePrice: number;
    markup: number;
    finalPrice: number;
  };
  conditions: {
    refundable: boolean;
    changeable: boolean;
    penalty?: string;
  };
  baggage: BaggageInfo;
  cabinClass: string;
  expiresAt: string | null;
  passengerIds: FlightPassengerId[];
}