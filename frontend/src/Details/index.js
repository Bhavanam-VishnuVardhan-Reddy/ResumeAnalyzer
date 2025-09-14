
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import styles from "./index.css";

function Details() {
    const { id } = useParams();
    const [details, setDetails] = useState({});
    const [errMsg, setErrMsg] = useState("");

    useEffect(() => {
        async function getDetails(resumeId) {
            try {
                const response = await fetch(`http://127.0.0.1:8000/api/resumes/${resumeId}`);
                if (response.ok) {
                    const data = await response.json();
                    const resumeDetails = data.body;
                    const updatedDetails = {
                        name: resumeDetails.name || "N/A",
                        email: resumeDetails.email || "N/A",
                        phone: resumeDetails.phone || "N/A",
                        skills: resumeDetails.skills || "N/A",
                        extractedData: resumeDetails.extracted_data || "N/A",
                        llmAnalysis: resumeDetails.llm_analysis || "N/A"
                    };
                    setDetails(updatedDetails);
                } else {
                    setErrMsg("Failed to fetch details");
                }
            } catch (e) {
                setErrMsg(e.message);
            }
        }
        if (id) {
            getDetails(id);
        }
    }, [id]);

    const { name, email, phone, extractedData, llmAnalysis } = details;
    // Show direct skills extraction as a comma-separated list

    // Show LLM skills if available
    let llmSkillsDisplay = "N/A";
    if (llmAnalysis && typeof llmAnalysis === 'object' && Array.isArray(llmAnalysis.skills)) {
        llmSkillsDisplay = llmAnalysis.skills.length > 0 ? llmAnalysis.skills.join(", ") : "N/A";
    }

    let llmAnalysisDisplay = llmAnalysis;
    if (llmAnalysis && typeof llmAnalysis === 'object') {
        llmAnalysisDisplay = <pre style={{whiteSpace: 'pre-wrap'}}>{JSON.stringify(llmAnalysis, null, 2)}</pre>;
    }

    return (
        <div className={styles.detailsContainer}>
            <h2>Resume Details</h2>
            <h4>Name: {name || "N/A"}</h4>
            <p>Email: {email || "N/A"}</p>
            <p>Phone: {phone || "N/A"}</p>
            <p><b>Skills:</b> {llmSkillsDisplay}</p>
            <p>Extracted Data: {extractedData || "N/A"}</p>
            <div>LLM Analysis: {llmAnalysisDisplay || "N/A"}</div>
            {errMsg && <p className={styles.errorMessage}>{errMsg}</p>}
        </div>
    );
}

export default Details;