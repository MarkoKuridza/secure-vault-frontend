import { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const socket = new SockJS("https://localhost:9000/ws");

export function useWebSocket() {
  const [alerts, setAlerts] = useState([]);
  const clientRef = useRef(null);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      debug: (str) => {
        console.log(str);
      },
    });

    client.onConnect = () => {
      client.subscribe("/topic/honeypot", (message) => {
        const data = JSON.parse(message.body);
        setAlerts((prev) => [data, ...prev]);
      });
    };

    client.activate();
    clientRef.current = client;

    return () => client.deactivate();
  }, []);

  return { alerts };
}
