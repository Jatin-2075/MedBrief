import React from "react";
import Navbar from "../Components/Navbar";
import Footer from "../Components/Footer";
import '../Style/help.css'

const Help = () => {

    return (
        <div className="help-container">

            <header className="help-header">
                <h1>Need Help?</h1>
                <p>Your guide to using SmartZen smoothly.</p>
            </header>

            <section className="help-section">
                <h2>📄 Uploading Medical Reports</h2>
                <p>
                    You can upload your medical files in <strong>PDF</strong> or <strong>DOCX</strong> format.
                    Maximum allowed size is <strong>10 MB</strong>.
                </p>
                <ul>
                    <li>Go to “Uploads” section</li>
                    <li>Select your file</li>
                    <li>Submit & SmartZen will analyze it automatically</li>
                </ul>
            </section>

            <section className="help-section">
                <h2>🤖 Using Smart Helper</h2>
                <p>Ask anything related to your health reports or recommendations.</p>
                <ul>
                    <li>Describe symptoms</li>
                    <li>Ask follow-up questions</li>
                    <li>Request analysis summaries</li>
                </ul>
            </section>

            <section className="help-section">
                <h2>📊 Understanding Dashboard</h2>
                <p>Your dashboard gives you:</p>
                <ul>
                    <li>Recent uploads</li>
                    <li>AI-generated health insights</li>
                    <li>History of analyzed reports</li>
                </ul>
            </section>

            <section className="help-section">
                <h2>🔐 Privacy & Security</h2>
                <p>
                    Your data is encrypted and stored securely. SmartZen never shares personal
                    information with third parties.
                </p>
            </section>

            <section className="help-section contact">
                <h2>📞 Contact Support</h2>
                <p>If you need further help, reach out:</p>
                <p>Email: <strong>support@smartzen.ai</strong></p>
                <p>WhatsApp: <strong>+91 90000 00000</strong></p>
            </section>


        </div>
    )
}

export default Help;