import DailyResetService from "@/services/dailyResetService";

export const checkDailyReset = async (userId: string) => {
  return await DailyResetService.checkAndPerformDailyReset(userId);
};

export default checkDailyReset;