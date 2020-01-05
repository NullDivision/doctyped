import { readApi } from "../swagger";

describe('swagger', () => {
  it('fetches data from swagger API', async () => {
    await readApi();
  });
});
