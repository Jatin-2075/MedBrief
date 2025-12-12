import { useState } from "react";
import api from "../../Auth/api";
import { useAuth } from "../../Auth/AuthContext";

function Login() {
    const { login } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const submit = async () => {
        const res = await api.post("/api/token/", { username, password });
        login(res.data.access);
        window.location.href = "/dashboard";
    };

    return (
        <div>
            <h2>Login</h2>
            <input placeholder="Username" onChange={(e) => setUsername(e.target.value)} /><br />
            <input placeholder="Password" type="password" onChange={(e) => setPassword(e.target.value)} /><br />
            <button onClick={submit}>Login</button>
        </div>
    );
}

export default Login;