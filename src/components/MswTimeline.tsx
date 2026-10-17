import type { GeneratedProgram, Lang, Patient, Phase } from "../types";
import {
  adlLabels,
  diagnosisLabels,
  employmentLabels,
  familyLabels,
  insuranceLabels,
  phaseLabels,
  ui,
} from "../i18n";

const phaseOrder: Phase[] = ["now", "during_stay", "after_discharge"];

interface Props {
  lang: Lang;
  generated: GeneratedProgram[];
  patient: Patient;
}

export default function MswTimeline({ lang, generated, patient }: Props) {
  const groups = phaseOrder
    .map((phase) => ({
      phase,
      items: generated.filter((g) => g.program.phase === phase),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="msw-timeline">
      <div className="patient-summary">
        <strong>{ui.patientSummary[lang]}</strong>
        <p>
          {patient.age}
          {ui.ageUnit[lang]}・{insuranceLabels[patient.insurance][lang]}・
          {employmentLabels[patient.employment][lang]}・
          {diagnosisLabels[patient.diagnosis][lang]}・
          {familyLabels[patient.family][lang]}・{ui.adlShort[lang]}:{" "}
          {adlLabels[patient.adl][lang]}
        </p>
      </div>
      {groups.length === 0 ? (
        <p className="placeholder">{ui.noResults[lang]}</p>
      ) : (
        groups.map((group) => (
          <section key={group.phase} className="phase-group">
            <h3 className={`phase-heading phase-${group.phase}`}>
              {phaseLabels[group.phase][lang]}
            </h3>
            <ul className="program-list">
              {group.items.map((g) => (
                <li key={g.program.id} className="program-card">
                  <div className="program-card-head">
                    <strong>
                      {lang === "ja" ? g.program.nameJa : g.program.nameEn}
                    </strong>
                    <a
                      href={g.program.source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="source-link"
                    >
                      {lang === "ja"
                        ? g.program.source.labelJa
                        : g.program.source.labelEn}{" "}
                      ↗
                    </a>
                  </div>
                  <p>{lang === "ja" ? g.reasonJa : g.reasonEn}</p>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
