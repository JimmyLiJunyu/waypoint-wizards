export interface TransitSegment {
    travelMode: "WALK" | "TRANSIT";
    distanceText: string;
    durationText: string;
    durationSeconds: number;
    polyline?: string | string[] | null;
    lineName?: string;
    lineShortName?: string;
    vehicleType?: string;
    vehicleIconUri?: string;
    lineColor?: string;
    lineTextColor?: string;
    numStops?: number;
    headsign?: string;
    departureStop?: string;
    arrivalStop?: string;
  }
  
  export interface ModeLeg {
    distanceText: string;
    durationText: string;
    durationSeconds: number;
    transitLine?: string;
    transitVehicle?: string;
    segments?: TransitSegment[];
  }
  
  export interface DayLegs {
    walking: ModeLeg[];
    driving: ModeLeg[];
    transit: ModeLeg[];
  }