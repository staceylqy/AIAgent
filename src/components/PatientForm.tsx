import type { Lang, Patient } from "../types";
import {
  adlLabels,
  diagnosisLabels,
  employmentLabels,
  familyLabels,
  insuranceLabels,
  ui,
  type Text,
} from "../i18n";

interface Props {
  patient: Patient;
  lang: Lang;
  personaProfile?: string;
  onChange: (patient: Patient) => void;
  onCheck: () => void;
}

function optionsFor<K extends string>(labels: Record<K, Text>, lang: Lang) {
  return (Object.keys(labels) as K[]).map((key) => (
    <option key={key} value={key}>
      {labels[key][lang]}
    </option>
  ));
}

export default function PatientForm({
  patient,
  lang,
  personaProfile,
  onChange,
  onCheck,
}: Props) {
  const update = <K extends keyof Patient>(
    field: K,
    value: Patient[K],
  ) => {
    onChange({ ...patient, [field]: value } as Patient);
  };

  return (
    <div className="form">
      <h2>{ui.formTitle[lang]}</h2>
      {personaProfile ? <p className="persona-profile">{personaProfile}</p> : null}
      <label>
        <span>{ui.age[lang]}</span>
        <input
          type="number"
          min={20}
          max={110}
          value={patient.age}
          onChange={(e) => update("age", Number(e.target.value) || 0)}
        />
      </label>
      <label>
        <span>{ui.insurance[lang]}</span>
        <select
          value={patient.insurance}
          onChange={(e) => update("insurance", e.target.value as Patient["insurance"])}
        >
          {optionsFor(insuranceLabels, lang)}
        </select>
      </label>
      <label>
        <span>{ui.employment[lang]}</span>
        <select
          value={patient.employment}
          onChange={(e) => update("employment", e.target.value as Patient["employment"])}
        >
          {optionsFor(employmentLabels, lang)}
        </select>
      </label>
      <label>
        <span>{ui.diagnosis[lang]}</span>
        <select
          value={patient.diagnosis}
          onChange={(e) => update("diagnosis", e.target.value as Patient["diagnosis"])}
        >
          {optionsFor(diagnosisLabels, lang)}
        </select>
      </label>
      <label>
        <span>{ui.family[lang]}</span>
        <select
          value={patient.family}
          onChange={(e) => update("family", e.target.value as Patient["family"])}
        >
          {optionsFor(familyLabels, lang)}
        </select>
      </label>
      <label>
        <span>{ui.adl[lang]}</span>
        <select
          value={patient.adl}
          onChange={(e) => update("adl", e.target.value as Patient["adl"])}
        >
          {optionsFor(adlLabels, lang)}
        </select>
      </label>
      <button className="primary" onClick={onCheck}>
        {ui.check[lang]}
      </button>
      <p className="hint">{ui.formHint[lang]}</p>
    </div>
  );
}
