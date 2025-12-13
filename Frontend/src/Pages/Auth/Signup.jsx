import { useState } from "react";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const HandleSubmit = async () => {
    if (!username || !email || !password) {
      alert("All fields required");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const form = new FormData();
      form.append("username", username);
      form.append("email", email);
      form.append("password", password);

      const res = await fetch("http://127.0.0.1:8000/signup/", {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (data.success) {
        alert("Account created");
        window.location.href = "/Login"; 
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
      <h3>Signup page</h3>

      <label>Username</label>
      <input onChange={(e) => setUsername(e.target.value)} />

      <label>Email</label>
      <input onChange={(e) => setEmail(e.target.value)} />

      <label>Password</label>
      <input type="password" onChange={(e) => setPassword(e.target.value)} />

      <label>Confirm Password</label>
      <input
        type="password"
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      <button onClick={HandleSubmit}>Submit</button>
    </div>
  );
};

export default Signup;
