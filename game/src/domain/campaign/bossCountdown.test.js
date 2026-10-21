import { describe, expect, it } from 'vitest';
import { BossCountdown } from './bossCountdown';

describe('BossCountdown', () => {
    it('starts at the limit in whole seconds and not expired', () => {
        const countdown = new BossCountdown(30000);

        expect(countdown.seconds).toBe(30);
        expect(countdown.expired).toBe(false);
    });

    it('still reads 30 after 1 ms and reads 29 after 1001 ms', () => {
        const countdown = new BossCountdown(30000);

        countdown.advance(1);
        expect(countdown.seconds).toBe(30);

        countdown.advance(1000);
        expect(countdown.seconds).toBe(29);
    });

    it('reads 1 and is not expired one millisecond before the limit', () => {
        const countdown = new BossCountdown(30000);

        countdown.advance(29999);

        expect(countdown.seconds).toBe(1);
        expect(countdown.expired).toBe(false);
    });

    it('reads 0 and is expired exactly at the limit', () => {
        const countdown = new BossCountdown(30000);

        countdown.advance(30000);

        expect(countdown.seconds).toBe(0);
        expect(countdown.expired).toBe(true);
    });

    it('never goes below 0 when advanced past the limit', () => {
        const countdown = new BossCountdown(60000);

        countdown.advance(75000);

        expect(countdown.seconds).toBe(0);
        expect(countdown.remainingMs).toBe(0);
    });

    it('adds up several frames', () => {
        const countdown = new BossCountdown(60000);

        [ 16, 16, 16 ].forEach((ms) => countdown.advance(ms));

        expect(countdown.remainingMs).toBe(59952);
    });

    it('ignores a negative frame time', () => {
        const countdown = new BossCountdown(30000);

        countdown.advance(-500);

        expect(countdown.remainingMs).toBe(30000);
    });

    it('gains 4000 ms of time left on extend, each time and beyond the starting limit', () => {
        const countdown = new BossCountdown(30000);

        countdown.advance(1000);
        countdown.extend(4000);
        countdown.extend(4000);

        expect(countdown.remainingMs).toBe(37000);
    });

    it('is live again when an expired countdown gains time', () => {
        const countdown = new BossCountdown(1000);

        countdown.advance(1000);
        expect(countdown.expired).toBe(true);

        countdown.extend(4000);

        expect(countdown.expired).toBe(false);
        expect(countdown.seconds).toBe(4);
    });
});
