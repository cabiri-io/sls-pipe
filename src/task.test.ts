import { task, getUserId } from './task';

describe('Task Tests', () => {
    it('should run a task', () => {
        expect(task("success")).resolves.toEqual("ok");
    });
    it('should fail a task', () => {
        expect(task("fails")).rejects.toEqual(new Error('Task failed'));
    });

    it.only('should getUserId', async () => {
        console.log(await getUserId()());
    })
});