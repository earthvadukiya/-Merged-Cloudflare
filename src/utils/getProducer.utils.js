import axios from "axios";
import { HOME_API } from "../config/api";

const getProducer = async (producer, page) => {
  const api_url = HOME_API;
  try {
    const response = await axios.get(`${api_url}/producer/${producer}?page=${page}`);
    return response.data.results;
  } catch (err) {
    console.error("Error fetching genre info:", err);
    return err;
  }
};

export default getProducer;
