describe('logger', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  it('calls console methods when __DEV__ is true', () => {
    (global as any).__DEV__ = true;
    // Spy BEFORE requiring so .bind(console) captures the spy
    const spy = jest.spyOn(console, 'log').mockImplementation();
    const { logger } = require('../../utils/logger');

    logger.log('hello');
    expect(spy).toHaveBeenCalledWith('hello');
  });

  it('calls console.warn when __DEV__ is true', () => {
    (global as any).__DEV__ = true;
    const spy = jest.spyOn(console, 'warn').mockImplementation();
    const { logger } = require('../../utils/logger');

    logger.warn('warning');
    expect(spy).toHaveBeenCalledWith('warning');
  });

  it('calls console.error when __DEV__ is true', () => {
    (global as any).__DEV__ = true;
    const spy = jest.spyOn(console, 'error').mockImplementation();
    const { logger } = require('../../utils/logger');

    logger.error('error msg');
    expect(spy).toHaveBeenCalledWith('error msg');
  });

  it('suppresses all output when __DEV__ is false', () => {
    (global as any).__DEV__ = false;
    const logSpy = jest.spyOn(console, 'log').mockImplementation();
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    const { logger } = require('../../utils/logger');

    logger.log('nope');
    logger.warn('nope');
    logger.error('nope');

    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
