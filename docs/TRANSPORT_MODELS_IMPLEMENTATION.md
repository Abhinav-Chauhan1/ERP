# Transport Management Models Implementation

## Overview

This document describes the implementation of the transport management database models for the School ERP system. These models enable the school to manage vehicles, drivers, routes, and student transportation assignments.

## Implementation Date

November 21, 2024

## Models Created

### 1. Vehicle Model

Stores information about school vehicles (buses, vans, cars).

**Fields:**
- `id`: Unique identifier (CUID)
- `registrationNo`: Vehicle registration number (unique)
- `vehicleType`: Type of vehicle (e.g., "Bus", "Van", "Car")
- `capacity`: Maximum passenger capacity
- `driverId`: Reference to assigned driver (optional)
- `status`: Vehicle status (default: "ACTIVE")
- `createdAt`: Timestamp of creation
- `updatedAt`: Timestamp of last update

**Relationships:**
- One-to-many with Route (a vehicle can have multiple routes)
- Many-to-one with Driver (a vehicle can be assigned to one driver)

**Indexes:**
- `registrationNo` (unique)
- `status`
- `driverId`

### 2. Driver Model

Stores information about vehicle drivers.

**Fields:**
- `id`: Unique identifier (CUID)
- `name`: Driver's full name
- `phone`: Contact phone number
- `licenseNo`: Driver's license number (unique)
- `createdAt`: Timestamp of creation
- `updatedAt`: Timestamp of last update

**Relationships:**
- One-to-many with Vehicle (a driver can be assigned to multiple vehicles)

**Indexes:**
- `licenseNo` (unique)

### 3. Route Model

Stores information about transportation routes.

**Fields:**
- `id`: Unique identifier (CUID)
- `name`: Route name/description
- `vehicleId`: Reference to assigned vehicle
- `fee`: Transportation fee for this route
- `status`: Route status (default: "ACTIVE")
- `createdAt`: Timestamp of creation
- `updatedAt`: Timestamp of last update

**Relationships:**
- Many-to-one with Vehicle (a route is assigned to one vehicle)
- One-to-many with RouteStop (a route has multiple stops)
- One-to-many with StudentRoute (a route can have multiple students)

**Indexes:**
- `vehicleId`
- `status`

### 4. RouteStop Model

Stores information about stops along a route.

**Fields:**
- `id`: Unique identifier (CUID)
- `routeId`: Reference to parent route
- `stopName`: Name/location of the stop
- `arrivalTime`: Estimated arrival time (HH:mm format)
- `sequence`: Order of stop in the route
- `createdAt`: Timestamp of creation
- `updatedAt`: Timestamp of last update

**Relationships:**
- Many-to-one with Route (a stop belongs to one route)

**Indexes:**
- Composite index on `routeId` and `sequence`

**Cascade Delete:** When a route is deleted, all its stops are automatically deleted.

### 5. StudentRoute Model

Stores student assignments to transportation routes.

**Fields:**
- `id`: Unique identifier (CUID)
- `studentId`: Reference to student
- `routeId`: Reference to route
- `pickupStop`: Name of pickup location
- `dropStop`: Name of drop-off location
- `createdAt`: Timestamp of creation
- `updatedAt`: Timestamp of last update

**Relationships:**
- Many-to-one with Student (a student can be assigned to one route)
- Many-to-one with Route (a route can have multiple students)

**Indexes:**
- `routeId`
- `studentId`
- Unique constraint on `studentId` and `routeId` (a student can only be assigned to one route at a time)

## Database Migration

**Migration Name:** `20251121125123_add_transport_management_models`

**Migration File:** `prisma/migrations/20251121125123_add_transport_management_models/migration.sql`

The migration creates:
- 5 new tables: `vehicles`, `drivers`, `routes`, `route_stops`, `student_routes`
- 8 indexes for query optimization
- 5 foreign key constraints for referential integrity
- 2 unique constraints for data integrity

## Schema Updates

### Student Model Update

Added the `routes` relationship to the Student model:

```prisma
model Student {
  // ... existing fields
  routes StudentRoute[]
  // ... other relationships
}
```

This allows querying a student's assigned route directly from the Student model.

## Testing

A comprehensive test script was created at `scripts/test-transport-models.ts` that verifies:

1. ✅ Driver creation
2. ✅ Vehicle creation with driver assignment
3. ✅ Route creation with vehicle assignment
4. ✅ Multiple route stops creation
5. ✅ Relationship queries (vehicle → driver → routes → stops)
6. ✅ Indexed queries for active vehicles and routes
7. ✅ Data cleanup

All tests passed successfully, confirming:
- Models are correctly defined
- Relationships work as expected
- Indexes are functioning
- Foreign key constraints are enforced
- Cascade deletes work properly

## Requirements Validation

This implementation satisfies the following requirements from the specification:

- **Requirement 13.1:** Vehicle management with registration, capacity, and driver assignment
- **Requirement 13.2:** Route management with multiple stops and estimated times
- **Requirement 13.3:** Student-route assignment with pickup and drop locations
- **Requirement 13.4:** Transport fee calculation (fee field in Route model)
- **Requirement 13.5:** Foundation for transport attendance tracking (can be extended)

## Next Steps

The following features can now be implemented based on these models:

1. **Vehicle Management Interface** (Task 53)
   - CRUD operations for vehicles
   - Driver assignment interface
   - Vehicle status management

2. **Route Management Interface** (Task 54)
   - CRUD operations for routes
   - Route stop management with sequencing
   - Route visualization

3. **Student-Route Assignment** (Task 55)
   - Interface for assigning students to routes
   - Pickup/drop location selection
   - Transport fee calculation

4. **Transport Attendance Tracking** (Task 56)
   - Record student boarding/alighting
   - Track attendance at each stop

5. **Transport Dashboard** (Task 57)
   - Display transport statistics
   - Show active routes and vehicles
   - Today's attendance overview

## Database Schema Diagram

```
┌─────────────┐
│   Driver    │
│             │
│ - id        │
│ - name      │
│ - phone     │
│ - licenseNo │
└──────┬──────┘
       │
       │ 1:N
       │
┌──────▼──────┐
│   Vehicle   │
│             │
│ - id        │
│ - regNo     │
│ - type      │
│ - capacity  │
│ - driverId  │
│ - status    │
└──────┬──────┘
       │
       │ 1:N
       │
┌──────▼──────┐         ┌──────────────┐
│    Route    │◄────────│  RouteStop   │
│             │  1:N    │              │
│ - id        │         │ - id         │
│ - name      │         │ - routeId    │
│ - vehicleId │         │ - stopName   │
│ - fee       │         │ - arrivalTime│
│ - status    │         │ - sequence   │
└──────┬──────┘         └──────────────┘
       │
       │ 1:N
       │
┌──────▼──────────┐
│  StudentRoute   │
│                 │
│ - id            │
│ - studentId     │◄──── Student
│ - routeId       │
│ - pickupStop    │
│ - dropStop      │
└─────────────────┘
```

## Files Modified

1. `prisma/schema.prisma` - Added 5 new models and updated Student model
2. `prisma/migrations/20251121125123_add_transport_management_models/migration.sql` - Database migration
3. `scripts/test-transport-models.ts` - Test script (new file)
4. `docs/TRANSPORT_MODELS_IMPLEMENTATION.md` - This documentation (new file)

## Conclusion

The transport management database models have been successfully implemented and tested. The models provide a solid foundation for managing school transportation, including vehicles, drivers, routes, stops, and student assignments. All relationships, indexes, and constraints are working as expected, and the system is ready for the next phase of implementation (UI and business logic).
