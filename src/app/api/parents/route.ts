import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";

// GET /api/parents - Get all parents
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const parents = await db.parent.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        avatar: true,
                        active: true,
                    },
                },
                children: {
                    include: {
                        student: {
                            include: {
                                user: {
                                    select: {
                                        firstName: true,
                                        lastName: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: {
                user: {
                    firstName: "asc",
                },
            },
        });

        return NextResponse.json(parents);
    } catch (error) {
        console.error("Error fetching parents:", error);
        return NextResponse.json(
            { error: "Failed to fetch parents" },
            { status: 500 }
        );
    }
}
