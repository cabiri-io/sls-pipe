
interface GatewayHandler { }
interface SuccessResponseHandler { }

class Application {
    private _pre: Array<Function>
    private _post: Array<Function>
    private _action: Function

    constructor() {
        this._pre = [];
        this._post = [];
        this._action = () => { throw new Error("Not yet Implemented") };
    }

    pre(f: Function): Application {
        this._pre.push(f);
        return this;
    }

    post(f: Function): Application {
        this._post.push(f);
        return this;
    }

    action(f: Function): Application {
        this._action = f;
        return this;
    }

    // TODO Does this mean it only runs specific dependencies?
    // .run(payload, {logger, getCategories, sendEvent})
    run(): void {
        const preResults = this._pre.map(f => f());
        const actionsResult = this._action();
        const postResults = this._post.map(f => f());
    }
}

export { Application }
