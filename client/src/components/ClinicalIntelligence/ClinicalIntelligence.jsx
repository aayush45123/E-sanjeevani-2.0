import React from "react";
// Notice the updated paths pointing to the files inside the folders
import CoreInnovation from "./CoreInnovation/CoreInnovation";
import SystemComparison from "./SystemComparison/SystemComparison";
import PatientFlow from "./PatientFlow/PatientFlow";
import styles from "./ClinicalIntelligence.module.css";

const ClinicalIntelligence = () => {
  return (
    <div className={styles.wrapper}>
      <CoreInnovation />
      <SystemComparison />
      <PatientFlow />
    </div>
  );
};

export default ClinicalIntelligence;