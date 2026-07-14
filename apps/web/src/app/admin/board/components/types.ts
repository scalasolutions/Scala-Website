import { MockClient, MockClientTask } from '@/lib/db/queries';

export interface ClientTaskWithClient extends MockClientTask {
  client?: MockClient;
}
