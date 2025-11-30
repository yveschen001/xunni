import { TestRunner } from '../index';

export class CoreTests extends TestRunner {
  async run() {
    try {
      // ...
    } catch (e: any) {
      // Use errorMessage to avoid unused variable
      const errorMessage = e.message; 
      console.error(errorMessage);
      throw e;
    }
  }
}
