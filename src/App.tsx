import AppBar from "./components/appBar";
import "./App.css";
import { useState } from "react";
import Menu from "./components/menu";
import SelectComponent from "./components/select/Select";

export default function App() {
  const model = ["CSS", "PostCSS"];
  const [selected, setSelected] = useState(model[0]);

  return (
    <div>
      <AppBar
        MenuComponent={
          <SelectComponent />
        }
      />
    </div>
  );
}
