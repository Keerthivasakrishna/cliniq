import { useState } from "react";
import Sidebar from "./components/Sidebar";
import { T } from "./tokens";

function App() {
  const [active, setActive] = useState("overview");

  return (
    <div
      style={{
        display: "flex",
        background: T.bgDeep,
        minHeight: "100vh",
        color: T.textPrimary
      }}
    >
      <Sidebar active={active} setActive={setActive} />

      <div style={{ flex: 1, padding: "40px" }}>
        <h1>{active}</h1>
      </div>
    </div>
  );
}

export default App;