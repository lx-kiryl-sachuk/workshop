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
    this.items.unshift(ev);
    if (this.items.length > this.limit)
      this.items = this.items.slice(0, this.limit);
  }

  list(address?: string) {
    if (!address) return this.items;
    const a = address.toLowerCase();
    return this.items.filter(
      (x) => x.from.toLowerCase() === a || x.to.toLowerCase() === a,
    );
  }
}
