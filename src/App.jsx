import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Overview from "./views/Overview";
import { T } from "./tokens";

function App() {
  const [active, setActive] = useState("overview");

  return (
    <div
      style={{
        display: "flex",
        background: T.bgDeep,
        minHeight: "100vh",
        color: T.textPrimary,
        fontFamily: T.fontDisplay
      }}
    >
      {/* Sidebar */}
      <Sidebar active={active} setActive={setActive} />

      {/* Main Content */}
      <div style={{ flex: 1, padding: "40px" }}>
        {active === "overview" && <Overview />}
        {active === "patient" && <h1>Patient Intel</h1>}
        {active === "pillguard" && <h1>Pill Guard</h1>}
        {active === "analytics" && <h1>Analytics</h1>}
        {active === "alerts" && <h1>Alerts</h1>}
      </div>
    </div>
  );
}

export default App;