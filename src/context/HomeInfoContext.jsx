import { createContext, useContext, useEffect, useMemo, useState } from "react";
import getHomeInfo from "../utils/getHomeInfo.utils.js";

const HomeInfoContext = createContext(null);

export const HomeInfoProvider = ({ children }) => {
  const [homeInfo, setHomeInfo] = useState(null);
  const [homeInfoLoading, setHomeInfoLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;

    async function fetchHomeInfo() {
      try {
        setError(null);

        const data = await getHomeInfo();

        if (!alive) return;

        setHomeInfo(data);
      } catch (err) {
        if (!alive) return;

        console.error("Error fetching home info:", err);
        setError(err);
      } finally {
        if (alive) {
          setHomeInfoLoading(false);
        }
      }
    }

    fetchHomeInfo();

    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      homeInfo,
      homeInfoLoading,
      error,
      refetchHomeInfo: async () => {
        setHomeInfoLoading(true);
        setError(null);

        try {
          const data = await getHomeInfo();
          setHomeInfo(data);
        } catch (err) {
          console.error("Error refetching home info:", err);
          setError(err);
        } finally {
          setHomeInfoLoading(false);
        }
      },
    }),
    [homeInfo, homeInfoLoading, error]
  );

  return (
    <HomeInfoContext.Provider value={value}>
      {children}
    </HomeInfoContext.Provider>
  );
};

export const useHomeInfo = () => {
  const context = useContext(HomeInfoContext);

  if (!context) {
    throw new Error("useHomeInfo must be used inside HomeInfoProvider");
  }

  return context;
};
