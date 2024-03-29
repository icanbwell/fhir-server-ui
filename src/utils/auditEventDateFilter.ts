import dayjs from 'dayjs';

/**
 * Calculate the start and end dates for today.
 * @returns {Object} An object containing start and end dates.
 */
export const getStartAndEndDate = (): { startDate: dayjs.Dayjs; endDate: dayjs.Dayjs } => {
    const today = new Date();
    // Calculate start date (7 days ago from today)
    const startDate = dayjs(today).subtract(7, 'day');
    // Calculate end date (today)
    const endDate = dayjs(today);
    return { startDate, endDate };
};
