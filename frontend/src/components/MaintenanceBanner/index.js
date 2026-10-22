import React, { useEffect, useState } from "react";

const MaintenanceBanner = () => {
  const [maintenance, setMaintenance] = useState(null);

  useEffect(() => {
    let active = true;

    const loadMaintenance = async () => {
      try {
        const response = await fetch(`/maintenance.json?ts=${Date.now()}`, {
          cache: "no-store"
        });
        if (!response.ok) return;
        const data = await response.json();
        if (active) setMaintenance(data?.enabled ? data : null);
      } catch (_) {
        // O aviso não deve impedir o carregamento do sistema.
      }
    };

    loadMaintenance();
    const interval = window.setInterval(loadMaintenance, 15000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  if (!maintenance) return null;

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10000,
        padding: "10px 16px",
        background: "#8a1c1c",
        color: "#fff",
        textAlign: "center",
        fontFamily: "Arial, sans-serif",
        fontSize: 14,
        fontWeight: 600,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.25)"
      }}
    >
      {maintenance.message ||
        "O sistema está em atualização. Aguarde alguns minutos para acessar novamente."}
      {maintenance.eta ? ` Previsão: ${maintenance.eta}.` : ""}
    </div>
  );
};

export default MaintenanceBanner;
