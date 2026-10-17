import programsJson from "./programs.json";
import type { Program } from "../types";

export const programs: Program[] = programsJson as unknown as Program[];
