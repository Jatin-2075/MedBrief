import { useState } from "react";
import api from "../../Auth/api";

function Signup() {
  const [email, setEmail] = useState("");
  const [username, setUser] = useState("");
  const [password, setPass] = useState("");

  const submit = async () => {
    await api.post("/api/user/register", { email, username, password });
    alert("Registered!");
  };

  return (
    <div>
      <h2>Register</h2>

      <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} /><br />
      <input placeholder="Username" onChange={(e) => setUser(e.target.value)} /><br />
      <input placeholder="Password" type="password" onChange={(e) => setPass(e.target.value)} /><br />

      <button onClick={submit}>Register</button>
    </div>
  );
}

export default Signup;