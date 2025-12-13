import { useState } from "react";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const HandleSubmit = async () => {
    if (!username || !password) {
      alert("All fields required");
      return;
    }

    try {
      const form = new FormData();
      form.append("username", username);
      form.append("password", password);

      const res = await fetch("http://127.0.0.1:8000/login/", {
        method: "POST",
        body: form,
        credentials: "include",
      });

      const data = await res.json();

      if (data.success) {
        window.location.href = "/Dashboard";
      } else {
        alert(data.msg);
      }
    } catch (err) {
      alert("Server error");
    }
  };

  return (
    <div>
      <h1>Skillsync</h1>
      <h3>Login page</h3>

      <label>Username</label>
      <input onChange={(e) => setUsername(e.target.value)} />

      <label>Password</label>
      <input type="password" onChange={(e) => setPassword(e.target.value)} />

      <button onClick={HandleSubmit}>Submit</button>
    </div>
  );
};

export default Login;
