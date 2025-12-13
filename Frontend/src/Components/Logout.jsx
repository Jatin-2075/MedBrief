const Logout = () => {
    const handleLogout = async () => {
        try {
            const res = await fetch("http://127.0.0.1:8000/logout/", {
                method: "POST",
                credentials: "include",
            });

            if (!res.ok) {
                throw new Error("Logout failed");
            }

            const data = await res.json();

            if (data.success) {
                alert("Logged out");
                window.location.href = "/Login";
            } else {
                alert(data.msg || "Logout error");
            }
        } catch (err) {
            alert("Server not reachable");
        }
    };

    return <button className="Logout-btn" onClick={handleLogout}>Logout</button>;
};

export default Logout;
