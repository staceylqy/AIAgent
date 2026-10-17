import type {
  Condition,
  ConditionGroup,
  Patient,
  Program,
  RuleNode,
} from "../types";

function fieldValue(patient: Patient, field: keyof Patient): string | number {
  return patient[field] as string | number;
}

function evalCondition(condition: Condition, patient: Patient): boolean {
  const left = fieldValue(patient, condition.field);
  switch (condition.op) {
    case "eq":
      return left === condition.value;
    case "neq":
      return left !== condition.value;
    case "in":
      return (condition.values ?? []).some((v) => v === left);
    case "nin":
      return !(condition.values ?? []).some((v) => v === left);
    case "lt":
      return (left as number) < (condition.value as number);
    case "lte":
      return (left as number) <= (condition.value as number);
    case "gt":
      return (left as number) > (condition.value as number);
    case "gte":
      return (left as number) >= (condition.value as number);
    default:
      return false;
  }
}

function isCondition(node: RuleNode): node is Condition {
  return "field" in node;
}

export function evalRule(node: RuleNode, patient: Patient): boolean {
  if (isCondition(node)) {
    return evalCondition(node, patient);
  }
  const group = node as ConditionGroup;
  if (group.all) {
    return group.all.every((child) => evalRule(child, patient));
  }
  if (group.any) {
    return group.any.some((child) => evalRule(child, patient));
  }
  return false;
}

export function findMatchingPrograms(
  patient: Patient,
  programs: Program[],
): Program[] {
  return programs.filter((program) => evalRule(program.conditions, patient));
}
