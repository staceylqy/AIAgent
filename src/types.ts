export type Lang = "ja" | "en";

export type InsuranceType =
  | "employees_health"
  | "national_health"
  | "elderly";

export type Employment = "employed" | "self_employed" | "not_employed";

export type Diagnosis =
  | "cerebral_infarction"
  | "cerebral_hemorrhage"
  | "subarachnoid_hemorrhage";

export type FamilySituation = "with_family" | "alone";

export type AdlLevel = "independent" | "support_needed" | "care_needed";

export interface Patient {
  age: number;
  insurance: InsuranceType;
  employment: Employment;
  diagnosis: Diagnosis;
  family: FamilySituation;
  adl: AdlLevel;
}

export type Phase = "now" | "during_stay" | "after_discharge";

export type ConditionOp =
  | "eq"
  | "neq"
  | "in"
  | "nin"
  | "lt"
  | "lte"
  | "gt"
  | "gte";

export interface Condition {
  field: keyof Patient;
  op: ConditionOp;
  value?: string | number;
  values?: (string | number)[];
}

export interface ConditionGroup {
  all?: RuleNode[];
  any?: RuleNode[];
}

export type RuleNode = Condition | ConditionGroup;

export interface SourceRef {
  labelJa: string;
  labelEn: string;
  url: string;
}

export interface Program {
  id: string;
  nameJa: string;
  nameEn: string;
  phase: Phase;
  source: SourceRef;
  conditions: ConditionGroup;
  reasonJa: string;
  reasonEn: string;
  plainJa: string;
  plainEn: string;
  todoJa?: string;
  todoEn?: string;
}

export interface GeneratedProgram {
  program: Program;
  reasonJa: string;
  reasonEn: string;
  plainJa: string;
  plainEn: string;
}

export interface Persona {
  id: string;
  labelJa: string;
  labelEn: string;
  profileJa: string;
  profileEn: string;
  patient: Patient;
}
