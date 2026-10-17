import { useState } from "react";
import FamilyHandout from "./components/FamilyHandout";
import MswTimeline from "./components/MswTimeline";
import PatientForm from "./components/PatientForm";
import { programs } from "./data/programs";
import { findMatchingPrograms } from "./eligibility/engine";
import { ui } from "./i18n";
import { getProvider } from "./llm";
import type {
  GeneratedProgram,
  Lang,
  Patient,
  PatientDraft,
} from "./types";

type Tab = "msw" | "family";

interface CheckResult {
  patient: Patient;
  generated: GeneratedProgram[];
}

const emptyPatient: PatientDraft = {
  age: "",
  insurance: "",
  employment: "",
  diagnosis: "",
  family: "",
  adl: "",
};

function isPatientComplete(patient: PatientDraft): patient is Patient {
  return (
    patient.age !== "" &&
    patient.age > 0 &&
    patient.insurance !== "" &&
    patient.employment !== "" &&
    patient.diagnosis !== "" &&
    patient.family !== "" &&
    patient.adl !== ""
  );
}

export default function App() {
  const [lang, setLang] = useState<Lang>("ja");
  const [patient, setPatient] = useState<PatientDraft>(emptyPatient);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<Tab>("msw");

  const handleFieldChange = (next: PatientDraft) => {
    setPatient(next);
  };

  const handleCheck = async () => {
    if (!isPatientComplete(patient)) return;
    const matched = findMatchingPrograms(patient, programs);
    const generated = await getProvider().generate(patient, matched);
    setResult({ patient, generated });
    setEdits({});
    setTab("msw");
  };

  const handleEdit = (key: string, value: string) => {
    setEdits((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="app">
      <header className="header no-print">
        <div>
          <h1>{ui.appTitle[lang]}</h1>
          <p className="tagline">{ui.tagline[lang]}</p>
        </div>
        <div className="header-controls">
          <button
            className="lang-toggle"
            onClick={() => setLang(lang === "ja" ? "en" : "ja")}
          >
            {lang === "ja" ? "English" : "日本語"}
          </button>
        </div>
      </header>
      <main className="layout">
        <section className="panel form-panel no-print">
          <PatientForm
            patient={patient}
            lang={lang}
            canCheck={isPatientComplete(patient)}
            onChange={handleFieldChange}
            onCheck={handleCheck}
          />
        </section>
        <section className="panel results-panel">
          {result === null ? (
            <p className="placeholder">{ui.placeholder[lang]}</p>
          ) : (
            <div className="results">
              <div className="tabs no-print">
                <button
                  className={tab === "msw" ? "tab active" : "tab"}
                  onClick={() => setTab("msw")}
                >
                  {ui.tabMsw[lang]} ({result.generated.length})
                </button>
                <button
                  className={tab === "family" ? "tab active" : "tab"}
                  onClick={() => setTab("family")}
                >
                  {ui.tabFamily[lang]}
                </button>
              </div>
              {tab === "msw" ? (
                <MswTimeline
                  lang={lang}
                  generated={result.generated}
                  patient={result.patient}
                />
              ) : (
                <FamilyHandout
                  lang={lang}
                  generated={result.generated}
                  edits={edits}
                  onEdit={handleEdit}
                />
              )}
            </div>
          )}
        </section>
      </main>
      <footer className="footer no-print">{ui.disclaimer[lang]}</footer>
    </div>
  );
}
