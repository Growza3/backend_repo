const FarmingRequestSchema = new mongoose.Schema({
    name: String,
    email: String,
    spaceAvailable: String,
    environmentType: String,
    budget: String,
    farmingGoals: String,
    createdAt: { type: Date, default: Date.now },
  });
  
  const FarmingRequest = mongoose.model("customized_farming_requests", FarmingRequestSchema);
  