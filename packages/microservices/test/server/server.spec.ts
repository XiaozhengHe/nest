import { expect } from 'chai';
import { Observable, of, throwError as _throw } from 'rxjs';
import * as sinon from 'sinon';
import { Server } from '../../server/server';

class TestServer extends Server {
  public listen(callback: () => void) {}
  public close() {}
}

describe('Server', () => {
  const server = new TestServer();
  const callback = () => {},
    pattern = { test: 'test pattern' };

  describe('add', () => {
    it(`should add handler as a stringified pattern key`, () => {
      server.addHandler(pattern, callback as any);

      const handlers = server.getHandlers();
      expect(handlers.get(JSON.stringify(pattern))).to.equal(callback);
    });

    it(`should add handler as string pattern key`, () => {
      server.addHandler(pattern.test, callback as any);
      const handlers = server.getHandlers();
      expect(handlers.get(pattern.test)).to.equal(callback);
    });
  });
  describe('send', () => {
    let stream$: Observable<string>;
    let sendSpy: sinon.SinonSpy;
    beforeEach(() => {
      stream$ = of('test');
    });
    describe('when stream', () => {
      beforeEach(() => {
        sendSpy = sinon.spy();
      });
      describe('throws exception', () => {
        beforeEach(() => {
          server.send(_throw('test') as any, sendSpy);
        });
        it('should send error', () => {
          expect(sendSpy.calledWith({ err: 'test', response: null })).to.be
            .true;
        });
        it('should send "complete" event', () => {
          expect(sendSpy.calledWith({ isDisposed: true })).to.be.true;
        });
      });
      describe('emits response', () => {
        beforeEach(() => {
          server.send(stream$, sendSpy);
        });
        it('should send response', () => {
          expect(sendSpy.calledWith({ err: null, response: 'test' })).to.be
            .true;
        });
        it('should send "complete" event', () => {
          expect(sendSpy.calledWith({ isDisposed: true })).to.be.true;
        });
      });
    });
  });
  describe('transformToObservable', () => {
    describe('when resultOrDeffered', () => {
      describe('is Promise', () => {
        it('should returns Observable', async () => {
          const value = 100;
          expect(
            await server
              .transformToObservable(Promise.resolve(value))
              .toPromise(),
          ).to.be.eq(100);
        });
      });
      describe('is Observable', () => {
        it('should returns Observable', async () => {
          const value = 100;
          expect(
            await server.transformToObservable(of(value)).toPromise(),
          ).to.be.eq(100);
        });
      });
      describe('is value', () => {
        it('should returns Observable', async () => {
          const value = 100;
          expect(
            await server.transformToObservable(value).toPromise(),
          ).to.be.eq(100);
        });
      });
    });
  });
  describe('getHandlerByPattern', () => {
    describe('when handler exists', () => {
      it('should return expected handler', () => {
        const channel = 'pattern';
        const expectedResult = {};
        const handlers = new Map([[channel, expectedResult]]);
        (server as any).messageHandlers = handlers;
        expect(server.getHandlerByPattern(channel)).to.be.eql(expectedResult);
      });
    });
    describe('when handler does not exists', () => {
      it('should return null', () => {
        const channel = 'test';
        expect(server.getHandlerByPattern(channel)).to.be.eql(null);
      });
    });
  });
});
