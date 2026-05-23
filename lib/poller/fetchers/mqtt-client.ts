// Persistent MQTT client manager — one connection per integration.
// MQTT is pub/sub so we maintain a connection rather than polling.
import mqtt, { type MqttClient } from "mqtt";

export interface MqttTopicValue {
  topic: string;
  value: string;
  receivedAt: string;
}

export interface MqttData {
  topics: MqttTopicValue[];
  connected: boolean;
}

interface ClientEntry {
  client: MqttClient;
  cache: Map<string, MqttTopicValue>;
  connected: boolean;
}

const clients = new Map<string, ClientEntry>();

export function getMqttData(integrationId: string): MqttData {
  const entry = clients.get(integrationId);
  if (!entry) return { topics: [], connected: false };
  return {
    topics: Array.from(entry.cache.values()).sort((a, b) => a.topic.localeCompare(b.topic)),
    connected: entry.connected,
  };
}

export function connectMqtt(
  integrationId: string,
  url: string,
  username: string | undefined,
  password: string | undefined,
  topicList: string[],
  onUpdate: (data: MqttData) => void
) {
  // Disconnect any existing client for this integration
  disconnectMqtt(integrationId);

  const cache = new Map<string, MqttTopicValue>();
  const entry: ClientEntry = { client: null as unknown as MqttClient, cache, connected: false };
  clients.set(integrationId, entry);

  const client = mqtt.connect(url, {
    username: username || undefined,
    password: password || undefined,
    reconnectPeriod: 5_000,
    connectTimeout: 10_000,
    clientId: `nexus-${integrationId.slice(-8)}`,
  });

  entry.client = client;

  client.on("connect", () => {
    entry.connected = true;
    for (const topic of topicList) {
      client.subscribe(topic);
    }
    onUpdate(getMqttData(integrationId));
  });

  client.on("disconnect", () => {
    entry.connected = false;
    onUpdate(getMqttData(integrationId));
  });

  client.on("error", () => {
    entry.connected = false;
  });

  client.on("message", (topic, payload) => {
    cache.set(topic, {
      topic,
      value: payload.toString(),
      receivedAt: new Date().toISOString(),
    });
    onUpdate(getMqttData(integrationId));
  });
}

export function disconnectMqtt(integrationId: string) {
  const entry = clients.get(integrationId);
  if (entry) {
    entry.client.end(true);
    clients.delete(integrationId);
  }
}
