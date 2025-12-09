import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "./Firebase";
import '../../../Style/signup.css'

const GoogleLogin = () => {
    const handleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            console.log("User:", result.user);
        } 
        catch (err) {
            console.error("Login error:", err.message);
        }
    };

    return (
        <button className="BTnofgoogle" onClick={handleLogin}>Google</button>
    );
};

export default GoogleLogin;