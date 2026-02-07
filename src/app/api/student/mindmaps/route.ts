import { NextRequest, NextResponse } from "next/server";
import { getMindMaps, createMindMap } from "@/lib/actions/mind-map-actions";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    const result = await getMindMaps(studentId || undefined);
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Error in mind maps API:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to get mind maps"
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, subject, nodes, connections, isPublic } = body;

    if (!title || !subject) {
      return NextResponse.json(
        { success: false, message: "Title and subject are required" },
        { status: 400 }
      );
    }

    const result = await createMindMap({
      title,
      subject,
      nodes,
      connections,
      isPublic
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in create mind map API:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to create mind map"
      },
      { status: 500 }
    );
  }
}