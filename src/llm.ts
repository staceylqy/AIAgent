import type { GeneratedProgram, Lang, Patient, Program } from "./types";
import {
  adlLabels,
  diagnosisLabels,
  employmentLabels,
  familyLabels,
  insuranceLabels,
} from "./i18n";

export interface LlmProvider {
  name: string;
  generate(
    patient: Patient,
    programs: Program[],
  ): Promise<GeneratedProgram[]>;
}

function patientTokens(
  patient: Patient,
): Record<Lang, Record<string, string>> {
  return {
    ja: {
      age: String(patient.age),
      insurance: insuranceLabels[patient.insurance].ja,
      employment: employmentLabels[patient.employment].ja,
      diagnosis: diagnosisLabels[patient.diagnosis].ja,
      family: familyLabels[patient.family].ja,
      adl: adlLabels[patient.adl].ja,
    },
    en: {
      age: String(patient.age),
      insurance: insuranceLabels[patient.insurance].en,
      employment: employmentLabels[patient.employment].en,
      diagnosis: diagnosisLabels[patient.diagnosis].en,
      family: familyLabels[patient.family].en,
      adl: adlLabels[patient.adl].en,
    },
  };
}

function fill(template: string, tokens: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => tokens[key] ?? "");
}

const mockProvider: LlmProvider = {
  name: "mock",
  async generate(patient, programs) {
    const tokens = patientTokens(patient);
    return programs.map((program) => ({
      program,
      reasonJa: fill(program.reasonJa, tokens.ja),
      reasonEn: fill(program.reasonEn, tokens.en),
      plainJa: fill(program.plainJa, tokens.ja),
      plainEn: fill(program.plainEn, tokens.en),
    }));
  },
};

export function getProvider(): LlmProvider {
  return mockProvider;
}
