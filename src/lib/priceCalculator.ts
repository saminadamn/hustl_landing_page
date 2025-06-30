import { Location } from './locationService';

export type UrgencyLevel = 'low' | 'medium' | 'high';

interface PriceBreakdown {
  basePrice: number;
  distanceFee: number;
  urgencyFee: number;
  serviceFee: number;
  total: number;
  distance: number;
  urgencyMultiplier: number;
  distanceRate: number;
  serviceFeePercentage: number;
}

const URGENCY_PRICES = {
  low: 1.00,
  medium: 3.00,
  high: 5.00
};

const BASE_PRICE = 1.50; // Base price for any task
const DISTANCE_RATE = 0.50; // $0.50 per 0.5 miles
const SERVICE_FEE_PERCENTAGE = 0.151; // 15.1% service fee

export async function calculateTaskPrice(
  taskLocation: Location,
  currentLocation: Location,
  urgency: UrgencyLevel,
  isFreeTask: boolean = false
): Promise<PriceBreakdown> {
  try {
    // If it's a free task or missing coordinates, return all zeros
    if (isFreeTask || !taskLocation?.lat || !taskLocation?.lng || !currentLocation?.lat || !currentLocation?.lng) {
      return {
        basePrice: 0,
        distanceFee: 0,
        urgencyFee: 0,
        serviceFee: 0,
        total: 0,
        distance: 0,
        urgencyMultiplier: 1,
        distanceRate: 0,
        serviceFeePercentage: 0
      };
    }

    // Calculate distance in miles
    const distanceInMiles = calculateDistance(taskLocation, currentLocation);
    
    // Calculate distance fee ($0.50 per 0.5 miles)
    const distanceUnits = Math.ceil(distanceInMiles * 2); // Convert to 0.5 mile units and round up
    const distanceFee = Math.max(0, distanceUnits * DISTANCE_RATE);
    
    // Get base price
    const basePrice = BASE_PRICE;

    // Get urgency fee based on level
    const urgencyFee = URGENCY_PRICES[urgency];

    // Calculate subtotal before service fee
    const subtotal = basePrice + distanceFee + urgencyFee;

    // Calculate service fee (fixed at 15.1%)
    const serviceFee = Math.max(0, subtotal * SERVICE_FEE_PERCENTAGE);

    // Calculate total
    const total = subtotal + serviceFee;

    // Ensure all numbers are valid and non-negative
    return {
      basePrice: Math.max(0, Number(basePrice.toFixed(2)) || 0),
      distanceFee: Math.max(0, Number(distanceFee.toFixed(2)) || 0),
      urgencyFee: Math.max(0, Number(urgencyFee.toFixed(2)) || 0),
      serviceFee: Math.max(0, Number(serviceFee.toFixed(2)) || 0),
      total: Math.max(0, Number(total.toFixed(2)) || 0),
      distance: Math.max(0, Number(distanceInMiles.toFixed(2)) || 0),
      urgencyMultiplier: 1, // Not using multipliers anymore, using fixed prices
      distanceRate: DISTANCE_RATE,
      serviceFeePercentage: SERVICE_FEE_PERCENTAGE * 100
    };
  } catch (error) {
    console.error('Error calculating price:', error);
    // Return zero values on error
    return {
      basePrice: 0,
      distanceFee: 0,
      urgencyFee: 0,
      serviceFee: 0,
      total: 0,
      distance: 0,
      urgencyMultiplier: 1,
      distanceRate: 0,
      serviceFeePercentage: 0
    };
  }
}

function calculateDistance(loc1: Location, loc2: Location): number {
  try {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRad(loc2.lat - loc1.lat);
    const dLon = toRad(loc2.lng - loc1.lng);
    const lat1 = toRad(loc1.lat);
    const lat2 = toRad(loc2.lat);

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distanceKm = R * c;
    
    // Convert to miles and ensure non-negative
    return Math.max(0, distanceKm * 0.621371);
  } catch (error) {
    console.error('Error calculating distance:', error);
    return 0;
  }
}

function toRad(degrees: number): number {
  return (degrees || 0) * (Math.PI / 180);
}