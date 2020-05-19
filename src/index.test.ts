import { Application } from './index';

describe('Application Tests', () => {
    it('should create a new application', () => {
        const categoriesApplication = new Application()
            .pre(() => console.log("pre1"))
            .pre(() => console.log("pre2"))
            .action(() => console.log("action"))
            .post(() => console.log("post1"))
            .post(() => console.log("post2"));

        console.log(categoriesApplication);

        categoriesApplication.run()
    });
})