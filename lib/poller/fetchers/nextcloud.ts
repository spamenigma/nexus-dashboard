export interface NextcloudActivity {
  id: number;
  app: string;
  type: string;
  user: string;
  subject: string;
  datetime: string;
}

export interface NextcloudData {
  activities: NextcloudActivity[];
  storageUsed?: number;
  storageTotal?: number;
}

export async function fetchNextcloud(url: string, username: string, password: string): Promise<NextcloudData> {
  const base = url.replace(/\/$/, "");
  const auth = Buffer.from(`${username}:${password}`).toString("base64");
  const headers = {
    Authorization: `Basic ${auth}`,
    "OCS-APIRequest": "true",
  };

  const [activityRes, quotaRes] = await Promise.allSettled([
    fetch(`${base}/ocs/v2.php/apps/activity/api/v2/activity?limit=20&format=json`, {
      headers,
      signal: AbortSignal.timeout(10_000),
    }),
    fetch(`${base}/ocs/v2.php/cloud/users/${encodeURIComponent(username)}?format=json`, {
      headers,
      signal: AbortSignal.timeout(10_000),
    }),
  ]);

  if (activityRes.status === "rejected" || !(activityRes.value as Response).ok) {
    const status = activityRes.status === "rejected" ? 0 : (activityRes.value as Response).status;
    throw new Error(`Nextcloud activity responded ${status}`);
  }

  const activityData = await (activityRes.value as Response).json() as NextcloudOCSResponse;
  const activities: NextcloudActivity[] = (activityData.ocs?.data ?? []).map((item) => ({
    id: item.activity_id,
    app: item.app,
    type: item.type,
    user: item.user,
    subject: item.subject,
    datetime: item.datetime,
  }));

  let storageUsed: number | undefined;
  let storageTotal: number | undefined;
  if (quotaRes.status === "fulfilled" && (quotaRes.value as Response).ok) {
    const quotaData = await (quotaRes.value as Response).json() as NextcloudUserResponse;
    const quota = quotaData.ocs?.data?.quota;
    if (quota) {
      storageUsed = quota.used;
      storageTotal = quota.total > 0 ? quota.total : undefined;
    }
  }

  return { activities, storageUsed, storageTotal };
}

interface NextcloudOCSResponse {
  ocs?: {
    data?: {
      activity_id: number;
      app: string;
      type: string;
      user: string;
      subject: string;
      datetime: string;
    }[];
  };
}

interface NextcloudUserResponse {
  ocs?: {
    data?: {
      quota?: {
        used: number;
        total: number;
        free: number;
        relative: number;
      };
    };
  };
}
