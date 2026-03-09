export const PATIENTS = [
    {
        id: "p1",
        name: "Eleanor Rigby",
        age: 68,
        diagnosis: ["Hypertension", "Type 2 Diabetes"],
        riskScore: 75,
        adherenceScore: 60,
        medications: [
            { name: "Metformin", dose: "500mg", freq: "BD", shape: "oval", color: "#fff" },
            { name: "Lisinopril", dose: "10mg", freq: "OD", shape: "round", color: "#fbd38d" },
            { name: "Atorvastatin", dose: "20mg", freq: "OD", shape: "oval", color: "#e2e8f0" }
        ],
        labTrends: {
            HbA1c: [
                { date: "Jan", value: 6.8 },
                { date: "Feb", value: 7.1 },
                { date: "Mar", value: 7.4 },
                { date: "Apr", value: 7.9 },
                { date: "May", value: 8.2 }
            ],
            Creatinine: [
                { date: "Jan", value: 0.9 },
                { date: "Feb", value: 0.95 },
                { date: "Mar", value: 1.1 },
                { date: "Apr", value: 1.25 },
                { date: "May", value: 1.4 }
            ],
            BP: [
                { date: "Jan", systolic: 130, diastolic: 80 },
                { date: "Feb", systolic: 135, diastolic: 82 },
                { date: "Mar", systolic: 142, diastolic: 88 },
                { date: "Apr", systolic: 148, diastolic: 92 },
                { date: "May", systolic: 155, diastolic: 96 }
            ]
        },
        alerts: [
            { id: 1, type: "danger", message: "Worsening HbA1c trajectory (8.2%)", time: "2h ago" },
            { id: 2, type: "warning", message: "Rising creatinine levels indicating potential renal stress", time: "5h ago" },
            { id: 3, type: "danger", message: "Consecutive elevated BP readings", time: "1d ago" }
        ]
    },
    {
        id: "p2",
        name: "John Doe",
        age: 45,
        diagnosis: ["Asthma"],
        riskScore: 35,
        adherenceScore: 92,
        medications: [
            { name: "Albuterol", dose: "90mcg", freq: "PRN", shape: "inhaler", color: "#63b3ed" }
        ],
        labTrends: { HbA1c: [], Creatinine: [], BP: [] },
        alerts: []
    },
    {
        id: "p3",
        name: "Jane Smith",
        age: 52,
        diagnosis: ["Hyperlipidemia", "Osteoarthritis"],
        riskScore: 45,
        adherenceScore: 85,
        medications: [],
        labTrends: { HbA1c: [], Creatinine: [], BP: [] },
        alerts: []
    },
    {
        id: "p4",
        name: "Robert Downey",
        age: 59,
        diagnosis: ["CAD", "Hypertension"],
        riskScore: 82,
        adherenceScore: 45,
        medications: [],
        labTrends: { HbA1c: [], Creatinine: [], BP: [] },
        alerts: []
    }
];
