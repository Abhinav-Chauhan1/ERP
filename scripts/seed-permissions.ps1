# Script to seed permissions into the database
# Run this after the main seed to set up the permission system

Write-Host "🔐 Seeding permissions..." -ForegroundColor Cyan
npx tsx prisma/seed-permissions.ts

Write-Host "✅ Permission seeding complete!" -ForegroundColor Green
