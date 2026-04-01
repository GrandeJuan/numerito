import { AppController } from './app.controller';

describe('AppController', () => {
  let controller: AppController;

  beforeEach(() => {
    controller = new AppController();
  });

  it('should return health status', () => {
    expect(controller.health()).toEqual({ status: 'ok' });
  });
});
