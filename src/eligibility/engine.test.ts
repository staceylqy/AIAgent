import { describe, expect, it } from "vitest";
import { programs } from "../data/programs";
import { personas } from "../data/personas";
import type { Patient } from "../types";
import { findMatchingPrograms } from "./engine";

const matchedIds = (patient: Patient) =>
  findMatchingPrograms(patient, programs)
    .map((p) => p.id)
    .sort();

describe("eligibility engine", () => {
  it("matches persona A with the employed-patient programs", () => {
    expect(matchedIds(personas[0].patient)).toEqual([
      "disability_certificate",
      "disability_employees_pension",
      "disability_welfare_services",
      "high_cost_medical",
      "ltc_insurance",
      "sickness_allowance",
    ]);
  });

  it("matches persona B with the elderly-living-alone programs", () => {
    expect(matchedIds(personas[1].patient)).toEqual([
      "disability_certificate",
      "high_cost_medical",
      "ltc_cost_cap",
      "ltc_insurance",
      "public_assistance",
      "special_disability_allowance",
    ]);
  });

  it("produces clearly different results for the two personas", () => {
    expect(matchedIds(personas[0].patient)).not.toEqual(
      matchedIds(personas[1].patient),
    );
  });

  it("does not grant the disability certificate to an independent patient", () => {
    expect(matchedIds({ ...personas[0].patient, adl: "independent" })).not.toContain(
      "disability_certificate",
    );
  });

  it("matches the disability basic pension for an unemployed patient under 65", () => {
    const patient: Patient = {
      age: 60,
      insurance: "national_health",
      employment: "not_employed",
      diagnosis: "cerebral_infarction",
      family: "alone",
      adl: "care_needed",
    };
    expect(matchedIds(patient)).toContain("disability_basic_pension");
  });

  it("excludes the sickness allowance for national health insurance patients", () => {
    const patient: Patient = {
      age: 45,
      insurance: "national_health",
      employment: "self_employed",
      diagnosis: "cerebral_infarction",
      family: "with_family",
      adl: "independent",
    };
    expect(matchedIds(patient)).not.toContain("sickness_allowance");
  });
});
