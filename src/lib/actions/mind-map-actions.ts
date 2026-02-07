"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { requireSchoolAccess } from "@/lib/auth/tenant";
import { revalidatePath } from "next/cache";

export interface MindMapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  color?: string;
  size?: number;
  type?: 'main' | 'branch' | 'leaf';
}

export interface MindMapConnection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  color?: string;
  style?: 'solid' | 'dashed' | 'dotted';
}

export interface MindMap {
  id: string;
  title: string;
  subject: string;
  nodes: MindMapNode[];
  connections: MindMapConnection[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get all mind maps for a student
 */
export async function getMindMaps(studentId?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");

    // If no studentId provided, get current user's student record
    let targetStudentId = studentId;
    if (!targetStudentId) {
      const student = await db.student.findFirst({
        where: {
          userId: session.user.id,
          schoolId
        }
      });
      if (!student) throw new Error("Student not found");
      targetStudentId = student.id;
    }

    // Verify access - students can only view their own mind maps
    if (session.user.role === "STUDENT") {
      const student = await db.student.findFirst({
        where: { id: targetStudentId, userId: session.user.id, schoolId }
      });
      if (!student) throw new Error("Unauthorized");
    }

    const mindMaps = await db.mindMap.findMany({
      where: {
        studentId: targetStudentId,
        schoolId
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return mindMaps;
  } catch (error) {
    console.error("Error getting mind maps:", error);
    throw error;
  }
}

/**
 * Get a specific mind map
 */
export async function getMindMap(mindMapId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");

    const mindMap = await db.mindMap.findFirst({
      where: {
        id: mindMapId,
        schoolId
      },
      include: {
        student: true
      }
    });

    if (!mindMap) {
      throw new Error("Mind map not found");
    }

    // Verify access - students can only view their own mind maps
    if (session.user.role === "STUDENT" && mindMap.student.userId !== session.user.id) {
      throw new Error("Unauthorized");
    }

    return mindMap;
  } catch (error) {
    console.error("Error getting mind map:", error);
    throw error;
  }
}

/**
 * Create a new mind map
 */
export async function createMindMap(data: {
  title: string;
  subject: string;
  nodes?: MindMapNode[];
  connections?: MindMapConnection[];
  isPublic?: boolean;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");

    // Get current user's student record
    const student = await db.student.findFirst({
      where: {
        userId: session.user.id,
        schoolId
      }
    });
    if (!student) throw new Error("Student not found");

    // Create default central node if no nodes provided
    const defaultNodes = data.nodes || [
      {
        id: 'central',
        text: data.title,
        x: 400,
        y: 300,
        color: '#3b82f6',
        size: 60,
        type: 'main' as const
      }
    ];

    const mindMap = await db.mindMap.create({
      data: {
        studentId: student.id,
        schoolId,
        title: data.title,
        subject: data.subject,
        nodes: defaultNodes as any,
        connections: data.connections || [] as any,
        isPublic: data.isPublic || false
      }
    });

    revalidatePath('/student/study-tools');
    return { success: true, mindMap };
  } catch (error) {
    console.error("Error creating mind map:", error);
    return { success: false, message: "Failed to create mind map" };
  }
}

/**
 * Update a mind map
 */
export async function updateMindMap(
  mindMapId: string,
  data: {
    title?: string;
    subject?: string;
    nodes?: MindMapNode[];
    connections?: MindMapConnection[];
    isPublic?: boolean;
  }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");

    // Get the mind map and verify ownership
    const mindMap = await db.mindMap.findFirst({
      where: {
        id: mindMapId,
        schoolId
      },
      include: {
        student: true
      }
    });

    if (!mindMap) {
      return { success: false, message: "Mind map not found" };
    }

    // Verify access
    if (session.user.role === "STUDENT" && mindMap.student.userId !== session.user.id) {
      return { success: false, message: "Unauthorized" };
    }

    const updatedMindMap = await db.mindMap.update({
      where: { id: mindMapId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.subject && { subject: data.subject }),
        ...(data.nodes && { nodes: data.nodes as any }),
        ...(data.connections && { connections: data.connections as any }),
        ...(data.isPublic !== undefined && { isPublic: data.isPublic })
      }
    });

    revalidatePath('/student/study-tools');
    return { success: true, mindMap: updatedMindMap };
  } catch (error) {
    console.error("Error updating mind map:", error);
    return { success: false, message: "Failed to update mind map" };
  }
}

/**
 * Delete a mind map
 */
export async function deleteMindMap(mindMapId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");

    // Get the mind map and verify ownership
    const mindMap = await db.mindMap.findFirst({
      where: {
        id: mindMapId,
        schoolId
      },
      include: {
        student: true
      }
    });

    if (!mindMap) {
      return { success: false, message: "Mind map not found" };
    }

    // Verify access
    if (session.user.role === "STUDENT" && mindMap.student.userId !== session.user.id) {
      return { success: false, message: "Unauthorized" };
    }

    await db.mindMap.delete({
      where: { id: mindMapId }
    });

    revalidatePath('/student/study-tools');
    return { success: true, message: "Mind map deleted successfully" };
  } catch (error) {
    console.error("Error deleting mind map:", error);
    return { success: false, message: "Failed to delete mind map" };
  }
}

/**
 * Add a node to a mind map
 */
export async function addMindMapNode(
  mindMapId: string,
  node: MindMapNode
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");

    // Get the mind map and verify ownership
    const mindMap = await db.mindMap.findFirst({
      where: {
        id: mindMapId,
        schoolId
      },
      include: {
        student: true
      }
    });

    if (!mindMap) {
      return { success: false, message: "Mind map not found" };
    }

    // Verify access
    if (session.user.role === "STUDENT" && mindMap.student.userId !== session.user.id) {
      return { success: false, message: "Unauthorized" };
    }

    const currentNodes = mindMap.nodes as unknown as MindMapNode[];
    const updatedNodes = [...currentNodes, node];

    const updatedMindMap = await db.mindMap.update({
      where: { id: mindMapId },
      data: {
        nodes: updatedNodes as any
      }
    });

    revalidatePath('/student/study-tools');
    return { success: true, mindMap: updatedMindMap };
  } catch (error) {
    console.error("Error adding mind map node:", error);
    return { success: false, message: "Failed to add node" };
  }
}

/**
 * Update a node in a mind map
 */
export async function updateMindMapNode(
  mindMapId: string,
  nodeId: string,
  updates: Partial<MindMapNode>
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");

    // Get the mind map and verify ownership
    const mindMap = await db.mindMap.findFirst({
      where: {
        id: mindMapId,
        schoolId
      },
      include: {
        student: true
      }
    });

    if (!mindMap) {
      return { success: false, message: "Mind map not found" };
    }

    // Verify access
    if (session.user.role === "STUDENT" && mindMap.student.userId !== session.user.id) {
      return { success: false, message: "Unauthorized" };
    }

    const currentNodes = mindMap.nodes as unknown as MindMapNode[];
    const updatedNodes = currentNodes.map(node => 
      node.id === nodeId ? { ...node, ...updates } : node
    );

    const updatedMindMap = await db.mindMap.update({
      where: { id: mindMapId },
      data: {
        nodes: updatedNodes as any
      }
    });

    revalidatePath('/student/study-tools');
    return { success: true, mindMap: updatedMindMap };
  } catch (error) {
    console.error("Error updating mind map node:", error);
    return { success: false, message: "Failed to update node" };
  }
}

/**
 * Remove a node from a mind map
 */
export async function removeMindMapNode(
  mindMapId: string,
  nodeId: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");

    // Get the mind map and verify ownership
    const mindMap = await db.mindMap.findFirst({
      where: {
        id: mindMapId,
        schoolId
      },
      include: {
        student: true
      }
    });

    if (!mindMap) {
      return { success: false, message: "Mind map not found" };
    }

    // Verify access
    if (session.user.role === "STUDENT" && mindMap.student.userId !== session.user.id) {
      return { success: false, message: "Unauthorized" };
    }

    const currentNodes = mindMap.nodes as unknown as MindMapNode[];
    const currentConnections = mindMap.connections as unknown as MindMapConnection[];
    
    // Remove node and any connections to/from it
    const updatedNodes = currentNodes.filter(node => node.id !== nodeId);
    const updatedConnections = currentConnections.filter(
      conn => conn.fromNodeId !== nodeId && conn.toNodeId !== nodeId
    );

    const updatedMindMap = await db.mindMap.update({
      where: { id: mindMapId },
      data: {
        nodes: updatedNodes as any,
        connections: updatedConnections as any
      }
    });

    revalidatePath('/student/study-tools');
    return { success: true, mindMap: updatedMindMap };
  } catch (error) {
    console.error("Error removing mind map node:", error);
    return { success: false, message: "Failed to remove node" };
  }
}

/**
 * Add a connection between nodes
 */
export async function addMindMapConnection(
  mindMapId: string,
  connection: MindMapConnection
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");

    // Get the mind map and verify ownership
    const mindMap = await db.mindMap.findFirst({
      where: {
        id: mindMapId,
        schoolId
      },
      include: {
        student: true
      }
    });

    if (!mindMap) {
      return { success: false, message: "Mind map not found" };
    }

    // Verify access
    if (session.user.role === "STUDENT" && mindMap.student.userId !== session.user.id) {
      return { success: false, message: "Unauthorized" };
    }

    const currentConnections = mindMap.connections as unknown as MindMapConnection[];
    const updatedConnections = [...currentConnections, connection];

    const updatedMindMap = await db.mindMap.update({
      where: { id: mindMapId },
      data: {
        connections: updatedConnections as any
      }
    });

    revalidatePath('/student/study-tools');
    return { success: true, mindMap: updatedMindMap };
  } catch (error) {
    console.error("Error adding mind map connection:", error);
    return { success: false, message: "Failed to add connection" };
  }
}

/**
 * Remove a connection between nodes
 */
export async function removeMindMapConnection(
  mindMapId: string,
  connectionId: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    const { schoolId } = await requireSchoolAccess();
    if (!schoolId) throw new Error("School context required");

    // Get the mind map and verify ownership
    const mindMap = await db.mindMap.findFirst({
      where: {
        id: mindMapId,
        schoolId
      },
      include: {
        student: true
      }
    });

    if (!mindMap) {
      return { success: false, message: "Mind map not found" };
    }

    // Verify access
    if (session.user.role === "STUDENT" && mindMap.student.userId !== session.user.id) {
      return { success: false, message: "Unauthorized" };
    }

    const currentConnections = mindMap.connections as unknown as MindMapConnection[];
    const updatedConnections = currentConnections.filter(conn => conn.id !== connectionId);

    const updatedMindMap = await db.mindMap.update({
      where: { id: mindMapId },
      data: {
        connections: updatedConnections as any
      }
    });

    revalidatePath('/student/study-tools');
    return { success: true, mindMap: updatedMindMap };
  } catch (error) {
    console.error("Error removing mind map connection:", error);
    return { success: false, message: "Failed to remove connection" };
  }
}