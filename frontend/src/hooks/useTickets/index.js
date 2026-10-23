import { useCallback } from "react";
import { useQuery } from "react-query";
import toastError from "../../errors/toastError";

import api from "../../services/api";

const useTickets = ({
  isSearch,
  searchParam,
  contactId,
  tags,
  users,
  nextUpdatedAt,
  nextTicketId,
  status,
  groups,
  date,
  updatedAt,
  showAll,
  queueIds,
  withUnreadMessages,
  notClosed,
  all
}) => {
  const queryKey = [
    "tickets",
    isSearch,
    searchParam,
    nextUpdatedAt,
    nextTicketId,
    contactId,
    tags,
    users,
    status,
    groups,
    date,
    updatedAt,
    showAll,
    queueIds,
    withUnreadMessages,
    notClosed,
    all
  ];

  const fetchTickets = useCallback(async () => {
    try {
      const { data } = await api.get("/tickets", {
        params: {
          isSearch,
          searchParam,
          nextUpdatedAt,
          nextTicketId,
          contactId,
          tags,
          users,
          status,
          groups,
          date,
          updatedAt,
          showAll,
          queueIds,
          withUnreadMessages,
          notClosed,
          all
        }
      });
      return data.tickets || [];
    } catch (err) {
      toastError(err);
      throw err;
    }
  }, [
    isSearch,
    searchParam,
    nextUpdatedAt,
    nextTicketId,
    contactId,
    tags,
    users,
    status,
    groups,
    date,
    updatedAt,
    showAll,
    queueIds,
    withUnreadMessages,
    notClosed,
    all
  ]);

  const {
    data: tickets = [],
    isLoading,
    isFetching,
    refetch
  } = useQuery(queryKey, fetchTickets, {
    keepPreviousData: true,
    staleTime: 30000,
    refetchOnWindowFocus: false,
    retry: 1
  });

  const fetchSince = useCallback(
    async minUpdatedAt => {
      const { data } = await api.get("/tickets", {
        params: {
          isSearch,
          searchParam,
          contactId,
          tags,
          users,
          status,
          groups,
          date,
          updatedAt,
          showAll,
          queueIds,
          withUnreadMessages,
          notClosed,
          all,
          minUpdatedAt
        }
      });
      return data.tickets;
    },
    [
      isSearch,
      searchParam,
      contactId,
      tags,
      users,
      status,
      groups,
      date,
      updatedAt,
      showAll,
      queueIds,
      withUnreadMessages,
      notClosed,
      all
    ]
  );

  return {
    tickets,
    loading: isLoading || isFetching,
    refetch,
    fetchSince
  };
};

export default useTickets;
