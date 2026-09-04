export const QUEUE_PORT = 'QUEUE_PORT';

export interface IQueuePort {
  add(jobName: string, data: any): Promise<void>;
}