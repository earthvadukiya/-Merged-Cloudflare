import axios from "axios";
import { WATCH_API } from "../config/api";

const getNextEpisodeSchedule = async (id) => {
  const api_url = WATCH_API;
  try {
    const response = await axios.get(`${api_url}/schedule/${id}`);
    return response.data.results;
  } catch (err) {
    console.error("Error fetching next episode schedule:", err);
    return err;
  }
};

export default getNextEpisodeSchedule;
