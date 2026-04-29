'use client';

import React, { createContext, useContext } from 'react';

interface NotificationsContextValue {
  pendingReviewCount: number;
  refetch: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue>({
  pendingReviewCount: 0,
  refetch: () => undefined,
});

export const NotificationsProvider = ({
  children,
  pendingReviewCount,
  refetch,
}: {
  children: React.ReactNode;
  pendingReviewCount: number;
  refetch: () => void;
}): React.ReactElement => (
  <NotificationsContext.Provider value={{ pendingReviewCount, refetch }}>
    {children}
  </NotificationsContext.Provider>
);

export const useNotifications = (): NotificationsContextValue =>
  useContext(NotificationsContext);
