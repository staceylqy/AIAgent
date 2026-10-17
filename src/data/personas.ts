import type { Persona } from "../types";

export const personas: Persona[] = [
  {
    id: "persona-a",
    labelJa: "デモA: 52歳・会社員",
    labelEn: "Demo A: 52, employed",
    profileJa:
      "脳梗塞で入院中の事務職員。妻と高校生の娘との3人暮らし。退院時も歩行に軽度の支援が必要な見込み。",
    profileEn:
      "Office worker hospitalized with cerebral infarction. Lives with wife and teenage daughter. Mild support expected for walking at discharge.",
    patient: {
      age: 52,
      insurance: "employees_health",
      employment: "employed",
      diagnosis: "cerebral_infarction",
      family: "with_family",
      adl: "support_needed",
    },
  },
  {
    id: "persona-b",
    labelJa: "デモB: 78歳・一人暮らし",
    labelEn: "Demo B: 78, living alone",
    profileJa:
      "脳出血で入院中の高齢者。基礎年金のみで暮らす一人暮らし。退院後も介護が必要な見込み。",
    profileEn:
      "Elderly patient hospitalized with cerebral hemorrhage. Lives alone on a basic pension. Ongoing care expected after discharge.",
    patient: {
      age: 78,
      insurance: "elderly",
      employment: "not_employed",
      diagnosis: "cerebral_hemorrhage",
      family: "alone",
      adl: "care_needed",
    },
  },
];
