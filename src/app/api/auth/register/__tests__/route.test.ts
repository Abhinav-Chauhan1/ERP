import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { POST } from "../route"
import { NextRequest } from "next/server"
import { db } from "@/lib/db"

// Mock dependencies
vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn()
    },
    verificationToken: {
      create: vi.fn()
    },
    auditLog: {
      create: vi.fn()
    }
  }
}))

vi.mock("@/lib/utils/email-service", () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true, messageId: "test-id" })
}))

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should successfully register a new user with valid data", async () => {
    // Mock no existing user
    vi.mocked(db.user.findUnique).mockResolvedValue(null)
    
    // Mock user creation
    vi.mocked(db.user.create).mockResolvedValue({
      id: "test-user-id",
      email: "test@example.com",
      firstName: "John",
      lastName: "Doe",
      name: "John Doe",
      role: "STUDENT",
      active: true,
      password: "hashed-password",
      emailVerified: null,
      phone: null,
      avatar: null,
      image: null,
      clerkId: null,
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: null,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "Test123!@#",
        firstName: "John",
        lastName: "Doe"
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.message).toContain("check your email")
    expect(db.user.create).toHaveBeenCalled()
    expect(db.verificationToken.create).toHaveBeenCalled()
    expect(db.auditLog.create).toHaveBeenCalled()
  })

  it("should reject registration with missing fields", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "Test123!@#"
        // Missing firstName and lastName
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain("required")
  })

  it("should reject registration with invalid email format", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "invalid-email",
        password: "Test123!@#",
        firstName: "John",
        lastName: "Doe"
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain("Invalid email")
  })

  it("should reject registration with weak password", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "weak",
        firstName: "John",
        lastName: "Doe"
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain("Password does not meet requirements")
    expect(data.details).toBeDefined()
    expect(Array.isArray(data.details)).toBe(true)
  })

  it("should reject registration with duplicate email", async () => {
    // Mock existing user
    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: "existing-user-id",
      email: "test@example.com",
      firstName: "Existing",
      lastName: "User",
      name: "Existing User",
      role: "STUDENT",
      active: true,
      password: "hashed-password",
      emailVerified: new Date(),
      phone: null,
      avatar: null,
      image: null,
      clerkId: null,
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: null,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "Test123!@#",
        firstName: "John",
        lastName: "Doe"
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.success).toBe(false)
    expect(data.error).toContain("already exists")
  })

  it("should handle database errors gracefully", async () => {
    // Mock database error
    vi.mocked(db.user.findUnique).mockRejectedValue(new Error("Database error"))

    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "Test123!@#",
        firstName: "John",
        lastName: "Doe"
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toContain("error occurred")
  })
})
