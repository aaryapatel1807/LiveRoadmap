// Role definitions shared between server and client.
// (Server pipeline adds searchQuery; the client only needs id/label/chips.)

export interface RoleDef {
  id: string;
  label: string;
  searchQuery: string;
  chips: string[];
}

export const LOCATION = "India";

export const ROLES: RoleDef[] = [
  { id: "backend", label: "Backend Developer", searchQuery: "backend developer jobs India", chips: ["Node.js", "Django", "Spring Boot", ".NET"] },
  { id: "frontend", label: "Frontend Developer", searchQuery: "frontend developer jobs India", chips: ["React", "Angular", "Vue.js"] },
  { id: "data-analyst", label: "Data Analyst", searchQuery: "data analyst jobs India", chips: ["SQL", "Power BI", "Python"] },
  { id: "devops", label: "DevOps Engineer", searchQuery: "devops engineer jobs India", chips: ["Docker", "Kubernetes", "AWS"] },
];
