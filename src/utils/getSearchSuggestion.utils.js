import axios from "axios";
import { HOME_API } from "../config/api";

const getSearchSuggestion = async (keyword) => {
  const api_url = HOME_API;
  try {
    const response = await axios.get(
      `${api_url}/search/suggest?keyword=${keyword}`
    );
    return response.data.results;
  } catch (err) {
    console.error("Error fetching genre info:", err);
    return err;
  }
};

export default getSearchSuggestion;
