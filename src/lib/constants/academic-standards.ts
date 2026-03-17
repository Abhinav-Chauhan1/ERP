
// Standard departments for Indian schools
export const STANDARD_DEPARTMENTS = [
    { name: "Science", description: "Natural sciences including Physics, Chemistry, and Biology" },
    { name: "Mathematics", description: "Mathematical sciences and calculations" },
    { name: "Languages", description: "English, Hindi, Sanskrit, and regional languages" },
    { name: "Social Studies", description: "History, Geography, Political Science, and Economics" },
    { name: "Commerce", description: "Accountancy, Business Studies, and Economics" },
    { name: "Computer Science", description: "Information Technology and Programming" },
    { name: "Physical Education", description: "Sports, Health, and Fitness" },
    { name: "Arts", description: "Fine Arts, Music, Dance, and Creative subjects" },
];

export const STANDARD_SUBJECTS = [
    { name: "English", code: "ENG", department: "Languages", description: "English Language and Literature", category: "SCHOLASTIC" as const },
    { name: "Hindi", code: "HIN", department: "Languages", description: "Hindi Language and Literature", category: "SCHOLASTIC" as const },
    { name: "Sanskrit", code: "SAN", department: "Languages", description: "Sanskrit Language", category: "SCHOLASTIC" as const },
    { name: "Mathematics", code: "MAT", department: "Mathematics", description: "Pure and Applied Mathematics", category: "SCHOLASTIC" as const },
    { name: "Physics", code: "PHY", department: "Science", description: "Study of matter, energy, and their interactions", category: "SCHOLASTIC" as const },
    { name: "Chemistry", code: "CHE", department: "Science", description: "Study of substances and chemical reactions", category: "SCHOLASTIC" as const },
    { name: "Biology", code: "BIO", department: "Science", description: "Study of living organisms", category: "SCHOLASTIC" as const },
    { name: "Science", code: "SCI", department: "Science", description: "General Science for primary/middle school", category: "SCHOLASTIC" as const },
    { name: "History", code: "HIS", department: "Social Studies", description: "Study of past events and civilizations", category: "SCHOLASTIC" as const },
    { name: "Geography", code: "GEO", department: "Social Studies", description: "Study of Earth and its features", category: "SCHOLASTIC" as const },
    { name: "Civics", code: "CIV", department: "Social Studies", description: "Study of citizenship and government", category: "SCHOLASTIC" as const },
    { name: "Economics", code: "ECO", department: "Commerce", description: "Study of production, distribution, and consumption", category: "SCHOLASTIC" as const },
    { name: "Accountancy", code: "ACC", department: "Commerce", description: "Financial accounting and reporting", category: "SCHOLASTIC" as const },
    { name: "Business Studies", code: "BST", department: "Commerce", description: "Study of business organizations and management", category: "SCHOLASTIC" as const },
    { name: "Computer Science", code: "CS", department: "Computer Science", description: "Programming and computer fundamentals", category: "SCHOLASTIC" as const },
    { name: "Information Technology", code: "IT", department: "Computer Science", description: "IT applications and digital literacy", category: "SCHOLASTIC" as const },
    { name: "Physical Education", code: "PE", department: "Physical Education", description: "Sports, fitness, and health education", category: "ADDITIONAL" as const },
    { name: "Art", code: "ART", department: "Arts", description: "Visual arts and creative expression", category: "ADDITIONAL" as const },
    { name: "Music", code: "MUS", department: "Arts", description: "Vocal and instrumental music", category: "ADDITIONAL" as const },
    { name: "Environmental Studies", code: "EVS", department: "Science", description: "Study of environment and ecology", category: "SCHOLASTIC" as const },
    { name: "Social Science", code: "SSC", department: "Social Studies", description: "Combined history, geography, and civics", category: "SCHOLASTIC" as const },
];
