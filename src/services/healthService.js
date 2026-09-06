import healthRepository from "../repositories/healthRepository.js";

const checkHealth = async () => {
  return healthRepository.pingDatabase();
};

export default { checkHealth };
