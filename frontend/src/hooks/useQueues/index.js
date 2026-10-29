import { useCallback } from "react";
import api from "../../services/api";

const useQueues = () => {
  const findAll = useCallback(async companyId => {
    const { data } = await api.get("/queue", {
      params: companyId ? { companyId } : {}
    });
    return data;
  }, []);

  return { findAll };
};

export default useQueues;
