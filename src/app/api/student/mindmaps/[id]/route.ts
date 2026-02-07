import { NextRequest, NextResponse } from "next/server";
import { getMindMap, updateMindMap, deleteMindMap } from "@/lib/actions/mind-map-actions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: mindMapId } = await params;
    
    if (!mindMapId) {
      return NextResponse.json(
        { success: false, message: "Mind map ID is required" },
        { status: 400 }
      );
    }

    const result = await getMindMap(mindMapId);
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Error in get mind map API:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to get mind map"
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: mindMapId } = await params;
    const body = await request.json();
    const { title, subject, nodes, connections, isPublic } = body;
    
    if (!mindMapId) {
      return NextResponse.json(
        { success: false, message: "Mind map ID is required" },
        { status: 400 }
      );
    }

    const result = await updateMindMap(mindMapId, {
      title,
      subject,
      nodes,
      connections,
      isPublic
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in update mind map API:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to update mind map"
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: mindMapId } = await params;
    
    if (!mindMapId) {
      return NextResponse.json(
        { success: false, message: "Mind map ID is required" },
        { status: 400 }
      );
    }

    const result = await deleteMindMap(mindMapId);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in delete mind map API:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to delete mind map"
      },
      { status: 500 }
    );
  }
}