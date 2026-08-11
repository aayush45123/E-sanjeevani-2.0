# Dataset Provenance & Source Documentation

## Data Type
**Curated/Synthetic** — This dataset was programmatically constructed from authoritative clinical
symptom descriptions published by WHO and peer-reviewed medical references. It does **not** represent
real patient records. Each row represents a clinically plausible symptom combination derived from
published disease descriptions.

This approach is academically honest and must be cited as:
> "A curated symptom-feature dataset constructed from WHO clinical guidelines, used for
> fever differential assessment model development."

---

## Primary Source — World Health Organization (WHO)

### Dengue
- **WHO Dengue Fact Sheet**: https://www.who.int/news-room/fact-sheets/detail/dengue-and-severe-dengue
- Key symptoms cited: High fever (40°C), severe headache, pain behind the eyes, muscle and joint pain,
  nausea, vomiting, swollen glands, rash
- Warning signs (severe dengue): severe abdominal pain, persistent vomiting, rapid breathing,
  bleeding gums or nose, fatigue, restlessness, blood in vomit

### Malaria
- **WHO Malaria Fact Sheet**: https://www.who.int/news-room/fact-sheets/detail/malaria
- Key symptoms cited: Fever, headache, chills — appearing within 10-15 days of infective bite
- WHO emphasis: "Early symptoms may be mild and difficult to recognize as malaria"
- WHO emphasis: Prompt diagnostic testing required when malaria is suspected

### Typhoid Fever
- **WHO Typhoid Fact Sheet**: https://www.who.int/news-room/fact-sheets/detail/typhoid
- Key symptoms cited: Prolonged high fever, weakness, stomach pain, headache, diarrhoea or
  constipation, nausea, sometimes rash
- Characteristic: Sustained (not cyclical) fever, often with relative bradycardia

### Chikungunya
- **WHO Chikungunya Fact Sheet**: https://www.who.int/news-room/fact-sheets/detail/chikungunya
- Key symptoms cited: Fever (sudden onset), severe joint pain, muscle pain, headache, nausea,
  fatigue, rash
- WHO emphasis: "Joint pain is often debilitating and can vary in duration"
- Hallmark: Severe arthralgia often persisting after fever resolves

### Viral/Influenza-Like Illness
- **WHO Influenza Fact Sheet**: https://www.who.int/news-room/fact-sheets/detail/influenza-(seasonal)
- Key symptoms cited: Sudden onset of fever, cough, headache, muscle and joint pain, malaise,
  sore throat, runny nose
- Note: Used as the "Viral Fever" class representing common influenza-like illness

---

## Symptom Feature Rationale

| Feature | Disease Association | Rationale |
|---|---|---|
| `pain_behind_eyes` | Dengue | Retro-orbital pain is a well-documented, relatively specific Dengue feature |
| `severe_joint_pain` | Chikungunya | WHO specifically describes "debilitating" joint pain as hallmark |
| `chills` | Malaria | Cyclical fever-chills-sweat pattern characteristic of malaria |
| `constipation` | Typhoid | WHO notes constipation/diarrhoea; constipation more common in early typhoid |
| `runny_nose` / `sore_throat` | Viral Fever | Upper respiratory symptoms distinguish viral fever from vector-borne diseases |
| `sweating` | Malaria | Part of the classic malaria fever cycle |
| `sudden_onset` | Dengue, Chikungunya | Both characterized by abrupt onset |

---

## Dataset Construction Method

See `scripts/generate_dataset.py` for the full generation code.

**Approach:**
1. Define a **clinical profile** for each disease (primary + secondary symptoms from WHO)
2. Generate **300 base rows per disease** with primary symptoms present
3. Apply **controlled variation** — randomly absent secondary symptoms (mimicking symptom presentation variability in real patients)
4. Add **negative overlap control** — rare symptoms from other diseases occasionally appear (reflecting real-world diagnostic ambiguity)
5. Total: **1,500 rows** (balanced classes)

**This is NOT:**
- Real patient data
- Data from any real electronic health record
- Fabricated to claim clinical validity

---

## Disclaimer

This dataset and the resulting model are for **educational and research demonstration purposes only**.
The model provides a differential assessment (ranked possibilities) — not a clinical diagnosis.
Dengue, malaria, and chikungunya in particular share substantial symptom overlap, and WHO explicitly
notes these cannot be reliably distinguished without appropriate laboratory testing.
