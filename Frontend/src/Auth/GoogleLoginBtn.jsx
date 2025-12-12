export default function GoogleLoginBtn() {
    const handleLogin = () => {
        window.location.href = "http://localhost:8000/accounts/google/login/";
    };

    return (
        <button onClick={handleLogin}>Login with Google</button>
    );
}
