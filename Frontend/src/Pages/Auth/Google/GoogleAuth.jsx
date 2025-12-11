import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useNavigate } from "react-router-dom";


function GoogleAuth() {
    const navigate = useNavigate();

    const handleLogin = async (clientId) => {

        const id_token = clientId.credential;

        try {
            const res = await axios.post("http://localhost:8000/api/auth/google/", {
                token: id_token,
            });

            localStorage.setItem("token", res.data.access);
            console.log("Logged in:", res.data);
            navigate("/Dashboard")

        } catch (err) {
            console.error("Google Login Error:", err);
        }
    };

    return (
        <div>
            <GoogleLogin
                onSuccess={handleLogin}
                onError={() => console.log("Google Login Failed")}
            />
        </div>
    );
}

export default GoogleAuth;
