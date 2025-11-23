/**
 * Test script to verify transport management models
 * This script tests the basic CRUD operations for transport models
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testTransportModels() {
  console.log('🚀 Testing Transport Management Models...\n');

  try {
    // Test 1: Create a Driver
    console.log('1. Creating a driver...');
    const driver = await prisma.driver.create({
      data: {
        name: 'John Doe',
        phone: '+1234567890',
        licenseNo: 'DL123456789',
      },
    });
    console.log('✅ Driver created:', driver.id);

    // Test 2: Create a Vehicle
    console.log('\n2. Creating a vehicle...');
    const vehicle = await prisma.vehicle.create({
      data: {
        registrationNo: 'ABC-1234',
        vehicleType: 'Bus',
        capacity: 50,
        driverId: driver.id,
        status: 'ACTIVE',
      },
    });
    console.log('✅ Vehicle created:', vehicle.id);

    // Test 3: Create a Route
    console.log('\n3. Creating a route...');
    const route = await prisma.route.create({
      data: {
        name: 'Route 1 - North Area',
        vehicleId: vehicle.id,
        fee: 500.0,
        status: 'ACTIVE',
      },
    });
    console.log('✅ Route created:', route.id);

    // Test 4: Create Route Stops
    console.log('\n4. Creating route stops...');
    const stops = await prisma.routeStop.createMany({
      data: [
        {
          routeId: route.id,
          stopName: 'Main Gate',
          arrivalTime: '07:00',
          sequence: 1,
        },
        {
          routeId: route.id,
          stopName: 'Park Avenue',
          arrivalTime: '07:15',
          sequence: 2,
        },
        {
          routeId: route.id,
          stopName: 'School',
          arrivalTime: '07:45',
          sequence: 3,
        },
      ],
    });
    console.log(`✅ Created ${stops.count} route stops`);

    // Test 5: Verify relationships
    console.log('\n5. Verifying relationships...');
    const vehicleWithRelations = await prisma.vehicle.findUnique({
      where: { id: vehicle.id },
      include: {
        driver: true,
        routes: {
          include: {
            stops: {
              orderBy: { sequence: 'asc' },
            },
          },
        },
      },
    });
    console.log('✅ Vehicle with driver:', vehicleWithRelations?.driver?.name);
    console.log('✅ Vehicle routes:', vehicleWithRelations?.routes.length);
    console.log('✅ Route stops:', vehicleWithRelations?.routes[0]?.stops.length);

    // Test 6: Query with indexes
    console.log('\n6. Testing indexed queries...');
    const activeVehicles = await prisma.vehicle.findMany({
      where: { status: 'ACTIVE' },
    });
    console.log(`✅ Found ${activeVehicles.length} active vehicles`);

    const activeRoutes = await prisma.route.findMany({
      where: { status: 'ACTIVE' },
      include: {
        vehicle: true,
        stops: {
          orderBy: { sequence: 'asc' },
        },
      },
    });
    console.log(`✅ Found ${activeRoutes.length} active routes`);

    // Cleanup
    console.log('\n7. Cleaning up test data...');
    await prisma.routeStop.deleteMany({ where: { routeId: route.id } });
    await prisma.route.delete({ where: { id: route.id } });
    await prisma.vehicle.delete({ where: { id: vehicle.id } });
    await prisma.driver.delete({ where: { id: driver.id } });
    console.log('✅ Test data cleaned up');

    console.log('\n✨ All transport model tests passed successfully!');
  } catch (error) {
    console.error('❌ Error testing transport models:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the tests
testTransportModels()
  .then(() => {
    console.log('\n🎉 Transport models are working correctly!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Transport model tests failed:', error);
    process.exit(1);
  });
