import api from "../../services/api";

const useQueues = () => {
  const findAll = async companyId => {
    const { data } = await api.get("/queue", {
      params: companyId ? { companyId } : {}
    });
    return data;
  };

  return { findAll };
};

export default useQueues;
