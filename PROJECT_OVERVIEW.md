# E-Sanjeevani 2.0 — Project Overview

### 1. Technology Stack
**E-Sanjeevani 2.0** is built using a modern, multi-tier full-stack architecture that combines a responsive frontend, a high-performance backend, a relational cloud database, and a dedicated AI microservice. The user interface is developed with **React 19**, **Vite**, and modular CSS, enhanced with **Recharts** for interactive visual analytics and **Lucide Icons** for a clean clinical UI. The backend is powered by **Node.js** and **Express 5**, leveraging **Socket.io** to manage real-time WebRTC audio/video consultation signaling and live notifications, alongside **PDFKit** for automated medical prescription generation. Data is persisted in a serverless **PostgreSQL** database (hosted on Neon) managed through **Drizzle ORM** for type-safe database queries and migrations. Finally, the machine learning capabilities run on an independent **Python Flask** microservice that serves classical ML models, explainability tools, and Large Language Model (LLM) clinical chat integrations.

### 2. Core Features & Capabilities
The platform provides an end-to-end telemedicine ecosystem for both patients and healthcare providers. Patients can access an **Intelligent AI Pre-Triage** system and an interactive conversational assistant to evaluate symptoms and receive home-care advice or clinical referral recommendations. A specialized **Fever Differential Assessment Clinic** evaluates overlapping tropical febrile illnesses (such as Dengue, Malaria, Typhoid, and Chikungunya) while highlighting critical red-flag emergency symptoms. For consultations, the platform offers seamless browser-based **WebRTC Video Consultations** equipped with an in-call AI clinical assistant pane to aid doctors in real time. Additionally, the system includes dynamic **Doctor Scheduling & Appointment Booking**, a first-class **Digital Prescription Management** tool with downloadable PDF summaries, and a **Longitudinal Patient Health Record** that tracks ongoing medications, past diagnoses, and laboratory reports over time.

### 3. Machine Learning, Algorithms & Mathematical Formulas
To assist medical decision-making accurately and transparently, E-Sanjeevani 2.0 incorporates specialized algorithms backed by clear mathematical formulas:

- **General Disease Classifier (ExtraTrees & Random Forest Ensemble)**: Uses tree-based ensemble learning trained on comprehensive symptom-disease datasets (covering 40+ disease categories) to predict likely conditions from reported symptoms.
- **Fever Differential Model (XGBoost / Gradient Boosting)**: A high-precision classifier that outputs the top-3 ranked fever diagnoses with probability confidence scores.
- **Rule-Based Clinical Urgency Scoring Formula**: Calculates an objective patient severity score (1–10 scale) before booking by evaluating symptoms, chronic conditions, and age risk factors:
  $$\text{Urgency Score} = \sum \text{Symptom Weights} + \sum \text{Comorbidity Additions} + \text{Age Risk Factor}$$
  - *Symptom Weights*: Critical symptoms (e.g., chest pain, breathing difficulty, bleeding) add $+10$ each; high-severity symptoms (e.g., high fever, severe abdominal pain) add $+7$; moderate symptoms add $+4$; and mild symptoms add $+1$.
  - *Comorbidity Additions*: High-risk history (diabetes, hypertension, asthma, cardiac issues) adds $+2$ to $+3$ each.
  - *Age Risk Factor*: Vulnerable ages ($<5$ or $>65$ years) add $+2$.
  - *Urgency Normalization*:
    $$U_{\text{norm}} = \min\left(\frac{\text{Urgency Score}}{10},\, 1.0\right)$$
- **5-Factor Dynamic Doctor Matching Utility Formula**: Replaces slow first-come-first-serve queues by ranking doctors based on urgency, specialty, availability, language, and experience:
  $$\text{Priority Score} = 0.40 \cdot U_{\text{norm}} + 0.25 \cdot S_{\text{match}} + 0.20 \cdot A_{\text{score}} + 0.10 \cdot L_{\text{score}} + 0.05 \cdot E_{\text{norm}}$$
  - $U_{\text{norm}}$ ($40\%$): Normalized patient urgency score ensuring emergency cases get top priority.
  - $S_{\text{match}}$ ($25\%$): Specialty relevance ($1.0$ for exact specialty match like Cardiologist/Pulmonologist; $0.5$ for General Physician).
  - $A_{\text{score}}$ ($20\%$): Doctor availability ($1.0$ for $\le 12$h, $0.9$ for $\le 24$h, decaying smoothly for later slots).
  - $L_{\text{score}}$ ($10\%$): Language compatibility ($1.0$ if patient and doctor share spoken languages; $0.8$ baseline).
  - $E_{\text{norm}}$ ($5\%$): Doctor clinical experience normalized as $\min(\text{Experience in Years} / 20,\, 1.0)$.
- **Explainable AI (SHAP — SHapley Additive exPlanations)**: Utilizes game-theoretic Shapley values to calculate the exact positive or negative contribution ($\phi_i$) of each individual patient symptom $i$ toward a diagnosed disease:
  $$\phi_i(f, x) = \sum_{S \subseteq F \setminus \{i\}} \frac{|S|!(|F| - |S| - 1)!}{|F|!} \left[ f(S \cup \{i\}) - f(S) \right]$$
  *In simple terms*: This measures how the predicted probability changes when symptom $i$ is present versus absent across all possible combinations of symptoms, producing transparent visual contribution charts for doctors.

### 4. Human-in-the-Loop Clinical Safety
The entire platform is designed around a **human-in-the-loop** medical philosophy. Rather than replacing doctors, the AI serves as an intelligent triage and decision-support assistant that categorizes mild cases for self-care and escalates severe cases to human specialists with rich background data. All AI predictions are transparently explained with SHAP feature breakdowns and confidence metrics, ensuring that doctors retain complete clinical authority and finalize all formal medical prescriptions and treatments.
