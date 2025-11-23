#!/bin/bash

# Script to seed permissions into the database
# Run this after the main seed to set up the permission system

echo "🔐 Seeding permissions..."
tsx prisma/seed-permissions.ts

echo "✅ Permission seeding complete!"
