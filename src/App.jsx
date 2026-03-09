import { useState } from "react";
import Overview from "./views/Overview";
import PatientIntel from "./views/PatientIntel";
import Sidebar from "./components/Sidebar";
import { PATIENTS } from "./mockData";
import { T } from "./tokens";

function App() {
  const [active, setActive] = useState("overview");
  const [activePatient, setActivePatient] = useState(PATIENTS[0]);

  return (
    <div
      style={{
        display: "flex",
        background: T.bgMain,
        minHeight: "100vh",
        color: T.textPrimary,
        fontFamily: T.fontDisplay
      }}
    >
      {/* Sidebar */}
      <Sidebar active={active} setActive={setActive} />

      {/* Main Content */}
      <div style={{ flex: 1, padding: "40px" }}>
        {active === "overview" && (
          <Overview
            setActivePatient={setActivePatient}
            goToPatient={() => setActive("patient")}
          />
        )}
        {active === "patient" && <PatientIntel patient={activePatient} />}
        {active === "pillguard" && <h1>Pill Guard</h1>}
        {active === "analytics" && <h1>Analytics</h1>}
        {active === "alerts" && <h1>Alerts</h1>}
      </div>
    </div>
  );
}

export default App;