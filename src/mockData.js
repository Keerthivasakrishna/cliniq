export const PATIENTS = [
    {
        id: "P001",
        name: "Eleanor Rigby",
        age: 68,
        diagnosis: ["Hypertension", "Type 2 Diabetes"],
        riskScore: 75,
        adherenceScore: 62,
        medications: [
            { name: "Metformin", dose: "500mg", freq: "BD", shape: "oval", color: "#fff" },
            { name: "Lisinopril", dose: "10mg", freq: "OD", shape: "round", color: "#fbd38d" },
            { name: "Atorvastatin", dose: "20mg", freq: "OD", shape: "oval", color: "#e2e8f0" }
        ],
        labTrends: {
            HbA1c: [
                { date: "Jan", value: 6.8 },
                { date: "Feb", value: 7.0 },
                { date: "Mar", value: 7.3 },
                { date: "Apr", value: 7.9 },
                { date: "May", value: 8.2 }
            ],
            Creatinine: [
                { date: "Jan", value: 1.1 },
                { date: "Feb", value: 1.2 },
                { date: "Mar", value: 1.4 },
                { date: "Apr", value: 1.6 },
                { date: "May", value: 1.7 }
            ],
            BP: [
                { date: "Jan", systolic: 130, diastolic: 80 },
                { date: "Feb", systolic: 135, diastolic: 82 },
                { date: "Mar", systolic: 142, diastolic: 88 },
                { date: "Apr", systolic: 148, diastolic: 92 },
                { date: "May", systolic: 155, diastolic: 95 }
            ]
        },
        consultBrief: {
            complaint: "Fatigue, mild peripheral edema, and frequent urination",
            keyFindings: [
                "Worsening HbA1c trend indicating poor glycemic control",
                "Consistently elevated BP readings over last 3 months",
                "Early kidney stress markers (Cr steadily rising)"
            ]
        },
        alerts: [
            { id: 1, type: "danger", message: "Worsening HbA1c trajectory (8.2%)", time: "2h ago" },
            { id: 2, type: "warning", message: "Rising creatinine levels (1.7 mg/dL)", time: "5h ago" },
            { id: 3, type: "danger", message: "Consecutive elevated BP readings", time: "1d ago" }
        ]
    },
    {
        id: "P002",
        name: "John Doe",
        age: 45,
        diagnosis: ["Asthma", "Allergic Rhinitis"],
        riskScore: 35,
        adherenceScore: 92,
        medications: [
            { name: "Albuterol", dose: "90mcg", freq: "PRN", shape: "inhaler", color: "#63b3ed" },
            { name: "Fluticasone", dose: "50mcg", freq: "BD", shape: "inhaler", color: "#f6ad55" }
        ],
        labTrends: {
            HbA1c: [
                { date: "Jan", value: 5.2 },
                { date: "Feb", value: 5.2 },
                { date: "Mar", value: 5.3 },
                { date: "Apr", value: 5.2 },
                { date: "May", value: 5.3 }
            ],
            Creatinine: [
                { date: "Jan", value: 0.9 },
                { date: "Feb", value: 0.9 },
                { date: "Mar", value: 0.85 },
                { date: "Apr", value: 0.9 },
                { date: "May", value: 0.9 }
            ],
            BP: [
                { date: "Jan", systolic: 118, diastolic: 75 },
                { date: "Feb", systolic: 120, diastolic: 78 },
                { date: "Mar", systolic: 115, diastolic: 72 },
                { date: "Apr", systolic: 122, diastolic: 76 },
                { date: "May", systolic: 118, diastolic: 75 }
            ]
        },
        consultBrief: {
            complaint: "Increased dependency on rescue inhaler during seasonal shifts",
            keyFindings: [
                "Excellent general adherence to controller meds",
                "Routine labs are within healthy parameters",
                "No systemic risk markers elevated"
            ]
        },
        alerts: [
            { id: 1, type: "warning", message: "Mild spike in PRN inhaler usage reported in patient log", time: "4d ago" }
        ]
    },
    {
        id: "P003",
        name: "Jane Smith",
        age: 52,
        diagnosis: ["Chronic Kidney Disease (Stage 2)", "Hypertension"],
        riskScore: 68,
        adherenceScore: 85,
        medications: [
            { name: "Amlodipine", dose: "5mg", freq: "OD", shape: "round", color: "#fff" },
            { name: "Losartan", dose: "50mg", freq: "OD", shape: "oval", color: "#cbd5e1" }
        ],
        labTrends: {
            HbA1c: [
                { date: "Jan", value: 5.8 },
                { date: "Feb", value: 5.8 },
                { date: "Mar", value: 5.9 },
                { date: "Apr", value: 5.9 },
                { date: "May", value: 6.0 }
            ],
            Creatinine: [
                { date: "Jan", value: 1.5 },
                { date: "Feb", value: 1.55 },
                { date: "Mar", value: 1.6 },
                { date: "Apr", value: 1.8 },
                { date: "May", value: 1.95 }
            ],
            BP: [
                { date: "Jan", systolic: 135, diastolic: 85 },
                { date: "Feb", systolic: 138, diastolic: 88 },
                { date: "Mar", systolic: 140, diastolic: 90 },
                { date: "Apr", systolic: 142, diastolic: 90 },
                { date: "May", systolic: 138, diastolic: 88 }
            ]
        },
        consultBrief: {
            complaint: "Routine check-up, complains of generalized weakness",
            keyFindings: [
                "Creatinine levels show a concerning upward slope (1.95 mg/dL)",
                "BP is borderline but stable on current regimen",
                "Close monitoring of renal function required"
            ]
        },
        alerts: [
            { id: 1, type: "danger", message: "Sharp rise in Creatinine — nephrology consult advised", time: "12h ago" }
        ]
    },
    {
        id: "P004",
        name: "Robert Downey",
        age: 59,
        diagnosis: ["Coronary Artery Disease", "Hyperlipidemia"],
        riskScore: 85,
        adherenceScore: 45,
        medications: [
            { name: "Rosuvastatin", dose: "40mg", freq: "OD", shape: "round", color: "#fca5a5" },
            { name: "Clopidogrel", dose: "75mg", freq: "OD", shape: "round", color: "#fff" },
            { name: "Metoprolol", dose: "50mg", freq: "BD", shape: "oval", color: "#bae6fd" }
        ],
        labTrends: {
            HbA1c: [
                { date: "Jan", value: 6.2 },
                { date: "Feb", value: 6.3 },
                { date: "Mar", value: 6.3 },
                { date: "Apr", value: 6.4 },
                { date: "May", value: 6.5 }
            ],
            Creatinine: [
                { date: "Jan", value: 1.0 },
                { date: "Feb", value: 1.0 },
                { date: "Mar", value: 1.05 },
                { date: "Apr", value: 1.1 },
                { date: "May", value: 1.1 }
            ],
            BP: [
                { date: "Jan", systolic: 125, diastolic: 80 },
                { date: "Feb", systolic: 130, diastolic: 82 },
                { date: "Mar", systolic: 135, diastolic: 85 },
                { date: "Apr", systolic: 142, diastolic: 88 },
                { date: "May", systolic: 150, diastolic: 94 }
            ]
        },
        consultBrief: {
            complaint: "Occasional mild chest tightness with exertion",
            keyFindings: [
                "Very low medication adherence (45%)",
                "Blood pressure is rising, highly correlated with missed beta-blocker doses",
                "High risk for secondary cardiovascular event"
            ]
        },
        alerts: [
            { id: 1, type: "danger", message: "Critical low medication adherence detected", time: "1h ago" },
            { id: 2, type: "danger", message: "BP rising into hypertensive range (150/94)", time: "3h ago" }
        ]
    },
    {
        id: "P005",
        name: "Sophia Chen",
        age: 34,
        diagnosis: ["Rheumatoid Arthritis"],
        riskScore: 42,
        adherenceScore: 88,
        medications: [
            { name: "Methotrexate", dose: "15mg", freq: "Weekly", shape: "round", color: "#fde047" },
            { name: "Folic Acid", dose: "1mg", freq: "OD", shape: "round", color: "#fff" },
            { name: "Ibuprofen", dose: "400mg", freq: "PRN", shape: "oval", color: "#ef4444" }
        ],
        labTrends: {
            HbA1c: [
                { date: "Jan", value: 5.0 },
                { date: "Feb", value: 5.1 },
                { date: "Mar", value: 5.0 },
                { date: "Apr", value: 5.0 },
                { date: "May", value: 5.0 }
            ],
            Creatinine: [
                { date: "Jan", value: 0.7 },
                { date: "Feb", value: 0.75 },
                { date: "Mar", value: 0.7 },
                { date: "Apr", value: 0.8 },
                { date: "May", value: 0.8 }
            ],
            BP: [
                { date: "Jan", systolic: 110, diastolic: 70 },
                { date: "Feb", systolic: 112, diastolic: 72 },
                { date: "Mar", systolic: 115, diastolic: 75 },
                { date: "Apr", systolic: 114, diastolic: 74 },
                { date: "May", systolic: 116, diastolic: 76 }
            ]
        },
        consultBrief: {
            complaint: "Increased morning joint stiffness over the past month",
            keyFindings: [
                "Vital signs and primary labs are well within normal limits",
                "Potential need for adjusting DMARD therapy due to symptomatic flare"
            ]
        },
        alerts: [
            { id: 1, type: "warning", message: "Patient reported increased PRN NSAID usage", time: "2d ago" }
        ]
    }
];
