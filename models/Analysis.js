import mongoose from "mongoose";

// Define Schema for Plant Disease Analysis
const AnalysisSchema = new mongoose.Schema({
    plantName: { type: String, required: true },
    diagnosis: { type: String, required: true },
    score: { type: Number, required: true },
    status: { type: String, enum: ["Pending", "Analysing", "Success", "Failed"], default: "Pending" },
    accuracy: { type: String, enum: ["High", "Medium", "Low"], required: true },
});

// Create & Export Model
const Analysis = mongoose.model("Analysis", AnalysisSchema);
export default Analysis;
