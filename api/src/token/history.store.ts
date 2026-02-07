import { Injectable } from '@nestjs/common';

export type TransferEvent = {
  txHash: string;
  from: string;
  to: string;
  value: string;
  blockNumber: number;
};

@Injectable()
export class HistoryStore {
  private items: TransferEvent[] = [];
  private limit = Number(process.env.HISTORY_LIMIT ?? 200);

  push(ev: TransferEvent) {
    // TODO: Add the event to the beginning of `this.items`
    // TODO: If items exceed `this.limit`, trim the array
  }

  list(address?: string): TransferEvent[] {
    // TODO: If no address provided, return all items
    // TODO: If address provided, filter items where `from` or `to` matches (case-insensitive)
    return [];
  }
}
