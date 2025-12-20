import { useState } from "react";
import "../Style/SmartHelp.css";
import { API_BASE_URL } from "../config/api";


const Smart_help = () => {
    const [selected, setSelected] = useState("");
    const [WorkoutLevel, SetWorkoutLevel] = useState("beginner")
    const [WorkoutType, SetWorkoutType] = useState("strength")


    const [BMI, setBMI] = useState("");
    const [DietData, setDietData] = useState(null);
    const accessToken = localStorage.getItem("access_token");



    const [WorkoutData, SetWorkoutData] = useState({})

    const HandleSubmit = async () => {
        if (!selected) return alert("Please select an option first.");

        try {
            const res = await fetch(`${API_BASE_URL}/Smart_Help/`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    know: selected,
                    Workoutlevel: WorkoutLevel,
                    WorkoutType: WorkoutType,
                    bmi: BMI,
                })
            });

            // 1. Validate Content-Type to prevent parsing HTML as JSON
            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Server crashed and sent an HTML error page.");
            }

            const data = await res.json();

            // 2. Handle Logic Errors (502, 400, etc.)
            if (!res.ok || !data.success) {
                alert(data.msg || "An error occurred on the server.");
                return;
            }

            // 3. Update States
            if (data.type === "workout") {
                SetWorkoutData(data);
                setDietData(null);
            } else if (data.type === "diet") {
                setDietData(data.data);
                SetWorkoutData({});
            }

        } catch (err) {
            console.error("Frontend Critical Error:", err);
            alert("Failed to communicate with the server. Please check the console.");
        }
    };


    return (
        <div className="ai-layout simple-mode">
            <main className="ai-main">
                <h1>Smart Help</h1>
                <p>Health • Lifestyle • Guidance</p>

                <div className="options">
                    <button className={selected === "workout" ? "active" : ""} onClick={() => setSelected("workout")}>Workout</button>

                    <button className={selected === "diet" ? "active" : ""} onClick={() => setSelected("diet")}>Diet</button>

                    <button className={selected === "help" ? "active" : ""} onClick={() => setSelected("help")}>Help</button>
                </div>



                <div>
                    {selected == 'workout' && <div>
                        <div>
                            <label>Level</label>
                            <select value={WorkoutLevel} onChange={(e) => SetWorkoutLevel(e.target.value)}>
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="hard">Hard</option>
                            </select>

                        </div>
                        <div>
                            <label>Type</label>
                            <select value={WorkoutType} onChange={(e) => SetWorkoutType(e.target.value)}>
                                <option value="strength">strength</option>
                                <option value="cardio">cardio</option>
                                <option value="plyometrics">plyometrics</option>
                                <option value="powerlifting">powerlifting</option>
                                <option value="olympic_weightlifting">olympic_weightlifting</option>
                                <option value="strongman">strongman</option>
                                <option value="calisthenics">calisthenics</option>
                            </select>



                        </div>
                    </div>}

                    {selected === "diet" && (
                        <div>
                            <label>BMI</label>
                            <input type="number" step="0.1" value={BMI} onChange={(e) => setBMI(e.target.value)} placeholder="Enter BMI" />
                        </div>
                    )}


                    <button onClick={HandleSubmit}>Submit</button>

                    {WorkoutData?.data && Array.isArray(WorkoutData.data) && (
                        <div style={{ marginTop: "20px" }}>
                            <h2>Workout Suggestions</h2>

                            {WorkoutData.data.slice(0, 5).map((item, index) => (
                                <div key={index}>
                                    <h3>{item.name}</h3>

                                    <p><b>Type:</b> {item.type}</p>
                                    <p><b>Muscle:</b> {item.muscle}</p>
                                    <p><b>Difficulty:</b> {item.difficulty}</p>

                                    <p><b>Instructions:</b></p>
                                    <p>{item.instructions}</p>
                                </div>
                            ))}
                        </div>
                    )}


                    {DietData && (
                        <div style={{ marginTop: "20px" }}>
                            <h2>{DietData.goal}</h2>
                            <p><b>BMI:</b> {DietData.bmi}</p>

                            {DietData.foods.slice(0, 5).map((food, index) => (
                                <div
                                    key={index}
                                    style={{
                                        border: "1px solid #ddd",
                                        padding: "12px",
                                        marginBottom: "10px",
                                        borderRadius: "6px",
                                        background: "#fafafa"
                                    }}
                                >
                                    <h4>{food.name}</h4>
                                    <p>Calories: {food.calories}</p>
                                    <p>Protein: {food.protein_g} g</p>
                                    <p>Carbs: {food.carbohydrates_total_g} g</p>
                                    <p>Fat: {food.fat_total_g} g</p>
                                </div>
                            ))}
                        </div>
                    )}


                </div>
            </main>
        </div>
    );
};

export default Smart_help;
