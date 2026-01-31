import { Prisma } from '@prisma/client';

// Route with all includes for detailed view
export type RouteWithDetails = Prisma.RouteGetPayload<{
  include: {
    vehicle: {
      include: {
        driver: true;
      };
    };
    stops: true;
    students: {
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true;
                lastName: true;
              };
            };
          };
        };
      };
    };
    _count: {
      select: {
        students: true;
      };
    };
  };
}>;

// Route stop type
export type RouteStop = Prisma.RouteStopGetPayload<{}>;

// Student route assignment type for the list component
export type StudentRouteForList = {
  id: string;
  pickupStop: string;
  dropStop: string;
  student: {
    id: string;
    admissionId: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
};

// Vehicle with driver type
export type VehicleWithDriver = Prisma.VehicleGetPayload<{
  include: {
    driver: true;
  };
}>;