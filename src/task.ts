import { Lazy } from "fp-ts/lib/function";
import { chain, TaskEither, tryCatch, fromEither } from 'fp-ts/lib/TaskEither';
import { Either, left, right, toError } from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/pipeable";
import { flow } from "fp-ts/lib/function";


function chainEither<A, B>(
    f: (a: A) => Either<Error, B>
): (ma: TaskEither<Error, A>) => TaskEither<Error, B> {
    return chain(
        flow(
            f,
            fromEither
        )
    );
}

function fromThunk<A>(thunk: Lazy<Promise<A>>): TaskEither<Error, A> {
    return tryCatch(thunk, toError);
}

export const getUserId = (): TaskEither<Error, Number> => {
    const retrieveUserId: Lazy<Promise<Number>> = () => new Promise<Number>((resolve: Function, _reject: Function) => {
        resolve(1000);
    });
    
    const validUserId = (userId: Number): Either<Error, Number> => 
        userId === 1000 ? right(0) : left(new Error("userId is not valid"));        
    

    return pipe(
        retrieveUserId,
        fromThunk,
        chainEither(validUserId)
    );
}


//ignore...
export const task = (input: String) => new Promise<string>((resolve: Function, reject: Function) => {
    if (input === 'success') resolve('ok');
    reject(new Error('Task failed'));
})


// type Dependency<T> = {
    //     name: string,
    //     instance: T
    // }
    
    // type Task<T> = {
    //     fork: T
    //     chain: Task<T>
    // }

// const taskChain = (f: Function, fork: Function) =>
//     //we return another fork
//     (reject, resolve) => {
//         // calling `f` with the eventual value
//         // gives us another `fork` function
//         // so we call it
//         const next = x => f(x)(reject, resolve)
//         fork(reject, next)
//     