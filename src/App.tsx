import { useEffect, useState } from "react";
import FamilyHandout from "./components/FamilyHandout";
import MswTimeline from "./components/MswTimeline";
import PatientForm from "./components/PatientForm";
import { personas } from "./data/personas";
import { programs } from "./data/programs";
import { findMatchingPrograms } from "./eligibility/engine";
import { ui } from "./i18n";
import { getProvider } from "./llm";
import { ShareProvider, useShare } from "./share/ShareContext";
import type { GeneratedProgram, Lang, Patient, Persona } from "./types";

type Tab = "msw" | "family";

function AppScreen() {
  const [lang, setLang] = useState<Lang>("ja");
  const [patient, setPatient] = useState<Patient>(personas[0].patient);
  const [activePersona, setActivePersona] = useState<Persona | null>(
    personas[0],
  );
  const [generated, setGenerated] = useState<GeneratedProgram[] | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<Tab>("msw");
  const { unread, markSeen } = useShare();

  // ご家族タブを開いている間は新着バッジを確認済みにする
  useEffect(() => {
    if (tab === "family") markSeen();
  }, [tab, unread, markSeen]);

  const handleFieldChange = (next: Patient) => {
    setPatient(next);
    setActivePersona(null);
  };

  const handlePersona = (persona: Persona) => {
    setPatient(persona.patient);
    setActivePersona(persona);
    setGenerated(null);
    setEdits({});
  };

  const handleCheck = async () => {
    const matched = findMatchingPrograms(patient, programs);
    const result = await getProvider().generate(patient, matched);
    setGenerated(result);
    setEdits({});
    setTab("msw");
  };

  const handleEdit = (key: string, value: string) => {
    setEdits((prev) => ({ ...prev, [key]: value }));
  };

  const personaProfile = activePersona
    ? lang === "ja"
      ? activePersona.profileJa
      : activePersona.profileEn
    : undefined;

  return (
    <div className="app">
      <header className="header no-print">
        <div>
          <h1>{ui.appTitle[lang]}</h1>
          <p className="tagline">{ui.tagline[lang]}</p>
        </div>
        <div className="header-controls">
          {personas.map((persona) => (
            <button
              key={persona.id}
              className={
                activePersona?.id === persona.id
                  ? "persona-button active"
                  : "persona-button"
              }
              onClick={() => handlePersona(persona)}
            >
              {lang === "ja" ? persona.labelJa : persona.labelEn}
            </button>
          ))}
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
            personaProfile={personaProfile}
            onChange={handleFieldChange}
            onCheck={handleCheck}
          />
        </section>
        <section className="panel results-panel">
          {generated === null ? (
            <p className="placeholder">{ui.placeholder[lang]}</p>
          ) : (
            <div className="results">
              <div className="tabs no-print">
                <button
                  className={tab === "msw" ? "tab active" : "tab"}
                  onClick={() => setTab("msw")}
                >
                  {ui.tabMsw[lang]} ({generated.length})
                </button>
                <button
                  className={tab === "family" ? "tab active" : "tab"}
                  onClick={() => setTab("family")}
                >
                  {ui.tabFamily[lang]}
                  {unread > 0 && <span className="tab-badge">{unread}</span>}
                </button>
              </div>
              {tab === "msw" ? (
                <MswTimeline lang={lang} generated={generated} patient={patient} />
              ) : (
                <FamilyHandout
                  lang={lang}
                  generated={generated}
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

export default function App() {
  return (
    <ShareProvider>
      <AppScreen />
    </ShareProvider>
  );
}
