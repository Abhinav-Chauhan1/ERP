/**
 * Alumni Components
 * 
 * Export all alumni-related components for easy importing.
 */

export { AlumniDirectory } from "./alumni-directory";
export { AlumniSearchBar } from "./alumni-search-bar";
export { AlumniFilters } from "./alumni-filters";
export type { AlumniFiltersState } from "./alumni-filters";
export { AlumniCard } from "./alumni-card";
export type { AlumniCardData } from "./alumni-card";
export { AlumniTable } from "./alumni-table";
export { AlumniStats } from "./alumni-stats";
export type { AlumniStatisticsData } from "./alumni-stats";

// Alumni Profile Components
export { AlumniProfileHeader } from "./alumni-profile-header";
export type { AlumniProfileHeaderData } from "./alumni-profile-header";
export { AlumniInfoSection } from "./alumni-info-section";
export type { AlumniInfoData } from "./alumni-info-section";
export { AlumniAcademicHistory } from "./alumni-academic-history";
export type { 
  AcademicHistoryData,
  AttendanceRecord,
  ExamResult,
  AssignmentRecord
} from "./alumni-academic-history";
export { AlumniCommunicationPreferences } from "./alumni-communication-preferences";
export type { CommunicationPreferencesData } from "./alumni-communication-preferences";
export { AlumniActivityTimeline } from "./alumni-activity-timeline";
export type { ActivityRecord, ActivityType } from "./alumni-activity-timeline";
