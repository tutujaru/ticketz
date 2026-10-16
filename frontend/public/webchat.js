(() => {
  const params = new URLSearchParams(location.search);
  const api = (params.get("api") || "/backend").replace(/\/$/, "");
  const $ = id => document.getElementById(id);
  let token = localStorage.getItem("crmCnroWebchatToken");
  let timer;
  let rendered = new Set();

  const showError = (id, message) => { $(id).textContent = message || ""; };
  const request = async (path, options) => {
    const response = await fetch(`${api}${path}`, { headers: { "Content-Type": "application/json" }, ...options });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || data.message || "Não foi possível concluir a operação.");
    return data;
  };
  const option = (value, text) => { const el = document.createElement("option"); el.value = value; el.textContent = text; return el; };

  async function loadConnections() {
    try {
      const connections = await request("/public/webchat/connections");
      $("connection").replaceChildren(option("", "Selecione o setor"));
      connections.forEach(item => $("connection").appendChild(option(item.id, item.name)));
      if (!connections.length) $("connection").replaceChildren(option("", "Nenhum setor disponível"));
    } catch (error) { $("connection").replaceChildren(option("", "Erro ao carregar setores")); showError("startError", error.message); }
  }

  $("connection").addEventListener("change", async event => {
    const select = $("queue");
    select.disabled = true;
    select.replaceChildren(option("", "Carregando filas..."));
    if (!event.target.value) { select.replaceChildren(option("", "Selecione primeiro o setor")); return; }
    try {
      const queues = await request(`/public/webchat/connections/${encodeURIComponent(event.target.value)}/queues`);
      select.replaceChildren(option("", queues.length ? "Selecione a fila" : "Nenhuma fila disponível"));
      queues.forEach(item => select.appendChild(option(item.id, item.name)));
      select.disabled = !queues.length;
    } catch (error) { select.replaceChildren(option("", error.message)); }
  });

  function appendMessages(records) {
    const box = $("messages");
    records.forEach(item => {
      if (rendered.has(item.id)) return;
      rendered.add(item.id);
      const div = document.createElement("div");
      div.className = `message ${item.fromMe ? "out" : "in"}`;
      div.textContent = item.body || "(mensagem sem texto)";
      const time = document.createElement("time");
      time.textContent = new Date(item.createdAt).toLocaleString("pt-BR");
      div.appendChild(time); box.appendChild(div);
    });
    box.scrollTop = box.scrollHeight;
  }

  async function refresh() {
    if (!token) return;
    try {
      const data = await request(`/public/webchat/session/${token}/messages`);
      $("protocol").textContent = data.protocol?.protocol ? `Protocolo: ${data.protocol.protocol}` : "";
      $("status").textContent = data.protocol?.status === "closed" ? "Encerrado" : "Em atendimento";
      appendMessages(data.messages || []);
    } catch (error) { if (error.message.includes("expirada")) { localStorage.removeItem("crmCnroWebchatToken"); token = null; clearInterval(timer); } }
  }

  $("startButton").addEventListener("click", async () => {
    showError("startError", "");
    const button = $("startButton"); button.disabled = true; button.textContent = "Iniciando...";
    try {
      const data = await request("/public/webchat/start", { method: "POST", body: JSON.stringify({ whatsappId: $("connection").value, queueId: $("queue").value, name: $("name").value, phone: $("phone").value, message: $("initialMessage").value }) });
      token = data.token; localStorage.setItem("crmCnroWebchatToken", token); $("startPanel").classList.add("hidden"); $("chatPanel").classList.remove("hidden"); $("protocol").textContent = `Protocolo: ${data.protocol}`; await refresh(); timer = setInterval(refresh, 3000);
    } catch (error) { showError("startError", error.message); } finally { button.disabled = false; button.textContent = "Iniciar conversa"; }
  });

  $("messageForm").addEventListener("submit", async event => { event.preventDefault(); const input = $("message"); const body = input.value.trim(); if (!body || !token) return; input.disabled = true; try { await request(`/public/webchat/session/${token}/messages`, { method: "POST", body: JSON.stringify({ body }) }); input.value = ""; await refresh(); } catch (error) { alert(error.message); } finally { input.disabled = false; input.focus(); } });
  $("closeButton").addEventListener("click", async () => { if (!token || !confirm("Deseja encerrar este atendimento?")) return; await request(`/public/webchat/session/${token}/close`, { method: "POST" }); clearInterval(timer); $("status").textContent = "Encerrado"; localStorage.removeItem("crmCnroWebchatToken"); token = null; });

  if (token) { $("startPanel").classList.add("hidden"); $("chatPanel").classList.remove("hidden"); timer = setInterval(refresh, 3000); refresh(); } else loadConnections();
})();
