import { useEffect } from "react";
import { useAuth } from "./AuthContext";

export default function GoogleCallback() {
    const { login } = useAuth();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const access = params.get("access_token");

        if (access) {
            login(access);
            window.location.href = "/dashboard";
        }
    }, []);

    return <h2>Finishing Google Login...</h2>;
}
