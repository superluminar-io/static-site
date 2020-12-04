import React from "react";
import logo from "./logo.svg";
import "./App.css";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Example project to show howto built CI/CD for a static Website via cdk.
        </p>
        <p>
        Hosted <a href="https://static-site.alst.superluminar.io">here</a>.
        </p>
        <p>
          See <a href="https://superluminar.io/blog//2020/12/04/static-websites-with-aws-cdk">superluminar.io Blog</a> for further explanation.
        </p>
      </header>
    </div>
  );
}

export default App;
