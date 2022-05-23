import { StatusHandler, EventBridgeEventToDDB } from '@amzn/environments';

/* eslint-disable-next-line */
export async function handler(event: any) {
  // TODO: Allow user-configurability of object attributes to be stored to DDB
  console.log(`StatusHandler processing event ${JSON.stringify(event)}`);

  // We only handle environment status updates on this lambda
  if (event['detail-type'] !== process.env.EB_EVENT_TYPE_STATUS_UPDATE!) return;

  // Map event to EventBridgeEventToDDB
  const ebToDDB: EventBridgeEventToDDB = {
    envId: event.detail.EnvId,
    status: event.detail.Status,
    operation: event.detail.Operation,
    metadata: event
  };

  const statusHandler = new StatusHandler();
  await statusHandler.execute(ebToDDB);
}
