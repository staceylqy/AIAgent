import type { Lang, PatientDraft } from "../types";
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
  patient: PatientDraft;
  lang: Lang;
  canCheck: boolean;
  onChange: (patient: PatientDraft) => void;
  onCheck: () => void;
}

function optionsFor<K extends string>(labels: Record<K, Text>, lang: Lang) {
  return (Object.keys(labels) as K[]).map((key) => (
    <option key={key} value={key}>
      {labels[key][lang]}
    </option>
  ));
}

function pleaseSelect(lang: Lang) {
  return <option value="">{ui.pleaseSelect[lang]}</option>;
}

export default function PatientForm({
  patient,
  lang,
  canCheck,
  onChange,
  onCheck,
}: Props) {
  const update = <K extends keyof PatientDraft>(
    field: K,
    value: PatientDraft[K],
  ) => {
    onChange({ ...patient, [field]: value } as PatientDraft);
  };

  return (
    <div className="form">
      <h2>{ui.formTitle[lang]}</h2>
      <label>
        <span>{ui.age[lang]}</span>
        <input
          type="number"
          min={20}
          max={110}
          value={patient.age}
          onChange={(e) =>
            update("age", e.target.value === "" ? "" : Number(e.target.value))
          }
        />
      </label>
      <label>
        <span>{ui.insurance[lang]}</span>
        <select
          value={patient.insurance}
          onChange={(e) => update("insurance", e.target.value as PatientDraft["insurance"])}
        >
          {pleaseSelect(lang)}
          {optionsFor(insuranceLabels, lang)}
        </select>
      </label>
      <label>
        <span>{ui.employment[lang]}</span>
        <select
          value={patient.employment}
          onChange={(e) => update("employment", e.target.value as PatientDraft["employment"])}
        >
          {pleaseSelect(lang)}
          {optionsFor(employmentLabels, lang)}
        </select>
      </label>
      <label>
        <span>{ui.diagnosis[lang]}</span>
        <select
          value={patient.diagnosis}
          onChange={(e) => update("diagnosis", e.target.value as PatientDraft["diagnosis"])}
        >
          {pleaseSelect(lang)}
          {optionsFor(diagnosisLabels, lang)}
        </select>
      </label>
      <label>
        <span>{ui.family[lang]}</span>
        <select
          value={patient.family}
          onChange={(e) => update("family", e.target.value as PatientDraft["family"])}
        >
          {pleaseSelect(lang)}
          {optionsFor(familyLabels, lang)}
        </select>
      </label>
      <label>
        <span>{ui.adl[lang]}</span>
        <select
          value={patient.adl}
          onChange={(e) => update("adl", e.target.value as PatientDraft["adl"])}
        >
          {pleaseSelect(lang)}
          {optionsFor(adlLabels, lang)}
        </select>
      </label>
      <button className="primary" onClick={onCheck} disabled={!canCheck}>
        {ui.check[lang]}
      </button>
      <p className="hint">{ui.formHint[lang]}</p>
    </div>
  );
}
