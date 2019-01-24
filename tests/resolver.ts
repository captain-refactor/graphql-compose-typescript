import {test} from "../src/ava";
import {graphql} from "graphql";
import {schemaComposer} from "graphql-compose";
import {$field} from "../src";
import {$arg} from "../src/decorators/arg";


// test('resolver instances should have', async t => {
//
//     class HelloResolver {
//         @$field()
//         hello(@$arg()name: string): string {
//             return 'hello ' + name;
//         }
//     }
//
//     let composer = t.context.compose.getComposer(HelloResolver);
//     t.truthy(composer);
//     t.log(composer.getResolvers());
//     t.true(composer.hasResolver('hello'));
//     let instance = new HelloResolver;
//     composer.getResolver('hello').wrapResolve(next => rp => {
//         rp.context.container = {
//             get() {
//                 return instance;
//             }
//         };
//         next(rp);
//     });
//     let result = await graphql(schemaComposer.buildSchema(), `
//     {
//         hello
//     }
//     `);
//     t.log(result);
// });

test('how does resolve work', async t => {
    t.pass();
});